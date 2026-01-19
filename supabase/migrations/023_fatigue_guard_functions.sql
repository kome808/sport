-- ================================================
-- Migration 023: FatigueGuard 2.0 Core Logic
-- Implements decoupled EWMA ACWR and Worst-Case Risk Analysis
-- ================================================

-- 1. 建立 ACWR 計算函數 (EWMA 解耦版)
-- 邏輯：
--   Acute Load (短期): EWMA(最近 7 天, lambda=0.25)
--   Chronic Load (長期): EWMA(第 8-28 天, lambda=0.07) -> 解耦，不包含最近 7 天
CREATE OR REPLACE FUNCTION sport.calculate_acwr_decoupled(
    p_player_id UUID,
    p_date DATE
)
RETURNS TABLE (
    acute_load NUMERIC,
    chronic_load NUMERIC,
    acwr NUMERIC
) AS $$
DECLARE
    v_acute NUMERIC := 0;
    v_chronic NUMERIC := 0;
    -- Lambda 值定義
    c_lambda_acute NUMERIC := 0.25; -- 2/(7+1) ≈ 0.25
    c_lambda_chronic NUMERIC := 0.07; -- 2/(21+1) ≈ 0.09, 但文獻常用 0.05-0.1，此處沿用計畫書 0.07
    
    -- 迭代變數
    r RECORD;
    v_ewma NUMERIC;
    v_sRPE NUMERIC;
    
    -- 日期範圍
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- ---------------------------------------------------
    -- A. 計算 Acute Load (短期負荷): 最近 7 天 (p_date - 6 ~ p_date)
    -- ---------------------------------------------------
    -- 為了計算 EWMA 準確，我們通常需要往前追溯一段時間預熱，但這裡簡化：
    -- 直接抓取過去 7 天的數據進行加權移動平均
    -- 更好的做法其實是遞迴儲存 daily_records 的 ewma 值，但為了即時計算彈性，我們先用迴圈算
    
    v_ewma := 0;
    -- 抓取最近 7 天的紀錄 (含今日)，若某日無紀錄則 sRPE=0
    -- generate_series 確保每一天都被遍歷到
    FOR r IN SELECT d::DATE as date, COALESCE(dr.srpe_score * dr.training_minutes, 0) as load
             FROM generate_series(p_date - 6, p_date, '1 day'::interval) d
             LEFT JOIN sport.daily_records dr ON dr.record_date = d::DATE AND dr.player_id = p_player_id
             ORDER BY d::DATE ASC
    LOOP
        -- EWMA 公式: (Value * lambda) + (Previous_EWMA * (1 - lambda))
        -- 第一天直接設為 Load (或 0)
        IF v_ewma = 0 AND r.load > 0 THEN
             v_ewma := r.load;
        ELSE
             v_ewma := (r.load * c_lambda_acute) + (v_ewma * (1 - c_lambda_acute));
        END IF;
    END LOOP;
    v_acute := v_ewma;

    -- ---------------------------------------------------
    -- B. 計算 Chronic Load (長期負荷): 第 8-28 天 (p_date - 27 ~ p_date - 7)
    -- ---------------------------------------------------
    v_ewma := 0;
    FOR r IN SELECT d::DATE as date, COALESCE(dr.srpe_score * dr.training_minutes, 0) as load
             FROM generate_series(p_date - 27, p_date - 7, '1 day'::interval) d
             LEFT JOIN sport.daily_records dr ON dr.record_date = d::DATE AND dr.player_id = p_player_id
             ORDER BY d::DATE ASC
    LOOP
        IF v_ewma = 0 AND r.load > 0 THEN
             v_ewma := r.load;
        ELSE
            v_ewma := (r.load * c_lambda_chronic) + (v_ewma * (1 - c_lambda_chronic));
        END IF;
    END LOOP;
    v_chronic := v_ewma;

    -- ---------------------------------------------------
    -- C. 計算 ACWR
    -- ---------------------------------------------------
    IF v_chronic = 0 THEN
        acwr := NULL; -- 避免除以零
    ELSE
        acwr := ROUND((v_acute / v_chronic)::NUMERIC, 2);
    END IF;

    acute_load := ROUND(v_acute, 1);
    chronic_load := ROUND(v_chronic, 1);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;


-- 2. 建立主要監測狀態函數 (FatigueGuard Status)
-- 實作木桶效應 (Worst-Case) 邏輯
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_status(
    p_player_id UUID,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    -- 指標數據
    v_acwr NUMERIC;
    v_rhr INTEGER;
    v_rhr_baseline INTEGER;
    v_wellness INTEGER;
    v_srpe INTEGER;
    
    -- 風險等級 (0:缺失, 1:綠, 2:黃, 3:紅)
    l_acwr INT := 0;
    l_rhr INT := 0;
    l_wellness INT := 0;
    l_srpe INT := 0;
    
    -- 最終結果
    v_overall_level INT := 0;
    v_cause TEXT := NULL;
    v_is_rest_day BOOLEAN := FALSE;
    v_filled_count INT := 0;
    v_missing_list TEXT[] := ARRAY[]::TEXT[];
    v_metrics JSONB;
BEGIN
    -- 1. 取得基礎數據
    -- ACWR (即時計算)
    SELECT acwr INTO v_acwr FROM sport.calculate_acwr_decoupled(p_player_id, p_date);
    
    -- 其他紀錄 (從 daily_records 讀取)
    -- 假設 rhr_baseline 存在於 players 表或 daily_records (這裡暫時從 daily_records 讀取或給預設值)
    -- 注意: 這裡簡化讀取，實際專案可能需要從 player_baselines 資料表讀取基準值
    SELECT 
        morning_heart_rate,
        (srpe_score * training_minutes), -- 計算 Total Load
        (COALESCE(sleep_quality,0) + COALESCE(fatigue_level,0) + COALESCE(mood,0) + COALESCE(stress_level,0) + COALESCE(muscle_soreness,0))
    INTO v_rhr, v_srpe, v_wellness
    FROM sport.daily_records 
    WHERE player_id = p_player_id AND record_date = p_date;

    -- 假定一個 RHR Baseline (未來應從資料庫讀取)
    v_rhr_baseline := 60; -- 暫定預設值，理想情況應查詢 players 表
    
    -- 2. 判定各指標風險等級 (依照 2.0 規格書)
    
    -- ACWR
    IF v_acwr IS NOT NULL THEN
        IF v_acwr > 1.5 THEN l_acwr := 3;
        ELSIF v_acwr > 1.3 THEN l_acwr := 2;
        ELSIF v_acwr < 0.8 THEN l_acwr := 1; -- 偏低視為安全(綠)或可考慮黃，規格書寫 0.8-1.3 為綠，<0.8 規格書備註安全
        ELSE l_acwr := 1;
        END IF;
        v_filled_count := v_filled_count + 1;
    ELSE
        v_missing_list := array_append(v_missing_list, 'ACWR');
    END IF;

    -- RHR
    IF v_rhr IS NOT NULL THEN
        DECLARE diff INT := v_rhr - v_rhr_baseline;
        BEGIN
            IF diff >= 8 THEN l_rhr := 3;
            ELSIF diff >= 4 THEN l_rhr := 2;
            ELSE l_rhr := 1;
            END IF;
        END;
        v_filled_count := v_filled_count + 1;
    ELSE
        v_missing_list := array_append(v_missing_list, 'RHR');
    END IF;

    -- Wellness (總分 5-25)
    -- 如果 daily_records 有任一子項目 NULL，這裡加總可能要注意，假設前端都有填
    -- 這裡簡單判斷：如果 v_wellness > 0 視為有填 (極端情況全填1分總分5)
    IF v_wellness > 0 THEN 
        IF v_wellness < 15 THEN l_wellness := 3;
        ELSIF v_wellness < 20 THEN l_wellness := 2;
        ELSE l_wellness := 1; -- >20
        END IF;
        v_filled_count := v_filled_count + 1;
    else
         v_missing_list := array_append(v_missing_list, 'Wellness');
    END IF;

    -- sRPE
    IF v_srpe IS NOT NULL THEN
        IF v_srpe >= 600 THEN l_srpe := 3;
        ELSIF v_srpe >= 400 THEN l_srpe := 2;
        ELSE l_srpe := 1;
        END IF;
        v_filled_count := v_filled_count + 1;
    ELSE
        v_missing_list := array_append(v_missing_list, 'sRPE');
    END IF;

    -- 3. 判定智慧休息日
    -- 邏輯：只有 sRPE=0 且 (Total Load = 0) 且 ACWR 以外數據都沒填(或 ACWR 沒算出來)
    -- 簡化版：如果 Training Load = 0，視為休息日
    IF v_srpe = 0 OR v_srpe IS NULL THEN
        v_is_rest_day := TRUE;
    END IF;

    -- 4. 計算整體狀態 (Worst-Case)
    -- 取 max(l_acwr, l_rhr, l_wellness, l_srpe)
    v_overall_level := GREATEST(l_acwr, l_rhr, l_wellness, l_srpe);
    
    -- 找出誘發原因 (Who caused the max level?)
    IF v_overall_level > 1 THEN
        IF l_acwr = v_overall_level THEN v_cause := 'ACWR';
        ELSIF l_rhr = v_overall_level THEN v_cause := 'RHR';
        ELSIF l_wellness = v_overall_level THEN v_cause := 'Wellness';
        ELSIF l_srpe = v_overall_level THEN v_cause := 'sRPE';
        END IF;
    END IF;
    
    -- 如果全部都沒填 (或只有休息日且沒其他數據)，Level 回歸 0
    IF v_filled_count = 0 THEN
        v_overall_level := 0;
    END IF;

    -- 組裝 JSON
    v_metrics := jsonb_build_object(
        'acwr', jsonb_build_object('value', v_acwr, 'level', l_acwr),
        'rhr', jsonb_build_object('value', v_rhr, 'level', l_rhr),
        'wellness', jsonb_build_object('value', v_wellness, 'level', l_wellness),
        'srpe', jsonb_build_object('value', v_srpe, 'level', l_srpe)
    );

    RETURN jsonb_build_object(
        'overall_level', v_overall_level,
        'cause', v_cause,
        'is_rest_day', v_is_rest_day,
        'completeness', jsonb_build_object(
            'filled', v_filled_count,
            'total', 4, -- 總共監測 4 大指標
            'missing', v_missing_list
        ),
        'metrics', v_metrics,
        'date', p_date
    );
END;
$$ LANGUAGE plpgsql;
