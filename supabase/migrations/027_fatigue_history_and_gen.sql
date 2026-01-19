-- ================================================
-- 球員疲勞歷史趨勢 RPC 及 數據生成強化
-- 日期: 2026-01-19
-- ================================================

-- 1. 建立取得球員歷史疲勞趨勢的函數
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_history(
  p_player_id UUID,
  p_days INT DEFAULT 14,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_date DATE;
  v_metrics JSONB;
BEGIN
  FOR v_date IN 
    SELECT d.day::DATE FROM generate_series(p_end_date - (p_days - 1) * INTERVAL '1 day', p_end_date, INTERVAL '1 day') AS d(day)
    ORDER BY d.day ASC
  LOOP
    v_metrics := sport.get_player_fatigue_metrics(p_player_id, v_date);
    
    v_result := v_result || jsonb_build_object(
      'date', v_date,
      'acwr', (v_metrics->'acwr'->>'acwr')::DECIMAL,
      'acuteLoad', (v_metrics->'acwr'->>'short_term_load')::DECIMAL,
      'chronicLoad', (v_metrics->'acwr'->>'long_term_load')::DECIMAL,
      'risk_level', v_metrics->'acwr'->>'risk_level'
    );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 強化數據生成函數：為全隊生成隨機但有意義的數據
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
    v_wellness_score INT;
BEGIN
    -- 取得球隊 ID
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = p_team_slug;
    IF v_team_id IS NULL THEN RETURN jsonb_build_object('status', 'error', 'message', 'Team not found'); END IF;

    -- 先清空全隊舊數據
    DELETE FROM sport.daily_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);

    -- 遍歷所有球員
    FOR v_player IN SELECT id, name FROM sport.players WHERE team_id = v_team_id AND is_active = true LOOP
        -- 為每位球員隨機設定一個基準 RHR
        v_base_rhr := 50 + floor(random() * 15);
        
        -- 為球員決定一個「性格/狀態」因子 (0=健康, 1=疲勞, 2=危險)
        -- 隨機分配，確保大約 20% 的人會出現風險，30% 注意，50% 正常
        v_rand_factor := random();

        -- 生成 21 天數據，製造趨勢
        FOR v_i IN 0..20 LOOP
            v_date := CURRENT_DATE - (20 - v_i) * INTERVAL '1 day';
            
            IF v_rand_factor > 0.8 THEN -- 危險組合 (Nobita Style)
                v_load := 400 + floor(random() * 600); -- 高負荷
                v_wellness_score := 1 + floor(random() * 3); -- 低健康度
                v_base_rhr := v_base_rhr + floor(random() * 3); -- 心跳逐漸上升
            ELSIF v_rand_factor > 0.5 THEN -- 注意組合 (Gian Style)
                v_load := 300 + floor(random() * 300);
                v_wellness_score := 2 + floor(random() * 3);
            ELSE -- 健康組合 (Dekisugi Style)
                v_load := 100 + floor(random() * 300);
                v_wellness_score := 4 + floor(random() * 2);
            END IF;

            INSERT INTO sport.daily_records (
                player_id, 
                record_date, 
                rhr_bpm, 
                sleep_quality, 
                fatigue_level, 
                mood, 
                stress_level, 
                muscle_soreness, 
                srpe_score, 
                training_minutes,
                training_load_au
            ) VALUES (
                v_player.id,
                v_date,
                v_base_rhr + floor(random() * 5),
                v_wellness_score,
                v_wellness_score,
                v_wellness_score,
                v_wellness_score,
                v_wellness_score,
                v_load / 100 + 1,
                100,
                v_load
            );
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('status', 'success', 'message', 'Data generated for all active players (21 days)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權
GRANT EXECUTE ON FUNCTION sport.get_player_fatigue_history TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.regenerate_demo_data TO authenticated, service_role, anon;
