-- ================================================
-- 綜合修正：疲勞監測邏輯優化
-- 修正內容：
-- 1. 確保所有指標在無數據時回傳 'gray'
-- 2. get_player_fatigue_metrics 增加數據判定守衛
-- 3. 修正 PSI 無數據時誤判為紅色的問題
-- 日期: 2026-01-19
-- ================================================

-- 1. 修正 PSI 計算邏輯
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
  -- 如果兩者都沒數據，直接回傳灰色
  IF p_wellness_total IS NULL AND (p_training_load_au IS NULL OR p_training_load_au = 0) THEN
    RETURN jsonb_build_object(
      'psi_score', 0,
      'wellness_component', 0,
      'load_component', 0,
      'status', 'gray'
    );
  END IF;

  -- 1. 身心狀態分 (0-100)
  IF p_wellness_total IS NULL THEN
    v_wellness_score := 50; -- 無數據時給中性分，避免拉低總分
  ELSE
    v_wellness_score := (p_wellness_total::DECIMAL / 25.0) * 100.0;
  END IF;
  
  -- 2. sRPE 狀態分
  IF p_training_load_au IS NULL OR p_training_load_au = 0 THEN
    v_load_score := 100;
  ELSIF p_training_load_au < 400 THEN
    v_load_score := 90;
  ELSIF p_training_load_au < 600 THEN
    v_load_score := 80;
  ELSE
    v_load_score := 60;
  END IF;
  
  -- 3. 計算 PSI (權重：身心 0.6, 負荷 0.4)
  v_psi_score := ROUND((v_wellness_score * 0.6) + (v_load_score * 0.4), 0);
  
  -- 4. 判斷狀態
  IF v_psi_score >= 80 THEN
    v_status := 'green';
  ELSIF v_psi_score >= 60 THEN
    v_status := 'yellow';
  ELSE
    v_status := 'red';
  END IF;

  RETURN jsonb_build_object(
    'psi_score', v_psi_score,
    'wellness_component', ROUND(v_wellness_score * 0.6, 1),
    'load_component', ROUND(v_load_score * 0.4, 1),
    'status', v_status
  );
END;
$$ LANGUAGE plpgsql;

-- 2. 修正綜合查詢函數
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
  v_has_any_recent_data BOOLEAN;
BEGIN
  -- 守衛檢查：先看過去 28 天是否有任何數據
  SELECT EXISTS (
    SELECT 1 FROM sport.daily_records 
    WHERE player_id = p_player_id 
    AND record_date BETWEEN (p_date - INTERVAL '27 days') AND p_date
  ) INTO v_has_any_recent_data;

  -- 如果連 ACWR 的基礎數據都沒，直接回傳全灰
  IF NOT v_has_any_recent_data THEN
    RETURN jsonb_build_object(
      'date', p_date,
      'acwr', jsonb_build_object('risk_level', 'gray', 'acwr', NULL, 'short_term_load', 0, 'long_term_load', 0),
      'psi', jsonb_build_object('status', 'gray', 'psi_score', 0),
      'rhr', jsonb_build_object('status', 'gray', 'current_rhr', NULL, 'difference', 0),
      'wellness', jsonb_build_object('status', 'gray', 'total', 0, 'items', null),
      'srpe', jsonb_build_object('status', 'gray', 'load_au', 0, 'score', 0),
      'honesty', jsonb_build_object('conflict_type', 'none', 'honesty_score', 100, 'message', '尚無數據')
    );
  END IF;

  -- 1. 取得今日紀錄
  SELECT * INTO v_record 
  FROM sport.daily_records 
  WHERE player_id = p_player_id AND record_date = p_date;
  
  -- 2. 計算各指標 (ACWR 跟 RHR 基準即便今天沒填也能算)
  v_acwr_data := sport.calculate_ewma_acwr(p_player_id, p_date);
  v_rhr_data := sport.calculate_rhr_baseline(p_player_id, p_date);
  
  -- PSI, Honesty, Wellness, sRPE 則依賴今日數據
  IF v_record.id IS NOT NULL THEN
    v_psi_data := sport.calculate_psi(v_record.wellness_total, v_record.training_load_au);
    v_honesty_data := sport.check_honesty_score(v_record.srpe_score, v_record.fatigue_level);
    
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
        ELSE 'red'
      END
    );
  ELSE
    -- 今日無資料，但因為有近期資料(ACWR)，其他今日指標設為灰色
    v_psi_data := jsonb_build_object('status', 'gray', 'psi_score', 0);
    v_honesty_data := jsonb_build_object('conflict_type', 'none', 'honesty_score', 100, 'message', '今日尚未填報');
    v_wellness_data := jsonb_build_object('status', 'gray', 'total', 0, 'items', null);
    v_srpe_data := jsonb_build_object('status', 'gray', 'load_au', 0, 'score', 0);
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
