BEGIN;

-- ================================================
-- 0.1 移除舊的 Check Constraints (避免 Update 失敗)
-- ================================================
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_sleep_quality_check;
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_fatigue_level_check;
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_stress_level_check;
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_muscle_soreness_check;
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_mood_check;
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_wellness_total_check;
ALTER TABLE sport.daily_records DROP CONSTRAINT IF EXISTS daily_records_srpe_score_check;

-- ================================================
-- 0.2 清理舊函數 (確保簽名更新)
-- ================================================
DROP FUNCTION IF EXISTS sport.get_player_fatigue_metrics(UUID, DATE);
DROP FUNCTION IF EXISTS sport.calculate_ewma_acwr(UUID, DATE);
DROP FUNCTION IF EXISTS sport.calculate_rhr_baseline(UUID, DATE);
DROP FUNCTION IF EXISTS sport.calculate_wellness_zscore(UUID, DATE);
DROP FUNCTION IF EXISTS sport.calculate_weekly_load_change(UUID, DATE);
DROP FUNCTION IF EXISTS sport.regenerate_demo_data(TEXT);

-- ================================================
-- 1. 更新計算邏輯 (ACWR, RHR, Wellness, Load)
-- ================================================

-- 1.1 ACWR
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
BEGIN
  v_start_date := p_date - INTERVAL '35 days';

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

-- 1.2 RHR
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
  SELECT rhr_bpm INTO v_current_rhr
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;

  SELECT 
    AVG(rhr_bpm), COUNT(rhr_bpm)
  INTO v_baseline, v_count
  FROM sport.daily_records
  WHERE player_id = p_player_id 
    AND record_date BETWEEN (p_date - INTERVAL '7 days') AND (p_date - INTERVAL '1 day')
    AND rhr_bpm IS NOT NULL AND rhr_bpm > 0;

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

-- 1.3 Wellness Z-score
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

-- 1.4 Weekly Load Change
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
  SELECT COALESCE(SUM(training_load_au), 0) INTO v_curr_load
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '6 days') AND p_date;

  SELECT COALESCE(SUM(training_load_au), 0) INTO v_last_load
  FROM sport.daily_records
  WHERE player_id = p_player_id
    AND record_date BETWEEN (p_date - INTERVAL '13 days') AND (p_date - INTERVAL '7 days');

  v_abs := v_curr_load - v_last_load;
  
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

-- 1.5 Main Aggregator
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_metrics(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_acwr_data RECORD;
  v_rhr_data RECORD;
  v_wellness_data RECORD;
  v_load_data RECORD;
  v_daily_load INTEGER;
  v_wellness_detail JSONB;
  v_result JSONB;
  v_is_demo BOOLEAN;
BEGIN
  -- 1. Security Check for Anonymous Users (auth.uid() IS NULL = anonymous)
  IF auth.uid() IS NULL THEN
    SELECT t.is_demo INTO v_is_demo
    FROM sport.players p
    JOIN sport.teams t ON p.team_id = t.id
    WHERE p.id = p_player_id;

    IF v_is_demo IS NOT TRUE THEN
      RAISE EXCEPTION 'Access Denied: Login required for private player data.';
    END IF;
  END IF;

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

-- ================================================
-- 2. 轉換現有 Wellness 數據 (x2)
-- ================================================
UPDATE sport.daily_records
SET 
  sleep_quality = CASE WHEN sleep_quality <= 5 THEN sleep_quality * 2 ELSE sleep_quality END,
  fatigue_level = CASE WHEN fatigue_level <= 5 THEN fatigue_level * 2 ELSE fatigue_level END,
  stress_level = CASE WHEN stress_level <= 5 THEN stress_level * 2 ELSE stress_level END,
  muscle_soreness = CASE WHEN muscle_soreness <= 5 THEN muscle_soreness * 2 ELSE muscle_soreness END,
  mood = CASE WHEN mood <= 5 THEN mood * 2 ELSE mood END
WHERE (sleep_quality <= 5 OR fatigue_level <= 5);

-- ================================================
-- 3. 更新 Demo 數據生成函數 (支援 10 分制)
-- ================================================
CREATE OR REPLACE FUNCTION sport.regenerate_demo_data(p_team_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_team_id UUID;
    v_player RECORD;
    v_date DATE;
    v_i INT;
    v_base_rhr INT;
    v_rand_factor DECIMAL;
    v_load INT;
    v_wellness_val INT;
    v_days_to_gen INT := 30;
    v_records_count INT := 0;
BEGIN
    SELECT id INTO v_team_id FROM sport.teams WHERE LOWER(slug) = LOWER(p_team_slug);
    IF v_team_id IS NULL THEN 
        RETURN jsonb_build_object('status', 'error', 'message', '找不到球隊: ' || p_team_slug); 
    END IF;

    DELETE FROM sport.daily_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.pain_reports WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.notifications WHERE team_id = v_team_id;

    FOR v_player IN SELECT id, name FROM sport.players WHERE team_id = v_team_id AND is_active = true LOOP
        v_base_rhr := 50 + floor(random() * 15);
        v_rand_factor := random();

        FOR v_i IN 0..(v_days_to_gen - 1) LOOP
            v_date := CURRENT_DATE - ((v_days_to_gen - 1) - v_i) * INTERVAL '1 day';
            
            IF v_rand_factor > 0.85 THEN
                IF v_i > 20 THEN
                    v_load := 600 + floor(random() * 500);
                    v_wellness_val := 2 + floor(random() * 3);
                    v_base_rhr := v_base_rhr + floor(random() * 2);
                ELSE
                    v_load := 200 + floor(random() * 400);
                    v_wellness_val := 6 + floor(random() * 3);
                END IF;
            ELSIF v_rand_factor > 0.65 THEN
                v_load := 300 + floor(random() * 400);
                v_wellness_val := 4 + floor(random() * 5);
            ELSE
                v_load := 100 + floor(random() * 300);
                v_wellness_val := 8 + floor(random() * 3);
            END IF;

            INSERT INTO sport.daily_records (
                player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, 
                stress_level, muscle_soreness, srpe_score, training_minutes, wellness_total, feedback
            ) VALUES (
                v_player.id, v_date, v_base_rhr + floor(random() * 5) - 2,
                v_wellness_val, v_wellness_val, v_wellness_val, v_wellness_val, v_wellness_val,
                LEAST(10, GREATEST(1, floor(v_load / 90.0 + (random() * 2 - 1)))), 90,
                v_wellness_val * 5,
                (ARRAY['狀況不錯，還可以再加強', '今天有點累，但撐過去了', '膝蓋稍微有點緊，但影響不大', '感覺恢復得很好，隨時可以上場', '訓練量適中，感覺充實', '昨晚沒睡好，今天專注力稍差', '教練今天的課表很紮實！', null, null])[floor(random()*9)+1]
            );
            
            v_records_count := v_records_count + 1;

            IF random() > 0.95 THEN
                INSERT INTO sport.pain_reports (
                    player_id, report_date, body_part, pain_level, pain_type, description, is_resolved
                ) VALUES (
                    v_player.id, v_date, (ARRAY['左膝', '右踝', '腰部', '右肩'])[floor(random()*4)+1],
                    3 + floor(random()*5), 'fatigue', (ARRAY['昨天訓練量較大，感覺有點緊', '起床時覺得僵硬', '練球時拉扯到', '重訓後持續痠痛', '熱身不足導致不適', '衝刺時感覺肌肉緊縮'])[floor(random()*6)+1], false
                );
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success', 
        'message', '已為全隊球員生成 30 天數據 (累計 ' || v_records_count || ' 筆)',
        'days', v_days_to_gen,
        'records_count', v_records_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 3.5 修復 RPC 權限 (確保 Dashboard 讀取無障礙)
-- ================================================
DROP FUNCTION IF EXISTS sport.get_team_fatigue_overview(UUID, DATE);

CREATE OR REPLACE FUNCTION sport.get_team_fatigue_overview(
  p_team_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_player RECORD;
  v_metrics JSONB;
  v_is_demo BOOLEAN;
BEGIN
  -- 1. Security Check for Anonymous Users (auth.uid() IS NULL = anonymous)
  IF auth.uid() IS NULL THEN
    SELECT is_demo INTO v_is_demo FROM sport.teams WHERE id = p_team_id;
    IF v_is_demo IS NOT TRUE THEN
       RAISE EXCEPTION 'Access Denied: Login required for private team data.';
    END IF;
  END IF;

  -- 遍歷球隊中所有活躍球員
  FOR v_player IN 
    SELECT id, name, jersey_number, avatar_url, position
    FROM sport.players
    WHERE team_id = p_team_id AND is_active = true
    ORDER BY jersey_number ASC
  LOOP
    -- 呼叫現有的單人指標計算函數
    v_metrics := sport.get_player_fatigue_metrics(v_player.id, p_date);
    
    -- 將球員基本資料與指標合併
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================
-- 4. 立即為「湘北籃球隊」重新生成 10 分制測試數據
-- ================================================
-- 注意：請確保資料庫中已有 'shohoku' 球隊。若無，此步驟會回傳錯誤訊息但不會中斷交易 (依 SQL 客戶端而定)
-- 若您確定有該球隊，這將自動填入 30 天份的新數據。
-- 使用用戶指定的 'shohoku-basketball'
-- 清除舊的 Demo 資料 (如大雄棒球隊)
DELETE FROM sport.teams WHERE slug = 'doraemon-baseball';

SELECT sport.regenerate_demo_data('shohoku-basketball');

-- ================================================
-- 5. 驗證資料 (列出最近 5 天的紀錄數)
-- ================================================
SELECT 'DASHBOARD_CHECK' as type, record_date, COUNT(*) as record_count 
FROM sport.daily_records 
WHERE player_id IN (
    SELECT id FROM sport.players 
    WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball')
)
GROUP BY record_date 
ORDER BY record_date DESC 
LIMIT 5;

-- ================================================
-- 6. 補上權限設定 (Critical Fix for "Unable to load")
-- ================================================
GRANT EXECUTE ON FUNCTION sport.calculate_ewma_acwr(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.calculate_rhr_baseline(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.calculate_wellness_zscore(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.calculate_weekly_load_change(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.get_player_fatigue_metrics(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.get_team_fatigue_overview(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.regenerate_demo_data(TEXT) TO authenticated, service_role; -- Demo Gen restricted to auth

-- ================================================
-- 7. 修復球隊讀取權限 (Fix "Team Not Found")
-- ================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON sport.teams;
DROP POLICY IF EXISTS "Public can view teams" ON sport.teams;
CREATE POLICY "Public can view teams" ON sport.teams FOR SELECT USING (true);

COMMIT;
