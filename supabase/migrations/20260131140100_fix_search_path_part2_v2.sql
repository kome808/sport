-- ========================================================
-- Migration: Fix Search Path (Part 2 v2 - Logic & Demo)
-- Date: 2026-01-31
-- Description: 修正後版本，根據 Supabase 審查建議調整
-- Changes:
--   1. calculate_acwr_decoupled: 補上 LANGUAGE plpgsql 與 SECURITY DEFINER
--   2. ensure_demo_data: 修正 v_date 型別轉換 (顯式 ::DATE cast)
--   3. regenerate_demo_data: 修正 v_date 型別轉換
--   4. 統一 LANGUAGE plpgsql 與 SECURITY DEFINER 順序
--   5. 確保所有 statement 以分號結尾
-- ========================================================

-- 1. sport.calculate_daily_record_values (Trigger)
CREATE OR REPLACE FUNCTION sport.calculate_daily_record_values()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
  -- 計算 Wellness 總分
  NEW.wellness_total = COALESCE(NEW.sleep_quality, 0) 
                     + COALESCE(NEW.fatigue_level, 0) 
                     + COALESCE(NEW.mood, 0) 
                     + COALESCE(NEW.stress_level, 0) 
                     + COALESCE(NEW.muscle_soreness, 0);
  
  -- 計算訓練負荷 AU
  IF NEW.srpe_score IS NOT NULL AND NEW.training_minutes IS NOT NULL THEN
    NEW.training_load_au = NEW.srpe_score * NEW.training_minutes;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. sport.create_risk_notification (Trigger)
CREATE OR REPLACE FUNCTION sport.create_risk_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_player_name VARCHAR;
  v_team_id UUID;
BEGIN
  IF NEW.risk_level IN ('red', 'black') AND 
     (OLD.risk_level IS NULL OR OLD.risk_level NOT IN ('red', 'black')) THEN
    
    SELECT p.name, p.team_id INTO v_player_name, v_team_id
    FROM sport.players p WHERE p.id = NEW.player_id;
    
    INSERT INTO sport.notifications (team_id, player_id, type, title, message)
    VALUES (
      v_team_id,
      NEW.player_id,
      'risk_alert',
      '⚠️ 高風險警報',
      format('%s 的訓練負荷達到 %s 級風險，ACWR: %s，建議立即關注！', 
             v_player_name, 
             UPPER(NEW.risk_level), 
             COALESCE(NEW.acwr::TEXT, 'N/A'))
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. sport.calculate_ewma_acwr (Table) - Using latest logic (min 7 days)
CREATE OR REPLACE FUNCTION sport.calculate_ewma_acwr(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  acwr NUMERIC,
  chronic_load NUMERIC,
  acute_load NUMERIC,
  risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
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

  -- Require at least 7 days of actual training data
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

-- 4. sport.calculate_rhr_baseline (Table)
CREATE OR REPLACE FUNCTION sport.calculate_rhr_baseline(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  current_rhr INTEGER,
  baseline_rhr NUMERIC,
  difference NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
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
    RETURN QUERY SELECT NULL::INTEGER, ROUND(v_baseline, 1), NULL::NUMERIC, 'gray'::TEXT;
  ELSIF v_count < 3 THEN
    RETURN QUERY SELECT v_current_rhr, ROUND(v_baseline, 1), NULL::NUMERIC, 'gray'::TEXT;
  ELSE
    v_diff := v_current_rhr - v_baseline;
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

-- 5. sport.calculate_wellness_zscore (Table)
CREATE OR REPLACE FUNCTION sport.calculate_wellness_zscore(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_score INTEGER,
  z_score NUMERIC,
  avg_score NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_total INTEGER;
  v_avg NUMERIC;
  v_stddev NUMERIC;
  v_z NUMERIC;
  v_status TEXT;
  v_count INTEGER;
BEGIN
  SELECT wellness_total INTO v_total
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;

  IF v_total IS NULL THEN
     RETURN QUERY SELECT NULL::INTEGER, NULL::NUMERIC, NULL::NUMERIC, 'gray'::TEXT;
     RETURN;
  END IF;

  SELECT 
    AVG(wellness_total), STDDEV(wellness_total), COUNT(wellness_total)
  INTO v_avg, v_stddev, v_count
  FROM sport.daily_records
  WHERE player_id = p_player_id 
    AND record_date BETWEEN (p_date - INTERVAL '28 days') AND (p_date - INTERVAL '1 day')
    AND wellness_total IS NOT NULL;

  IF v_count < 7 THEN
    v_status := 'gray';
    v_z := NULL;
    v_avg := COALESCE(v_avg, 0);
  ELSIF v_count < 28 OR v_stddev IS NULL OR v_stddev = 0 THEN
    IF v_total < (v_avg * 0.8) THEN
        v_status := 'red';
    ELSIF v_total < (v_avg * 0.9) THEN 
        v_status := 'yellow';
    ELSE
        v_status := 'green';
    END IF;
    v_z := NULL;
  ELSE
    v_z := (v_total - v_avg) / v_stddev;
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

-- 6. sport.calculate_weekly_load_change (Table)
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_curr_load INTEGER;
  v_last_load INTEGER;
  v_pct NUMERIC;
  v_abs INTEGER;
  v_status TEXT;
  v_last_week_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(training_load_au), 0) INTO v_curr_load
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '6 days') AND p_date;

  SELECT 
    COALESCE(SUM(training_load_au), 0),
    COUNT(*) FILTER (WHERE training_load_au IS NOT NULL AND training_load_au > 0)
  INTO v_last_load, v_last_week_count
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '13 days') AND (p_date - INTERVAL '7 days');

  v_abs := v_curr_load - v_last_load;

  IF v_last_week_count < 3 THEN
    RETURN QUERY SELECT v_curr_load, v_last_load, NULL::NUMERIC, NULL::INTEGER, 'gray'::TEXT;
    RETURN;
  END IF;
  
  IF v_last_load > 0 THEN
    v_pct := ROUND(((v_curr_load - v_last_load)::NUMERIC / v_last_load) * 100, 1);
  ELSE
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

-- 7. sport.get_player_fatigue_metrics (JSONB)
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_metrics(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_acwr_data RECORD;
  v_rhr_data RECORD;
  v_wellness_data RECORD;
  v_load_data RECORD;
  v_daily_load INTEGER;
  v_wellness_detail JSONB;
  v_result JSONB;
BEGIN
  SELECT * INTO v_acwr_data FROM sport.calculate_ewma_acwr(p_player_id, p_date);
  SELECT * INTO v_rhr_data FROM sport.calculate_rhr_baseline(p_player_id, p_date);
  SELECT * INTO v_wellness_data FROM sport.calculate_wellness_zscore(p_player_id, p_date);
  
  SELECT jsonb_object_agg(key, value) INTO v_wellness_detail
  FROM (
    SELECT 'sleep' as key, sleep_quality as value FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'stress', stress_level FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'fatigue', fatigue_level FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'soreness', muscle_soreness FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'mood', mood FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
  ) t;

  SELECT training_load_au INTO v_daily_load
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;
  
  SELECT * INTO v_load_data FROM sport.calculate_weekly_load_change(p_player_id, p_date);

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
      'load_au', COALESCE(v_daily_load, 0),
      'weekly_load', v_load_data.current_week_load,
      'pct_change', v_load_data.pct_change,
      'abs_change', v_load_data.abs_change,
      'status', v_load_data.status
    )
  );

  RETURN v_result;
END;
$$;

-- 8. sport.calculate_acwr_decoupled (Table) - FIXED: 補上 LANGUAGE plpgsql 與 SECURITY DEFINER
CREATE OR REPLACE FUNCTION sport.calculate_acwr_decoupled(
    p_player_id UUID,
    p_date DATE
)
RETURNS TABLE (
    acute_load NUMERIC,
    chronic_load NUMERIC,
    acwr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
    v_acute NUMERIC := 0;
    v_chronic NUMERIC := 0;
    c_lambda_acute NUMERIC := 0.25;
    c_lambda_chronic NUMERIC := 0.07;
    r RECORD;
    v_ewma NUMERIC;
BEGIN
    -- Acute
    v_ewma := 0;
    FOR r IN SELECT d::DATE as date, COALESCE(dr.srpe_score * dr.training_minutes, 0) as load
             FROM generate_series(p_date - 6, p_date, '1 day'::interval) d
             LEFT JOIN sport.daily_records dr ON dr.record_date = d::DATE AND dr.player_id = p_player_id
             ORDER BY d::DATE ASC
    LOOP
        IF v_ewma = 0 AND r.load > 0 THEN v_ewma := r.load;
        ELSE v_ewma := (r.load * c_lambda_acute) + (v_ewma * (1 - c_lambda_acute)); END IF;
    END LOOP;
    v_acute := v_ewma;

    -- Chronic
    v_ewma := 0;
    FOR r IN SELECT d::DATE as date, COALESCE(dr.srpe_score * dr.training_minutes, 0) as load
             FROM generate_series(p_date - 27, p_date - 7, '1 day'::interval) d
             LEFT JOIN sport.daily_records dr ON dr.record_date = d::DATE AND dr.player_id = p_player_id
             ORDER BY d::DATE ASC
    LOOP
        IF v_ewma = 0 AND r.load > 0 THEN v_ewma := r.load;
        ELSE v_ewma := (r.load * c_lambda_chronic) + (v_ewma * (1 - c_lambda_chronic)); END IF;
    END LOOP;
    v_chronic := v_ewma;

    IF v_chronic = 0 THEN acwr := NULL;
    ELSE acwr := ROUND((v_acute / v_chronic)::NUMERIC, 2); END IF;

    acute_load := ROUND(v_acute, 1);
    chronic_load := ROUND(v_chronic, 1);
    RETURN NEXT;
END;
$$;

-- 9. sport.get_player_fatigue_status (JSONB) - From 023 (Status 2.0)
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
    
    SELECT 
        morning_heart_rate,
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

-- 10. sport.check_honesty_score (JSONB)
CREATE OR REPLACE FUNCTION sport.check_honesty_score(
  p_srpe_score INT,
  p_fatigue_level INT
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_honesty_score INT;
  v_message VARCHAR;
  v_conflict_type VARCHAR;
  v_gap INT;
BEGIN
  IF p_srpe_score IS NULL OR p_fatigue_level IS NULL THEN
    RETURN jsonb_build_object('honesty_score', NULL, 'status', 'unknown');
  END IF;

  v_gap := ABS(p_srpe_score - (6 - p_fatigue_level));
  v_honesty_score := 100 - (v_gap * 10);
  
  IF v_honesty_score < 0 THEN v_honesty_score := 0; END IF;
  
  IF v_honesty_score < 40 THEN
    v_conflict_type := 'severe';
    v_message := format('RPE %s 但疲勞度 %s (分數 %s)', p_srpe_score, p_fatigue_level, v_honesty_score);
  ELSIF v_honesty_score < 70 THEN
    v_conflict_type := 'moderate';
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
$$;

-- 11. sport.calculate_psi (JSONB)
CREATE OR REPLACE FUNCTION sport.calculate_psi(
  p_wellness_total INT,
  p_training_load_au INT
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_wellness_score DECIMAL;
  v_load_score DECIMAL;
  v_psi_score DECIMAL;
  v_status VARCHAR;
BEGIN
  IF p_wellness_total IS NULL THEN
    v_wellness_score := 0;
  ELSE
    v_wellness_score := (p_wellness_total::DECIMAL / 25.0) * 100.0;
  END IF;
  
  IF p_training_load_au IS NULL OR p_training_load_au = 0 THEN
    v_load_score := 100;
  ELSIF p_training_load_au < 400 THEN 
    v_load_score := 90;
  ELSIF p_training_load_au < 600 THEN 
    v_load_score := 80;
  ELSE 
    v_load_score := 60;
  END IF;
  
  v_psi_score := ROUND((v_wellness_score * 0.6) + (v_load_score * 0.4), 0);
  
  IF v_psi_score >= 80 THEN v_status := 'green';
  ELSIF v_psi_score >= 60 THEN v_status := 'yellow';
  ELSE v_status := 'red';
  END IF;

  RETURN jsonb_build_object(
    'psi_score', v_psi_score,
    'wellness_component', ROUND(v_wellness_score * 0.6, 1),
    'load_component', ROUND(v_load_score * 0.4, 1),
    'status', v_status
  );
END;
$$;

-- 12. sport.get_team_fatigue_overview (JSONB)
CREATE OR REPLACE FUNCTION sport.get_team_fatigue_overview(
  p_team_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_player RECORD;
  v_metrics JSONB;
BEGIN
  FOR v_player IN 
    SELECT id, name, jersey_number, avatar_url, position
    FROM sport.players
    WHERE team_id = p_team_id AND is_active = true
    ORDER BY jersey_number ASC
  LOOP
    v_metrics := sport.get_player_fatigue_metrics(v_player.id, p_date);
    
    v_result := v_result || jsonb_build_object(
      'player', jsonb_build_object(
        'id', v_player.id,
        'name', v_player.name,
        'jersey_number', v_player.jersey_number,
        'avatar_url', v_player.avatar_url,
        'position', v_player.position
      ),
      'metrics', v_metrics
    );
  END LOOP;
  RETURN v_result;
END;
$$;

-- 18. sport.clear_demo_data
-- FIX: DROP before CREATE to handle return type changes
DROP FUNCTION IF EXISTS sport.clear_demo_data(text) CASCADE;

CREATE OR REPLACE FUNCTION sport.clear_demo_data(p_team_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = p_team_slug;
  IF v_team_id IS NOT NULL THEN
    -- 刪除所有相關紀錄
    DELETE FROM sport.daily_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.wellness_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.training_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.pain_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.pain_reports WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.training_loads WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
  END IF;
END;
$$;

-- 19. sport.ensure_demo_data
-- FIX: DROP before CREATE
DROP FUNCTION IF EXISTS sport.ensure_demo_data(text, int) CASCADE;

CREATE OR REPLACE FUNCTION sport.ensure_demo_data(p_team_slug TEXT, p_days_back INTEGER DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_team_id UUID;
  v_player RECORD;
  v_date DATE;
  v_start_date DATE;
  v_count INT;
BEGIN
  -- 1. Get Team ID
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = p_team_slug;
  IF v_team_id IS NULL THEN
    RAISE NOTICE 'Team % not found', p_team_slug;
    RETURN; -- Or raise exception
  END IF;

  v_start_date := CURRENT_DATE - (p_days_back || ' days')::INTERVAL;

  -- 2. Iterate Players in Team
  FOR v_player IN SELECT id FROM sport.players WHERE team_id = v_team_id LOOP
    
    -- 3. Iterate Dates
    FOR i IN 0..(p_days_back - 1) LOOP
      v_date := (v_start_date + (i || ' days')::INTERVAL)::DATE; -- Explicit cast to DATE
      
      -- Check if record exists
      SELECT COUNT(*) INTO v_count FROM sport.daily_records 
      WHERE player_id = v_player.id AND record_date = v_date;
      
      IF v_count = 0 THEN
        -- Insert dummy data (simplified for ensure)
        INSERT INTO sport.daily_records (
          player_id, 
          record_date, 
          training_minutes, 
          rhr_bpm, 
          sleep_quality, 
          fatigue_level, 
          stress_level, 
          muscle_soreness, 
          mood, 
          energy_level
        ) VALUES (
          v_player.id,
          v_date,
          60 + floor(random() * 60)::INT,
          50 + floor(random() * 20)::INT,
          3 + floor(random() * 2)::INT, -- 3-5
          2 + floor(random() * 3)::INT, -- 2-4
          2 + floor(random() * 3)::INT,
          1 + floor(random() * 3)::INT,
          3 + floor(random() * 2)::INT,
          3 + floor(random() * 2)::INT
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 15. sport.regenerate_demo_data (FIXED: v_date 型別轉換)
-- FIX: 強制刪除舊版本 (有參數 & 無參數)
DROP FUNCTION IF EXISTS sport.regenerate_demo_data(text) CASCADE;
DROP FUNCTION IF EXISTS sport.regenerate_demo_data() CASCADE;

CREATE OR REPLACE FUNCTION sport.regenerate_demo_data(p_team_slug TEXT DEFAULT 'doraemon-baseball')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  v_team_id UUID;
  v_player_safe_id UUID; v_player_warn_id UUID; v_player_risk_id UUID;
  v_date DATE; i INT;
  v_rpe INT; v_minutes INT; v_rhr INT; v_sleep INT; v_fatigue INT; v_mood INT; v_stress INT; v_soreness INT;
BEGIN
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = p_team_slug;
  IF v_team_id IS NULL THEN RAISE EXCEPTION '找不到球隊 (doraemon-baseball)'; END IF;
  
  SELECT id INTO v_player_safe_id FROM sport.players WHERE team_id = v_team_id AND name = '出木杉';
  SELECT id INTO v_player_warn_id FROM sport.players WHERE team_id = v_team_id AND name = '技安';
  SELECT id INTO v_player_risk_id FROM sport.players WHERE team_id = v_team_id AND name = '大雄';

  IF v_player_safe_id IS NULL THEN SELECT id INTO v_player_safe_id FROM sport.players WHERE team_id = v_team_id LIMIT 1; END IF;
  IF v_player_warn_id IS NULL THEN SELECT id INTO v_player_warn_id FROM sport.players WHERE team_id = v_team_id AND id != v_player_safe_id LIMIT 1; END IF;
  IF v_player_risk_id IS NULL THEN SELECT id INTO v_player_risk_id FROM sport.players WHERE team_id = v_team_id AND id NOT IN (v_player_safe_id, v_player_warn_id) LIMIT 1; END IF;

  DELETE FROM sport.daily_records WHERE player_id IN (v_player_safe_id, v_player_warn_id, v_player_risk_id);

  FOR i IN 0..29 LOOP
    -- FIX: 顯式轉換為 DATE
    v_date := (CURRENT_DATE - (29 - i))::DATE;
    
    -- Safe
    v_rpe := 3 + floor(random() * 3); v_minutes := 90 + floor(random() * 30); v_sleep := 4 + floor(random() * 2); v_fatigue := 4 + floor(random() * 2); v_rhr := 50 + floor(random() * 5);
    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes) VALUES (v_player_safe_id, v_date, v_rhr, v_sleep, v_fatigue, 4, 4, 4, v_rpe, v_minutes);

    -- Warning
    IF i < 14 THEN v_rpe := 4 + floor(random() * 2); v_minutes := 90; ELSE v_rpe := 6 + floor(random() * 2); v_minutes := 120 + floor(random() * 30); END IF;
    v_sleep := 2 + floor(random() * 2); v_fatigue := 3 + floor(random() * 2); v_rhr := 58 + floor(random() * 6);
    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes) VALUES (v_player_warn_id, v_date, v_rhr, v_sleep, v_fatigue, 3, 3, 3, v_rpe, v_minutes);

    -- Risk
    IF i > 20 THEN v_rpe := 8 + floor(random() * 3); v_minutes := 150 + floor(random() * 60); ELSE v_rpe := 3 + floor(random() * 3); v_minutes := 60; END IF;
    v_sleep := 1 + floor(random() * 3); v_fatigue := 1 + floor(random() * 3); v_rhr := 65 + floor(random() * 10);
    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes) VALUES (v_player_risk_id, v_date, v_rhr, v_sleep, v_fatigue, 1, 1, 1, v_rpe, v_minutes);
  END LOOP;
  RAISE NOTICE '✅ 測試數據刷新完成';
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Part 2 v2 Migrations Applied (Fatigue Logic & Demo) - Fixed calculate_acwr_decoupled, ensure_demo_data, regenerate_demo_data';
END $$;
