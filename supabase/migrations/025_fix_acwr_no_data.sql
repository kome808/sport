-- ================================================
-- 修正 ACWR 計算邏輯：無數據時應回傳 gray
-- 日期: 2026-01-19
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
  v_has_any_data BOOLEAN := FALSE; -- 新增：檢查是否有任何訓練數據
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
    -- 檢查是否有任何非零數據
    IF v_rec.load > 0 THEN
        v_has_any_data := TRUE;
    END IF;
    
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
  
  -- 關鍵修正：如果完全沒有訓練數據，直接回傳 gray
  IF NOT v_has_any_data THEN
    RETURN jsonb_build_object(
      'short_term_load', 0,
      'long_term_load', 0,
      'acwr', NULL,
      'risk_level', 'gray'
    );
  END IF;
  
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

-- 權限設定
GRANT EXECUTE ON FUNCTION sport.calculate_ewma_acwr TO authenticated, service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ ACWR 計算邏輯已修正：無數據時正確回傳 gray';
END $$;
