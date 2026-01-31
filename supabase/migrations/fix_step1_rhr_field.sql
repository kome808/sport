-- ========================================================
-- 修正步驟 1: 修正 get_player_fatigue_status 的心率欄位名稱
-- ========================================================
-- 優先級: 🟡 中 (Bug 修復)
-- 風險: 🟢 低 (修正錯誤的欄位引用)
-- 影響: 疲勞狀態計算功能
-- 可回滾: ✅ 是
-- ========================================================

-- ==================== 第一步：備份檢查 ====================
-- 檢查當前函式定義
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as current_definition
FROM pg_proc 
WHERE proname = 'get_player_fatigue_status' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sport');

-- 檢查 daily_records 欄位是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'sport' 
  AND table_name = 'daily_records' 
  AND column_name IN ('rhr_bpm', 'morning_heart_rate');

-- ==================== 第二步：執行修正 ====================
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_status(
    p_player_id UUID,
    p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
    v_acwr NUMERIC;
    v_rhr INTEGER;
    v_rhr_baseline INTEGER;
    v_wellness INTEGER;
    v_srpe INTEGER;
    l_acwr INT := 0;
    l_rhr INT := 0;
    l_wellness INT := 0;
    l_srpe INT := 0;
    v_overall_level INT := 0;
    v_cause TEXT := NULL;
    v_is_rest_day BOOLEAN := FALSE;
    v_filled_count INT := 0;
    v_missing_list TEXT[] := ARRAY[]::TEXT[];
    v_metrics JSONB;
BEGIN
    SELECT acwr INTO v_acwr FROM sport.calculate_acwr_decoupled(p_player_id, p_date);
    
    -- FIX: 將 morning_heart_rate 改為 rhr_bpm
    SELECT 
        rhr_bpm,  -- ← 修正：原本是 morning_heart_rate
        (srpe_score * training_minutes),
        (COALESCE(sleep_quality,0) + COALESCE(fatigue_level,0) + COALESCE(mood,0) + COALESCE(stress_level,0) + COALESCE(muscle_soreness,0))
    INTO v_rhr, v_srpe, v_wellness
    FROM sport.daily_records 
    WHERE player_id = p_player_id AND record_date = p_date;

    v_rhr_baseline := 60; 
    
    IF v_acwr IS NOT NULL THEN
        IF v_acwr > 1.5 THEN l_acwr := 3;
        ELSIF v_acwr > 1.3 THEN l_acwr := 2;
        ELSIF v_acwr < 0.8 THEN l_acwr := 1;
        ELSE l_acwr := 1;
        END IF;
        v_filled_count := v_filled_count + 1;
    ELSE
        v_missing_list := array_append(v_missing_list, 'ACWR');
    END IF;

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

    IF v_wellness > 0 THEN 
        IF v_wellness < 15 THEN l_wellness := 3;
        ELSIF v_wellness < 20 THEN l_wellness := 2;
        ELSE l_wellness := 1;
        END IF;
        v_filled_count := v_filled_count + 1;
    else
         v_missing_list := array_append(v_missing_list, 'Wellness');
    END IF;

    IF v_srpe IS NOT NULL THEN
        IF v_srpe >= 600 THEN l_srpe := 3;
        ELSIF v_srpe >= 400 THEN l_srpe := 2;
        ELSE l_srpe := 1;
        END IF;
        v_filled_count := v_filled_count + 1;
    ELSE
        v_missing_list := array_append(v_missing_list, 'sRPE');
    END IF;

    IF v_srpe = 0 OR v_srpe IS NULL THEN v_is_rest_day := TRUE; END IF;

    v_overall_level := GREATEST(l_acwr, l_rhr, l_wellness, l_srpe);
    
    IF v_overall_level > 1 THEN
        IF l_acwr = v_overall_level THEN v_cause := 'ACWR';
        ELSIF l_rhr = v_overall_level THEN v_cause := 'RHR';
        ELSIF l_wellness = v_overall_level THEN v_cause := 'Wellness';
        ELSIF l_srpe = v_overall_level THEN v_cause := 'sRPE';
        END IF;
    END IF;
    
    IF v_filled_count = 0 THEN v_overall_level := 0; END IF;

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
            'total', 4,
            'missing', v_missing_list
        ),
        'metrics', v_metrics,
        'date', p_date
    );
END;
$$;

-- ==================== 第三步：驗證修正 ====================
-- 測試函式是否可正常執行（使用展示球員 ID）
DO $$
DECLARE
    v_test_player_id UUID;
    v_result JSONB;
BEGIN
    -- 取得一個測試球員 ID
    SELECT id INTO v_test_player_id 
    FROM sport.players 
    WHERE team_id IN (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball')
    LIMIT 1;
    
    IF v_test_player_id IS NOT NULL THEN
        SELECT sport.get_player_fatigue_status(v_test_player_id, CURRENT_DATE) INTO v_result;
        RAISE NOTICE '✅ 測試成功，回傳結果: %', v_result;
    ELSE
        RAISE NOTICE '⚠️ 找不到測試球員';
    END IF;
END $$;

-- ==================== 回滾指令 (如需要) ====================
-- 若要回滾此變更，請執行以下註解中的 SQL：
/*
-- 回滾到舊版（使用 morning_heart_rate）
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_status(
    p_player_id UUID,
    p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
    v_acwr NUMERIC;
    v_rhr INTEGER;
    -- ... (其他變數)
BEGIN
    SELECT acwr INTO v_acwr FROM sport.calculate_acwr_decoupled(p_player_id, p_date);
    
    SELECT 
        morning_heart_rate,  -- 舊版欄位名稱
        (srpe_score * training_minutes),
        (COALESCE(sleep_quality,0) + COALESCE(fatigue_level,0) + COALESCE(mood,0) + COALESCE(stress_level,0) + COALESCE(muscle_soreness,0))
    INTO v_rhr, v_srpe, v_wellness
    FROM sport.daily_records 
    WHERE player_id = p_player_id AND record_date = p_date;
    
    -- ... (其餘邏輯相同)
END;
$$;
*/

DO $$
BEGIN
    RAISE NOTICE '✅ Step 1 完成：已修正 get_player_fatigue_status 的心率欄位名稱';
END $$;
