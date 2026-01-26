-- ================================================
-- 湘北籃球隊演示數據生成 (Shohoku Demo Data)
-- 日期: 2026-01-26
-- 說明：建立湘北籃球隊、安西教練與先發五人，並生成 30 天模擬數據。
-- ================================================

DO $$
DECLARE
  v_team_id UUID;
  v_coach_id UUID;
  v_player_id UUID;
  v_p RECORD;
  v_date DATE;
  v_base_minutes INT;
  v_base_rpe INT;
  v_i INT;
  v_players JSONB := '[
    {"name": "櫻木花道", "num": "10", "pos": "PF", "role_type": "high_energy", "code": "3ss", "h": 189.2, "w": 83, "birth": "2009-04-01"},
    {"name": "流川 楓", "num": "11", "pos": "SF", "role_type": "high_load", "code": "rukawa", "h": 187.0, "w": 75, "birth": "2009-01-01"},
    {"name": "赤木剛憲", "num": "4", "pos": "C", "role_type": "injury_risk", "code": "gori", "h": 197.0, "w": 93, "birth": "2008-05-10"},
    {"name": "宮城良田", "num": "7", "pos": "PG", "role_type": "speed", "code": "ryota", "h": 168.0, "w": 59, "birth": "2009-07-31"},
    {"name": "三井 壽", "num": "14", "pos": "SG", "role_type": "fatigue_prone", "code": "mitchi", "h": 184.0, "w": 70, "birth": "2008-05-22"}
  ]'::jsonb;
BEGIN
  -- 1. 建立或取得教練帳號 (安西教練)
  -- 這裡簡化處理：若無 user 則無法建立 auth，需假設 auth.users 已有或透過另外方式建立。
  -- 但為了 Demo 方便，我們通常檢查 public.users。
  -- *注意*：在真實 Supabase 本地環境，直接插入 auth.users 較複雜，通常建議用 `supabase db reset` 配合 `seeds.sql`。
  -- 但此處我們盡量用 SQL 處理 public.users 關聯，Auth 部分通常需手動或 API 建立。
  -- 為了腳本能跑，我們先檢查是否有這個 email 的使用者，若無則提示。
  
  -- 為了方便，我們假設如果沒有這個 auth user，就先略過 auth 綁定，只建立 public.users 供顯示用 (或者使用者已手動註冊)
  -- 但為了完整流程，我們將邏輯寫為：若找不到教練，則建立一個 "預留" 的 public.user
  
  -- 建立/取得教練 (安西教練)
  INSERT INTO sport.coaches (email, name)
  VALUES ('coach@shohoku.com', '安西教練')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_coach_id;

  RAISE NOTICE '教練 ID: %', v_coach_id;

  -- 建立/取得球隊
  INSERT INTO sport.teams (name, sport_type, slug, is_demo, coach_id)
  VALUES ('湘北籃球隊', 'Basketball', 'shohoku-basketball', TRUE, v_coach_id)
  ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    is_demo = TRUE,
    coach_id = EXCLUDED.coach_id
  RETURNING id INTO v_team_id;

  RAISE NOTICE '球隊 ID: %', v_team_id;

  -- 2. 清理舊資料
  DELETE FROM sport.players WHERE team_id = v_team_id;

  -- 3. 建立球員與數據
  FOR v_p IN SELECT * FROM jsonb_to_recordset(v_players) AS x(name text, num text, pos text, role_type text, code text, h numeric, w numeric, birth date)
  LOOP
    INSERT INTO sport.players (
      team_id, name, jersey_number, position, short_code, 
      height_cm, weight_kg, birth_date,
      password_hash, status, is_active
    )
    VALUES (
      v_team_id, v_p.name, v_p.num, v_p.pos, v_p.code, 
      v_p.h, v_p.w, v_p.birth,
      crypt('demo123', gen_salt('bf')), 'active', true
    )
    RETURNING id INTO v_player_id;

    -- 生成 30 天數據
    FOR v_i IN 0..29 LOOP
      v_date := CURRENT_DATE - (29 - v_i) * INTERVAL '1 day';
      
      -- 基礎數值設定
      v_base_minutes := 0;
      v_base_rpe := 0;

      -- 週末比賽日 (假設)
      IF EXTRACT(ISODOW FROM v_date) IN (6, 7) THEN
         v_base_minutes := 40; -- 比賽時間
         v_base_rpe := 9;      -- 比賽強度高
      ELSE
         -- 平日訓練
         IF v_p.role_type = 'high_load' THEN -- 流川楓
            v_base_minutes := 120 + floor(random() * 30)::INT;
            v_base_rpe := 6 + floor(random() * 3)::INT;
         ELSIF v_p.role_type = 'fatigue_prone' THEN -- 三井壽
            v_base_minutes := 90 + floor(random() * 20)::INT;
            v_base_rpe := 7 + floor(random() * 3)::INT; -- 容易累，RPE 較高
         ELSE
            v_base_minutes := 100 + floor(random() * 20)::INT;
            v_base_rpe := 5 + floor(random() * 3)::INT;
         END IF;
      END IF;

      -- 休息日邏輯 (每週一休息)
      IF EXTRACT(ISODOW FROM v_date) = 1 THEN
         v_base_minutes := 0;
         v_base_rpe := 0;
      END IF;

      -- 寫入記錄
      IF v_base_minutes > 0 THEN
          INSERT INTO sport.daily_records (
            player_id, record_date, training_minutes, srpe_score, rhr_bpm,
            sleep_quality, fatigue_level, mood, stress_level, muscle_soreness
          ) VALUES (
            v_player_id, v_date, v_base_minutes, v_base_rpe, 
            60 + floor(random() * 10)::INT, -- RHR
            3 + floor(random() * 2)::INT,   -- Sleep (3-5)
            CASE WHEN v_p.role_type = 'fatigue_prone' AND v_i > 25 THEN 4 ELSE 2 END + floor(random() * 2)::INT, -- Fatigue
            3, 3, 
            CASE WHEN v_p.role_type = 'injury_risk' AND floor(random()*10) > 7 THEN 4 ELSE 2 END -- Soreness
          );
      END IF;
    END LOOP;

    -- 插入傷病報告 (針對赤木與三井)
    IF v_p.name = '赤木剛憲' THEN
       INSERT INTO sport.pain_reports (player_id, report_date, body_part, pain_level, description, is_resolved)
       VALUES (v_player_id, CURRENT_DATE - 5, 'Ankle (R)', 6, '腳踝扭傷舊傷復發', FALSE);
    END IF;

    IF v_p.name = '三井 壽' THEN
       INSERT INTO sport.pain_reports (player_id, report_date, body_part, pain_level, description, is_resolved)
       VALUES (v_player_id, CURRENT_DATE - 2, 'Knee (L)', 4, '膝蓋痠痛', FALSE);
    END IF;

  END LOOP;

  RAISE NOTICE '✅ 湘北籃球隊數據生成完成！';
END $$;
