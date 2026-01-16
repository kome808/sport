-- ================================================
-- 球員疲勞監測模組 1.1 - RPC Functions
-- 日期: 2026-01-16
-- ================================================

-- 確保 sport schema 存在
CREATE SCHEMA IF NOT EXISTS sport;

-- ================================================
-- 1. 計算 EWMA ACWR (解耦版)
-- ================================================

CREATE OR REPLACE FUNCTION sport.calculate_ewma_acwr(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_short_term_load DECIMAL;
  v_long_term_load DECIMAL;
  v_acwr DECIMAL;
  v_risk_level VARCHAR;
  v_lambda_acute DECIMAL := 0.25; -- 2/(7+1)
  v_lambda_chronic DECIMAL := 0.07; -- 2/(28+1) 近似值
  
  -- 暫存變數
  v_daily_load INT;
  v_ewma_acute DECIMAL := 0;
  v_ewma_chronic DECIMAL := 0;
  v_rec RECORD;
BEGIN
  -- 使用 Recursive CTE 計算 28 天的 EWMA
  -- 這裡我們簡化處理：抓取過去 28 天的數據，按日處理
  -- 若某日無數據，視為 0
  
  FOR v_rec IN 
    SELECT 
      d.day,
      COALESCE(r.training_load_au, 0) as load
    FROM generate_series(p_date - INTERVAL '27 days', p_date, INTERVAL '1 day') AS d(day)
    LEFT JOIN sport.daily_records r ON r.record_date = d.day::DATE AND r.player_id = p_player_id
    ORDER BY d.day ASC
  LOOP
    -- 初始化 (如果是第一天)
    IF v_ewma_acute = 0 THEN 
        v_ewma_acute := v_rec.load;
        v_ewma_chronic := v_rec.load;
    ELSE
        -- EWMA 公式: Value * lambda + Previous * (1 - lambda)
        v_ewma_acute := (v_rec.load * v_lambda_acute) + (v_ewma_acute * (1 - v_lambda_acute));
        v_ewma_chronic := (v_rec.load * v_lambda_chronic) + (v_ewma_chronic * (1 - v_lambda_chronic));
    END IF;
  END LOOP;
  
  v_short_term_load := ROUND(v_ewma_acute, 1);
  v_long_term_load := ROUND(v_ewma_chronic, 1);
  
  -- 計算 ACWR
  IF v_long_term_load > 0 THEN
    v_acwr := ROUND((v_short_term_load / v_long_term_load), 2);
  ELSE
    v_acwr := NULL; -- 避免除以零
  END IF;
  
  -- 判斷風險等級
  IF v_acwr IS NULL THEN
    v_risk_level := 'gray'; -- 資料不足
  ELSIF v_acwr > 1.5 THEN
    v_risk_level := 'red'; -- 高風險
  ELSIF v_acwr >= 1.31 THEN
    v_risk_level := 'yellow'; -- 注意
  ELSIF v_acwr < 0.8 THEN
    v_risk_level := 'green'; -- 低負荷 (也是安全，但偏低)
    -- 註記：文檔中 <0.8 是"低負荷"但綠色，0.8-1.3 也是綠色。這裡統稱綠色，這只是 UI 顯示用的狀態
  ELSE
    v_risk_level := 'green'; -- 安全 (0.8 - 1.3)
  END IF;

  RETURN jsonb_build_object(
    'short_term_load', v_short_term_load,
    'long_term_load', v_long_term_load,
    'acwr', v_acwr,
    'risk_level', v_risk_level
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. 計算 PSI (整體狀態指數)
-- ================================================

CREATE OR REPLACE FUNCTION sport.calculate_psi(
  p_wellness_total INT,
  p_training_load_au INT
)
RETURNS JSONB AS $$
DECLARE
  v_wellness_score DECIMAL;
  v_load_score DECIMAL;
  v_psi_score DECIMAL;
  v_status VARCHAR;
BEGIN
  -- 1. 身心狀態分 (0-100)
  -- Wellness 總分 5-25
  IF p_wellness_total IS NULL THEN
    v_wellness_score := 0;
  ELSE
    v_wellness_score := (p_wellness_total::DECIMAL / 25.0) * 100.0;
  END IF;
  
  -- 2. sRPE 狀態分
  IF p_training_load_au IS NULL OR p_training_load_au = 0 THEN
    v_load_score := 100;
  ELSIF p_training_load_au < 400 THEN -- 200-399
    v_load_score := 90;
  ELSIF p_training_load_au < 600 THEN -- 400-599
    v_load_score := 80;
  ELSE -- > 600
    v_load_score := 60;
  END IF;
  
  -- 3. 計算 PSI
  -- 權重：身心 0.6, 負荷 0.4
  v_psi_score := ROUND((v_wellness_score * 0.6) + (v_load_score * 0.4), 0);
  
  -- 4. 判斷狀態
  IF v_psi_score >= 80 THEN
    v_status := 'green'; -- 優秀
  ELSIF v_psi_score >= 60 THEN
    v_status := 'yellow'; -- 中等
  ELSE
    v_status := 'red'; -- 疲勞/高風險
  END IF;

  RETURN jsonb_build_object(
    'psi_score', v_psi_score,
    'wellness_component', ROUND(v_wellness_score * 0.6, 1),
    'load_component', ROUND(v_load_score * 0.4, 1),
    'status', v_status
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 3. 計算 RHR 基準變異
-- ================================================

CREATE OR REPLACE FUNCTION sport.calculate_rhr_baseline(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_baseline_rhr DECIMAL;
  v_current_rhr INT;
  v_diff INT;
  v_status VARCHAR;
BEGIN
  -- 取得今日 RHR
  SELECT rhr_bpm INTO v_current_rhr
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;
  
  -- 計算前 14 天平均 (不含今日)
  SELECT AVG(rhr_bpm) INTO v_baseline_rhr
  FROM sport.daily_records
  WHERE player_id = p_player_id 
    AND record_date >= (p_date - INTERVAL '14 days')
    AND record_date < p_date
    AND rhr_bpm IS NOT NULL;
    
  -- 若無基準 (例如新球員)，設為 NULL 或用今日代替
  -- 這裡若無基準，status 回傳 'gray'
  
  IF v_baseline_rhr IS NOT NULL AND v_current_rhr IS NOT NULL THEN
    v_diff := v_current_rhr - ROUND(v_baseline_rhr)::INT;
    
    -- 判斷狀態 (基準=50, +3正常, +5輕, +10中, +15高)
    -- 這裡使用絕對值或單向？心跳變快是疲勞，變慢通常還好(除非極端)
    -- 文檔：±3 bpm 正常, +5 bpm 輕疲勞
    
    IF v_diff >= 15 THEN
      v_status := 'red';
    ELSIF v_diff >= 10 THEN
      v_status := 'orange';
    ELSIF v_diff >= 5 THEN -- >= 5
      v_status := 'yellow';
    ELSE
      v_status := 'green'; -- < 5 (包含負值)
    END IF;
  ELSE
    v_diff := NULL;
    v_status := 'gray';
  END IF;

  RETURN jsonb_build_object(
    'baseline_rhr', ROUND(v_baseline_rhr, 1),
    'current_rhr', v_current_rhr,
    'difference', v_diff,
    'status', v_status
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. 誠實度檢測
-- ================================================

CREATE OR REPLACE FUNCTION sport.check_honesty_score(
  p_srpe_score INT,
  p_fatigue_level INT
)
RETURNS JSONB AS $$
DECLARE
  v_honesty_score INT;
  v_message VARCHAR;
  v_conflict_type VARCHAR;
  v_gap INT;
BEGIN
  -- 誠實度 = 100 - |sRPE - (6 - 疲勞度)| × 10
  -- 疲勞度 1-5 (1=不累?, 5=累?) Wait, check schema
  -- Schema: fatigue_level (1-5). 通常 1=Low fatigue, 5=High fatigue.
  -- Doc Logic: "sRPE 9-10 (極累) vs 4-5 (不累)" -> Wait.
  -- If fatigue_level 5 means "Very Tired", then sRPE 10 should match Fatigue 5.
  -- Doc says "4-5 (不累)"?? 
  -- Let's re-read doc: "極端矛盾1: 9-10(極累) vs 4-5(不累)"
  -- This implies 5 is "Not Tired"? That is unusual. RPE 10 is Max Effort.
  -- Schema comment check: `fatigue_level` INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 5)
  -- Usually 1=Good, 5=Bad in Wellness. 5=High Fatigue.
  -- But document might define Wellness differently.
  -- "身心狀態 (Wellness) ... 總分=睡眠+疲勞+心情+壓力+肌肉痠痛" -> Higher is better? 
  -- ACWR Doc: "20-25分 🟢良好", "<15 🔴不佳".
  -- So High Score = Good State. 
  -- If Wellness Total is sum of 5 items implies each item 5 is Good.
  -- So: Fatigue 5 = "Energetic/Fresh" (Good), Fatigue 1 = "Exhausted" (Bad).
  -- sRPE 10 = Hard. Fatigue 5 (Fresh) -> Conflict! 
  -- sRPE 0 = Easy. Fatigue 1 (Exhausted) -> Conflict!
  -- Formula: |sRPE - (6 - Fatigue)| 
  -- Test: sRPE=9, Fatigue=5(Fresh) -> |9 - (6-5)| = |9-1| = 8. Diff=8. Score = 100 - 80 = 20. Correct.
  -- Test: sRPE=9, Fatigue=1(Tired) -> |9 - (6-1)| = |9-5| = 4. Diff=4. Score = 100 - 40 = 60. (Still some gap, but better)
  -- Wait, sRPE 10 should map to "Very Tired". If 1=Tired, then valid map is sRPE high ~ Fatigue low.
  -- Formula Check: (6 - Fatigue) converts 1..5 to 5..1.
  -- If Fatigue=1(Tired), (6-1)=5. sRPE=10. |10-5|=5. Gap 5. Score=50. 
  -- It seems the scale mapping is sRPE(0-10) vs InvertedFatigue(1-5 scaled to 2-10?).
  -- The formula seems to punish any large deviation.
  
  IF p_srpe_score IS NULL OR p_fatigue_level IS NULL THEN
    RETURN jsonb_build_object('honesty_score', NULL, 'status', 'unknown');
  END IF;

  v_gap := ABS(p_srpe_score - (6 - p_fatigue_level));
  v_honesty_score := 100 - (v_gap * 10);
  
  IF v_honesty_score < 0 THEN v_honesty_score := 0; END IF;
  
  -- 定義衝突類型
  IF v_honesty_score < 40 THEN
    v_conflict_type := 'severe'; -- 嚴重矛盾
    v_message := format('RPE %s 但疲勞度 %s (分數 %s)', p_srpe_score, p_fatigue_level, v_honesty_score);
  ELSIF v_honesty_score < 70 THEN
    v_conflict_type := 'moderate'; -- 中度
    v_message := '數值略有不符';
  ELSE
    v_conflict_type := 'none';
    v_message := '正常';
  END IF;

  RETURN jsonb_build_object(
    'honesty_score', v_honesty_score,
    'conflict_type', v_conflict_type,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. 綜合查詢: 取得球員疲勞指標
-- ================================================

CREATE OR REPLACE FUNCTION sport.get_player_fatigue_metrics(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_acwr_data JSONB;
  v_rhr_data JSONB;
  v_psi_data JSONB;
  v_honesty_data JSONB;
  v_record RECORD;
  v_wellness_data JSONB;
  v_srpe_data JSONB;
BEGIN
  -- 1. 取得基本紀錄
  SELECT * INTO v_record 
  FROM sport.daily_records 
  WHERE player_id = p_player_id AND record_date = p_date;
  
  -- 2. 計算各指標
  v_acwr_data := sport.calculate_ewma_acwr(p_player_id, p_date);
  
  v_rhr_data := sport.calculate_rhr_baseline(p_player_id, p_date);
  
  v_psi_data := sport.calculate_psi(v_record.wellness_total, v_record.training_load_au);
  
  v_honesty_data := sport.check_honesty_score(v_record.srpe_score, v_record.fatigue_level);
  
  -- 3. 建構 Wellness 物件 (Raw Data)
  IF v_record.id IS NOT NULL THEN
    v_wellness_data := jsonb_build_object(
      'total', v_record.wellness_total,
      'items', jsonb_build_object(
        'sleep', v_record.sleep_quality,
        'fatigue', v_record.fatigue_level,
        'mood', v_record.mood,
        'stress', v_record.stress_level,
        'soreness', v_record.muscle_soreness
      ),
      'status', CASE 
        WHEN v_record.wellness_total >= 20 THEN 'green'
        WHEN v_record.wellness_total >= 15 THEN 'yellow'
        ELSE 'red'
      END
    );
    
    v_srpe_data := jsonb_build_object(
      'score', v_record.srpe_score,
      'minutes', v_record.training_minutes,
      'load_au', v_record.training_load_au,
      'status', CASE
        WHEN v_record.training_load_au < 400 THEN 'green'
        WHEN v_record.training_load_au < 600 THEN 'yellow'
        ELSE 'red' -- > 600
      END
    );
  ELSE
    -- 無當日資料
    v_wellness_data := NULL;
    v_srpe_data := NULL;
  END IF;

  RETURN jsonb_build_object(
    'date', p_date,
    'acwr', v_acwr_data,
    'psi', v_psi_data,
    'rhr', v_rhr_data,
    'wellness', v_wellness_data,
    'srpe', v_srpe_data,
    'honesty', v_honesty_data
  );
END;
$$ LANGUAGE plpgsql;

-- 權限設定 (確保 Authenticated User 可執行)
GRANT EXECUTE ON FUNCTION sport.calculate_ewma_acwr TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sport.calculate_psi TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sport.calculate_rhr_baseline TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sport.check_honesty_score TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sport.get_player_fatigue_metrics TO authenticated, service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ 疲勞監測模組 RPC 函數部署完成';
END $$;
