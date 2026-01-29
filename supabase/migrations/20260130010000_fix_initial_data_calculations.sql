-- ================================================
-- Fix ACWR and sRPE Calculations for New Players
-- Date: 2026-01-29
-- ================================================

-- 1. Fix ACWR: Require minimum data points before showing meaningful values
-- 
-- ACWR (Acute:Chronic Workload Ratio) 急慢性負荷比計算說明：
-- 
-- 計算方式：
--   - 急性負荷 (Acute Load)：使用 7 天的 EWMA (指數加權移動平均)
--   - 慢性負荷 (Chronic Load)：使用 28 天的 EWMA
--   - ACWR = 急性負荷 / 慢性負荷
--
-- 資料需求：
--   至少需要 **7 天的實際訓練資料**才會開始計算 ACWR
--   原因：
--     1. 急性負荷本身就需要 7 天的數據窗口
--     2. 少於 7 天時，EWMA 會過度受初始值影響，導致數值不準確
--     3. 避免新球員第一次填資料就顯示極端的風險值（如超標）
--
-- 當資料不足時，會回傳 gray 狀態，前端顯示「尚無基準數據」
--
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
  v_lambda_a NUMERIC := 2.0 / (7 + 1);
  v_lambda_c NUMERIC := 2.0 / (28 + 1);
  v_ewma_a NUMERIC := 0;
  v_ewma_c NUMERIC := 0;
  v_r RECORD;
  v_acwr NUMERIC;
  v_risk TEXT;
  v_start_date DATE;
  v_data_count INTEGER := 0;
BEGIN
  v_start_date := p_date - INTERVAL '35 days';

  -- Count actual data points
  SELECT COUNT(*) INTO v_data_count
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN v_start_date AND p_date
    AND training_load_au IS NOT NULL
    AND training_load_au > 0;

  -- Require at least 7 days of actual training data for meaningful ACWR
  IF v_data_count < 7 THEN
    RETURN QUERY SELECT NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, 'gray'::TEXT;
    RETURN;
  END IF;

  FOR v_r IN
    SELECT 
      d.date_sequence::DATE as record_date,
      COALESCE(dr.training_load_au, 0) as load
    FROM generate_series(v_start_date, p_date, '1 day'::INTERVAL) d(date_sequence)
    LEFT JOIN sport.daily_records dr ON dr.player_id = p_player_id AND dr.record_date = d.date_sequence::DATE
    ORDER BY d.date_sequence
  LOOP
    v_ewma_a := v_r.load * v_lambda_a + v_ewma_a * (1 - v_lambda_a);
    v_ewma_c := v_r.load * v_lambda_c + v_ewma_c * (1 - v_lambda_c);
  END LOOP;

  IF v_ewma_c = 0 THEN
    v_acwr := NULL;
  ELSE
    v_acwr := ROUND((v_ewma_a / v_ewma_c)::NUMERIC, 2);
  END IF;

  IF v_acwr IS NULL THEN
    v_risk := 'gray';
  ELSIF v_acwr >= 2.0 THEN
    v_risk := 'purple';
  ELSIF v_acwr >= 1.5 THEN
    v_risk := 'red';
  ELSIF v_acwr >= 1.3 THEN
    v_risk := 'yellow';
  ELSIF v_acwr < 0.8 THEN
    v_risk := 'yellow';
  ELSE
    v_risk := 'green';
  END IF;

  RETURN QUERY SELECT v_acwr, ROUND(v_ewma_c::NUMERIC, 1), ROUND(v_ewma_a::NUMERIC, 1), v_risk;
END;
$$;

-- 2. Fix sRPE Weekly Load Change: Require minimum data before showing percentage
--
-- sRPE 週變化率計算說明：
--
-- 計算方式：
--   - 本週負荷：近 7 天（包含今天）的訓練負荷總和
--   - 上週負荷：前 7-13 天的訓練負荷總和
--   - 週變化率 = ((本週負荷 - 上週負荷) / 上週負荷) × 100%
--
-- 資料需求：
--   至少需要**上週有 3 天的實際訓練資料**才會計算變化率
--   原因：
--     1. 比照 RHR 基準線的邏輯（也需要 3 天基準）
--     2. 少於 3 天時，基準不穩定，容易出現極端百分比（如 +100%）
--     3. 避免新球員第一筆資料就顯示誤導性的變化率
--
-- 當資料不足時，會回傳 gray 狀態和 NULL 變化率，前端顯示「尚無基準數據」
--
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
  v_curr_week_count INTEGER;
  v_last_week_count INTEGER;
BEGIN
  -- Count actual training days in current week
  SELECT 
    COALESCE(SUM(training_load_au), 0),
    COUNT(*) FILTER (WHERE training_load_au IS NOT NULL AND training_load_au > 0)
  INTO v_curr_load, v_curr_week_count
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '6 days') AND p_date;

  -- Count actual training days in last week
  SELECT 
    COALESCE(SUM(training_load_au), 0),
    COUNT(*) FILTER (WHERE training_load_au IS NOT NULL AND training_load_au > 0)
  INTO v_last_load, v_last_week_count
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '13 days') AND (p_date - INTERVAL '7 days');

  v_abs := v_curr_load - v_last_load;

  -- Require at least 3 days of data in LAST week for meaningful comparison
  -- (Like RHR baseline requirement)
  IF v_last_week_count < 3 THEN
    -- Not enough baseline data
    RETURN QUERY SELECT v_curr_load, v_last_load, NULL::NUMERIC, NULL::INTEGER, 'gray'::TEXT;
    RETURN;
  END IF;
  
  IF v_last_load > 0 THEN
    v_pct := ROUND(((v_curr_load - v_last_load)::NUMERIC / v_last_load) * 100, 1);
  ELSE
    -- Edge case: last week had records but all were 0
    IF v_curr_load > 0 THEN
       v_pct := 100.0;
    ELSE
       v_pct := 0.0;
    END IF;
  END IF;
  
  IF v_curr_load = 0 THEN
    v_status := 'gray';
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION sport.calculate_ewma_acwr(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.calculate_weekly_load_change(UUID, DATE) TO authenticated, service_role, anon;
