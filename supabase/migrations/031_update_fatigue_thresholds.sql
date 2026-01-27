-- ================================================
-- 球員疲勞監測模組 1.2 - 參數更新與邏輯調整 (2026-01-28)
-- 
-- 1. ACWR: 新增 'purple' (≥ 2.0), 低負荷 (< 0.8) 改為 'yellow'
-- 2. RHR: 基準線 14 天 -> 7 天, 閾值 +5/+10
-- 3. Wellness: 引入 Z-score (< -2) 與 10 分制 (滿分 50)
-- 4. Load: 引入週變化率 (> 15% 或 > 1000 AU)
-- ================================================

-- 1. 更新 ACWR 函數 (包含紫燈與低負荷修正)
CREATE OR REPLACE FUNCTION sport.calculate_ewma_acwr(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  acwr NUMERIC,
  chronic_load NUMERIC,
  acute_load NUMERIC,
  risk_level TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_lambda_a NUMERIC := 2.0 / (7 + 1);  -- Acute: 7 days
  v_lambda_c NUMERIC := 2.0 / (28 + 1); -- Chronic: 28 days
  v_ewma_a NUMERIC := 0;
  v_ewma_c NUMERIC := 0;
  v_r RECORD;
  v_acwr NUMERIC;
  v_risk TEXT;
  v_start_date DATE;
BEGIN
  -- 抓取過去 28 天前的起始點，多抓幾天確保有初始值
  v_start_date := p_date - INTERVAL '35 days';

  -- 迴圈計算每一天的 EWMA
  FOR v_r IN
    SELECT 
      d.date_sequence::DATE as record_date,
      COALESCE(dr.monitoring_load, 0) as load
    FROM generate_series(v_start_date, p_date, '1 day'::INTERVAL) d(date_sequence)
    LEFT JOIN sport.daily_records dr ON dr.player_id = p_player_id AND dr.record_date = d.date_sequence::DATE
    ORDER BY d.date_sequence
  LOOP
    -- EWMA 公式: Value_today * lambda + Value_yesterday * (1 - lambda)
    v_ewma_a := v_r.load * v_lambda_a + v_ewma_a * (1 - v_lambda_a);
    v_ewma_c := v_r.load * v_lambda_c + v_ewma_c * (1 - v_lambda_c);
  END LOOP;

  -- 計算最終 ACWR
  IF v_ewma_c = 0 THEN
    v_acwr := NULL; -- 避免除以零
  ELSE
    v_acwr := ROUND((v_ewma_a / v_ewma_c)::NUMERIC, 2);
  END IF;

  -- 判斷風險等級 (更新版閾值)
  -- >= 2.0: purple (極高風險)
  -- 1.5 - 1.99: red (高風險)
  -- 1.3 - 1.49: yellow (注意)
  -- 0.8 - 1.29: green (安全)
  -- < 0.8: yellow (低負荷/訓練不足風險)
  
  IF v_acwr IS NULL THEN
    v_risk := 'gray';
  ELSIF v_acwr >= 2.0 THEN
    v_risk := 'purple'; -- [NEW] 極高風險
  ELSIF v_acwr >= 1.5 THEN
    v_risk := 'red';
  ELSIF v_acwr >= 1.3 THEN
    v_risk := 'yellow';
  ELSIF v_acwr < 0.8 THEN
    v_risk := 'yellow'; -- [MODIFIED] 低負荷改為黃燈
  ELSE
    v_risk := 'green';
  END IF;

  RETURN QUERY SELECT v_acwr, ROUND(v_ewma_c::NUMERIC, 1), ROUND(v_ewma_a::NUMERIC, 1), v_risk;
END;
$$;


-- 2. 更新 RHR 基準線函數 (14天 -> 7天, 閾值調整)
CREATE OR REPLACE FUNCTION sport.calculate_rhr_baseline(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  current_rhr INTEGER,
  baseline_rhr NUMERIC,
  difference NUMERIC,
  status TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_rhr INTEGER;
  v_baseline NUMERIC;
  v_diff NUMERIC;
  v_status TEXT;
  v_count INTEGER;
BEGIN
  -- 取得當日 RHR
  SELECT rhr_bpm INTO v_current_rhr
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;

  -- 計算基準線：過去 7 天 (不含當日)
  SELECT 
    AVG(rhr_bpm), COUNT(rhr_bpm)
  INTO v_baseline, v_count
  FROM sport.daily_records
  WHERE player_id = p_player_id 
    AND record_date BETWEEN (p_date - INTERVAL '7 days') AND (p_date - INTERVAL '1 day')
    AND rhr_bpm IS NOT NULL AND rhr_bpm > 0;

  -- 判斷邏輯
  IF v_current_rhr IS NULL THEN
    -- 無當日數據
    RETURN QUERY SELECT NULL::INTEGER, ROUND(v_baseline, 1), NULL::NUMERIC, 'gray'::TEXT;
  ELSIF v_count < 3 THEN
    -- 歷史數據不足 3 天，無法建立有效基準
    RETURN QUERY SELECT v_current_rhr, ROUND(v_baseline, 1), NULL::NUMERIC, 'gray'::TEXT;
  ELSE
    -- 計算差異與狀態
    v_diff := v_current_rhr - v_baseline;
    
    -- [MODIFIED] 閾值調整
    -- >= 10: red (嚴重風險)
    -- >= 5: yellow (高風險)
    -- Others: green
    IF v_diff >= 10 THEN
      v_status := 'red';
    ELSIF v_diff >= 5 THEN
      v_status := 'yellow';
    ELSE
      v_status := 'green';
    END IF;

    RETURN QUERY SELECT v_current_rhr, ROUND(v_baseline, 1), ROUND(v_diff, 1), v_status;
  END IF;
END;
$$;


-- 3. [NEW] 計算 Wellness Z-score 與狀態
-- 說明：計算當日總分與過去 28 天平均的 Z-score
-- 若不足 28 天 (但 > 7 天)，使用 20% 下降法則
CREATE OR REPLACE FUNCTION sport.calculate_wellness_zscore(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_score INTEGER,
  z_score NUMERIC,
  avg_score NUMERIC,
  status TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
  v_avg NUMERIC;
  v_stddev NUMERIC;
  v_z NUMERIC;
  v_status TEXT;
  v_count INTEGER;
  v_fallback BOOLEAN := FALSE;
BEGIN
  -- 取得當日 Wellness 總分
  SELECT wellness_total INTO v_total
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;

  IF v_total IS NULL THEN
     RETURN QUERY SELECT NULL::INTEGER, NULL::NUMERIC, NULL::NUMERIC, 'gray'::TEXT;
     RETURN;
  END IF;

  -- 計算過去 28 天統計數據 (不包含當日)
  SELECT 
    AVG(wellness_total), STDDEV(wellness_total), COUNT(wellness_total)
  INTO v_avg, v_stddev, v_count
  FROM sport.daily_records
  WHERE player_id = p_player_id 
    AND record_date BETWEEN (p_date - INTERVAL '28 days') AND (p_date - INTERVAL '1 day')
    AND wellness_total IS NOT NULL;

  -- 判斷是否使用 Fallback 或無法計算
  IF v_count < 7 THEN
    -- 資料嚴重不足 (<7天)，無法判斷
    v_status := 'gray';
    v_z := NULL;
    v_avg := COALESCE(v_avg, 0);
  ELSIF v_count < 28 OR v_stddev IS NULL OR v_stddev = 0 THEN
    -- 資料不足 28 天 或 標準差為 0 (分數都一樣)，使用 Fallback: 20% Drop Rule
    -- 邏輯: 如果今天分數比平均低 20% 以上 => Red
    IF v_total < (v_avg * 0.8) THEN
        v_status := 'red';
    ELSIF v_total < (v_avg * 0.9) THEN 
        v_status := 'yellow'; -- 10% Drop 算黃燈提示
    ELSE
        v_status := 'green';
    END IF;
    v_z := NULL; -- Fallback 模式不回傳 Z-score
  ELSE
    -- 正常 Z-score 模式
    v_z := (v_total - v_avg) / v_stddev;
    
    -- 閾值: Z < -2 => Red, -2 <= Z < -1 => Yellow, Z >= -1 => Green
    IF v_z < -2 THEN
      v_status := 'red';
    ELSIF v_z < -1 THEN
      v_status := 'yellow';
    ELSE
      v_status := 'green';
    END IF;
  END IF;

  RETURN QUERY SELECT v_total, ROUND(v_z, 2), ROUND(v_avg, 1), v_status;
END;
$$;


-- 4. [NEW] 計算週負荷變化率 (Weekly Load Change)
-- 說明：比較本週(過去7天)與上週(再前7天)的總負荷
-- 紅燈: 變化率 > 15% 或 增量 > 1000 AU
CREATE OR REPLACE FUNCTION sport.calculate_weekly_load_change(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  current_week_load INTEGER,
  last_week_load INTEGER,
  pct_change NUMERIC,
  abs_change INTEGER,
  status TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_curr_load INTEGER;
  v_last_load INTEGER;
  v_pct NUMERIC;
  v_abs INTEGER;
  v_status TEXT;
BEGIN
  -- 本週總負荷 (包含 p_date 的過去 7 天)
  SELECT COALESCE(SUM(training_load_au), 0) INTO v_curr_load
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '6 days') AND p_date;

  -- 上週總負荷 (前 8~14 天)
  SELECT COALESCE(SUM(training_load_au), 0) INTO v_last_load
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '13 days') AND (p_date - INTERVAL '7 days');

  -- 計算變化
  v_abs := v_curr_load - v_last_load;
  
  IF v_last_load > 0 THEN
    v_pct := ROUND(((v_curr_load - v_last_load)::NUMERIC / v_last_load) * 100, 1);
  ELSE
    IF v_curr_load > 0 THEN
       v_pct := 100.0; -- 上週 0，本週有，算 100% 增加
    ELSE
       v_pct := 0.0;
    END IF;
  END IF;

  -- 判斷狀態
  -- 紅燈: pct > 15% OR abs > 1000
  -- 黃燈: pct > 10%
  -- 綠燈: Else
  
  IF v_curr_load = 0 THEN
    v_status := 'gray'; -- 本週沒練
  ELSIF v_pct > 15 OR v_abs > 1000 THEN
    v_status := 'red';
  ELSIF v_pct > 10 THEN
    v_status := 'yellow';
  ELSE
    v_status := 'green';
  END IF;

  RETURN QUERY SELECT v_curr_load, v_last_load, v_pct, v_abs, v_status;
END;
$$;


-- 5. 更新主聚合函數 get_player_fatigue_metrics 以整合新邏輯
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_metrics(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_acwr_data RECORD;
  v_rhr_data RECORD;
  v_wellness_data RECORD;  -- 改為 Z-score 結構
  v_load_data RECORD;      -- 改為週變化結構
  v_daily_load INTEGER;    -- 單日 load 還是要回傳顯示
  v_wellness_detail JSONB;
  v_result JSONB;
BEGIN
  -- 1. ACWR
  SELECT * INTO v_acwr_data FROM sport.calculate_ewma_acwr(p_player_id, p_date);
  
  -- 2. RHR
  SELECT * INTO v_rhr_data FROM sport.calculate_rhr_baseline(p_player_id, p_date);
  
  -- 3. Wellness (Z-score)
  SELECT * INTO v_wellness_data FROM sport.calculate_wellness_zscore(p_player_id, p_date);
  
  -- 3.1 Wellness Detail Items
  SELECT jsonb_object_agg(key, value) INTO v_wellness_detail
  FROM (
    SELECT 'sleep' as key, sleep_quality as value FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'stress', stress_level FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'fatigue', fatigue_level FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'soreness', muscle_soreness FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'mood', mood FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
  ) t;

  -- 4. Load (Weekly Change) & Daily Load
  SELECT training_load_au INTO v_daily_load
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;
  
  SELECT * INTO v_load_data FROM sport.calculate_weekly_load_change(p_player_id, p_date);

  -- 5. Construct JSON
  v_result := jsonb_build_object(
    'acwr', jsonb_build_object(
      'acwr', v_acwr_data.acwr,
      'chronic_load', v_acwr_data.chronic_load,
      'acute_load', v_acwr_data.acute_load,
      'risk_level', v_acwr_data.risk_level
    ),
    'rhr', jsonb_build_object(
      'current_rhr', v_rhr_data.current_rhr,
      'baseline_rhr', v_rhr_data.baseline_rhr,
      'difference', v_rhr_data.difference,
      'status', v_rhr_data.status
    ),
    'wellness', jsonb_build_object(
      'total', v_wellness_data.total_score,
      'z_score', v_wellness_data.z_score,
      'avg_score', v_wellness_data.avg_score,
      'status', v_wellness_data.status,
      'items', COALESCE(v_wellness_detail, '{}'::jsonb)
    ),
    'srpe', jsonb_build_object(
      'load_au', COALESCE(v_daily_load, 0), -- 為了前端顯示當日數值
      'weekly_load', v_load_data.current_week_load,
      'pct_change', v_load_data.pct_change,
      'abs_change', v_load_data.abs_change,
      'status', v_load_data.status
    )
  );

  RETURN v_result;
END;
$$;
