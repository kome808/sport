-- ================================================
-- 基層運動訓練系統 - 測試資料 (動態版)
-- 日期: 2026-01-11
-- 說明：此腳本會自動尋找或建立 email='komepanfu@gmail.com' 的教練
-- 並建立關聯的球隊與球員資料。
-- ================================================

DO $$
DECLARE
  v_coach_id UUID;
  v_team_id UUID;
  v_dummy_player_id UUID;
BEGIN
  -- 1. 取得或建立教練 (以 email 為準)
  SELECT id INTO v_coach_id FROM sport.coaches WHERE email = 'komepanfu@gmail.com';

  IF v_coach_id IS NULL THEN
    INSERT INTO sport.coaches (email, name)
    VALUES ('komepanfu@gmail.com', '胖虎教練')
    RETURNING id INTO v_coach_id;
    RAISE NOTICE '已建立新教練資料，ID: %', v_coach_id;
  ELSE
    RAISE NOTICE '使用現有教練資料，ID: %', v_coach_id;
  END IF;

  -- 2. 建立球隊
  INSERT INTO sport.teams (coach_id, name, slug, sport_type)
  VALUES (v_coach_id, '大雄棒球隊', 'doraemon-baseball', 'baseball')
  ON CONFLICT (slug) DO UPDATE SET coach_id = EXCLUDED.coach_id
  RETURNING id INTO v_team_id;

  IF v_team_id IS NULL THEN
     SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'doraemon-baseball';
  END IF;

  -- 3. 設定球隊成員 (擁有者)
  INSERT INTO sport.team_members (team_id, coach_id, role)
  VALUES (v_team_id, v_coach_id, 'owner')
  ON CONFLICT (team_id, coach_id) DO NOTHING;

  -- 4. 建立 10 位球員
  -- 清除舊資料以避免重複 (選擇性)
  -- DELETE FROM sport.players WHERE team_id = v_team_id;

  -- 投手群
  INSERT INTO sport.players (team_id, name, jersey_number, position, birth_date, height_cm, weight_kg, password_hash, is_active)
  VALUES
  (v_team_id, '大雄', '1', '投手', '2010-03-15', 165.5, 58.0, '$2a$10$abcdefghijklmnopqrstuv', true),
  (v_team_id, '小夫', '11', '投手', '2010-07-22', 162.0, 55.0, '$2a$10$abcdefghijklmnopqrstuv', true)
  ON CONFLICT (team_id, jersey_number) DO UPDATE SET name = EXCLUDED.name;

  -- 捕手
  INSERT INTO sport.players (team_id, name, jersey_number, position, birth_date, height_cm, weight_kg, password_hash, is_active)
  VALUES
  (v_team_id, '技安', '2', '捕手', '2009-11-08', 175.0, 85.0, '$2a$10$abcdefghijklmnopqrstuv', true)
  ON CONFLICT (team_id, jersey_number) DO UPDATE SET name = EXCLUDED.name;

  -- 內野手
  INSERT INTO sport.players (team_id, name, jersey_number, position, birth_date, height_cm, weight_kg, password_hash, is_active)
  VALUES
  (v_team_id, '靜香', '3', '一壘手', '2010-05-03', 158.0, 48.0, '$2a$10$abcdefghijklmnopqrstuv', true),
  (v_team_id, '出木杉', '4', '二壘手', '2010-01-20', 168.0, 60.0, '$2a$10$abcdefghijklmnopqrstuv', true),
  (v_team_id, '阿福', '5', '游擊手', '2010-09-12', 164.0, 57.0, '$2a$10$abcdefghijklmnopqrstuv', true),
  (v_team_id, '胖虎弟', '6', '三壘手', '2011-02-28', 170.0, 72.0, '$2a$10$abcdefghijklmnopqrstuv', true)
  ON CONFLICT (team_id, jersey_number) DO UPDATE SET name = EXCLUDED.name;

  -- 外野手
  INSERT INTO sport.players (team_id, name, jersey_number, position, birth_date, height_cm, weight_kg, password_hash, is_active)
  VALUES
  (v_team_id, '伸太', '7', '左外野', '2010-04-18', 166.0, 59.0, '$2a$10$abcdefghijklmnopqrstuv', true),
  (v_team_id, '安雄', '8', '中外野', '2010-06-25', 169.0, 61.0, '$2a$10$abcdefghijklmnopqrstuv', true),
  (v_team_id, '武夫', '9', '右外野', '2010-08-10', 171.0, 65.0, '$2a$10$abcdefghijklmnopqrstuv', true)
  ON CONFLICT (team_id, jersey_number) DO UPDATE SET name = EXCLUDED.name;

  -- 5. 建立每日訓練紀錄 (使用動態 ID)
  -- 取得大雄 ID
  SELECT id INTO v_dummy_player_id FROM sport.players WHERE team_id = v_team_id AND name = '大雄';
  
  IF v_dummy_player_id IS NOT NULL THEN
    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes, acwr, risk_level) VALUES
    (v_dummy_player_id, CURRENT_DATE - 7, 70, 2, 2, 2, 2, 2, 9, 200, 1.55, 'red'),
    (v_dummy_player_id, CURRENT_DATE - 6, 72, 2, 1, 2, 2, 1, 9, 200, 1.62, 'red'),
    (v_dummy_player_id, CURRENT_DATE - 5, 70, 2, 2, 2, 2, 2, 8, 180, 1.58, 'red'),
    (v_dummy_player_id, CURRENT_DATE - 4, 68, 3, 2, 3, 3, 2, 7, 150, 1.52, 'red'),
    (v_dummy_player_id, CURRENT_DATE - 3, 66, 3, 3, 3, 3, 3, 6, 120, 1.45, 'red'),
    (v_dummy_player_id, CURRENT_DATE - 2, 64, 4, 3, 4, 4, 3, 5, 90, 1.38, 'yellow'),
    (v_dummy_player_id, CURRENT_DATE - 1, 62, 4, 4, 4, 4, 4, 4, 60, 1.28, 'yellow'),
    (v_dummy_player_id, CURRENT_DATE, 60, 4, 4, 4, 4, 4, 3, 45, 1.18, 'yellow')
    ON CONFLICT (player_id, record_date) DO NOTHING;

    -- 大雄疼痛回報
    INSERT INTO sport.pain_reports (player_id, report_date, body_part, pain_level, pain_type, description, is_resolved) VALUES
    (v_dummy_player_id, CURRENT_DATE - 5, '右肩', 6, 'fatigue', '投球後右肩有痠痛感', false)
    ON CONFLICT DO NOTHING; -- 這裡稍微不嚴謹，因為沒有 unique key on pain_reports except id. 但測試資料可接受重複或忽略
  END IF;

  -- 取得胖虎弟 ID
  SELECT id INTO v_dummy_player_id FROM sport.players WHERE team_id = v_team_id AND name = '胖虎弟';

  IF v_dummy_player_id IS NOT NULL THEN
    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes, acwr, risk_level) VALUES
    (v_dummy_player_id, CURRENT_DATE - 3, 75, 1, 1, 1, 2, 1, 10, 240, 1.85, 'black'),
    (v_dummy_player_id, CURRENT_DATE - 2, 78, 1, 1, 1, 1, 1, 10, 240, 2.05, 'black'),
    (v_dummy_player_id, CURRENT_DATE - 1, 76, 2, 1, 1, 1, 1, 9, 200, 1.95, 'black'),
    (v_dummy_player_id, CURRENT_DATE, 74, 2, 2, 2, 2, 1, 8, 150, 1.82, 'black')
    ON CONFLICT (player_id, record_date) DO NOTHING;
    
    -- 醫療紀錄
    INSERT INTO sport.medical_records (player_id, reported_by, reported_by_type, record_date, diagnosis, doctor_advice) VALUES
    (v_dummy_player_id, v_coach_id, 'coach', CURRENT_DATE - 2, '過度訓練症候群', '建議休息至少 7 天');
  END IF;
  
  -- 取得技安 ID
  SELECT id INTO v_dummy_player_id FROM sport.players WHERE team_id = v_team_id AND name = '技安';
  IF v_dummy_player_id IS NOT NULL THEN
      -- 疼痛回報
    INSERT INTO sport.pain_reports (player_id, report_date, body_part, pain_level, pain_type, description, is_resolved) VALUES
    (v_dummy_player_id, CURRENT_DATE - 3, '右膝', 5, 'chronic', '蹲捕時右膝有疼痛感', false);
  END IF;

  RAISE NOTICE '✅ 測試資料建立完成！球隊 ID: %', v_team_id;
END $$;
