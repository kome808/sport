-- ================================================
-- 大雄棒球隊演示數據生成 (Seed Data V2 - 穩定版)
-- 日期: 2026-01-25
-- 說明：採用「先刪除舊資料、再重新插入」策略，避開 ON CONFLICT 索引報錯。
-- ================================================

DO $$
DECLARE
  v_team_id UUID;
  v_player_id UUID;
  v_p RECORD;
  v_date DATE;
  v_base_minutes INT;
  v_base_rpe INT;
  v_i INT;
  v_players JSONB := '[
    {"name": "野比大雄", "num": "10"},
    {"name": "剛田武 (胖虎)", "num": "1"},
    {"name": "骨川小夫", "num": "2"},
    {"name": "源靜香", "num": "3"}
  ]'::jsonb;
BEGIN
  -- 1. 取得大雄棒球隊 ID
  SELECT id INTO v_team_id FROM sport.teams WHERE name LIKE '%大雄%' LIMIT 1;
  
  IF v_team_id IS NULL THEN
    RAISE NOTICE '找不到大雄棒球隊，請先確保球隊已建立';
    RETURN;
  END IF;

  RAISE NOTICE '正在為球隊 ID: % 重建示範數據...', v_team_id;

  -- 2. 清理舊資料 (確保數據純淨)
  -- 級聯刪除會自動清理 daily_records, pain_reports 等
  DELETE FROM sport.players WHERE team_id = v_team_id;

  -- 3. 遍歷並建立球員與 28 天數據
  FOR v_p IN SELECT * FROM jsonb_to_recordset(v_players) AS x(name text, num text)
  LOOP
    INSERT INTO sport.players (team_id, name, jersey_number, password_hash, status, is_active)
    VALUES (v_team_id, v_p.name, v_p.num, 'demo123', 'active', true)
    RETURNING id INTO v_player_id;

    FOR v_i IN 0..27 LOOP
      v_date := CURRENT_DATE - (27 - v_i) * INTERVAL '1 day';
      
      -- 模擬訓練邏輯
      IF EXTRACT(ISODOW FROM v_date) IN (6, 7) THEN
        v_base_minutes := 0; v_base_rpe := 0;
      ELSE
        IF v_i < 21 THEN
          v_base_minutes := 60 + floor(random() * 20)::INT;
          v_base_rpe := 4 + floor(random() * 2)::INT;
        ELSE 
          v_base_minutes := 100 + floor(random() * 30)::INT;
          v_base_rpe := 8 + floor(random() * 2)::INT;
        END IF;
      END IF;

      INSERT INTO sport.daily_records (
        player_id, record_date, training_minutes, srpe_score, rhr_bpm,
        sleep_quality, fatigue_level, mood, stress_level, muscle_soreness
      ) VALUES (
        v_player_id, v_date, v_base_minutes, v_base_rpe, 
        CASE WHEN v_i > 21 THEN 72 ELSE 62 END + floor(random() * 5)::INT,
        CASE WHEN v_i > 21 THEN 2 ELSE 4 END,
        CASE WHEN v_i > 21 THEN 4 ELSE 2 END,
        3, 3, 
        CASE WHEN v_i > 21 THEN 4 ELSE 2 END
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ 數據重建完成！請刷新網頁查看結果。';
END $$;
