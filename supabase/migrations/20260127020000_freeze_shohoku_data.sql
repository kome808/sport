-- ================================================
-- 湘北籃球隊：固定展示數據生成 (Final Static Seed)
-- 基準日期: 2026-01-27
-- 說明：生成 2025-12-29 至 2026-01-27 的完整歷史數據。
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
  v_ref_date DATE := '2026-01-27'::DATE;
BEGIN
  -- 1. 取得球隊 ID
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'shohoku-basketball';
  
  IF v_team_id IS NULL THEN
    RAISE NOTICE '找不到湘北籃球隊，請先運行基礎 seed';
    RETURN;
  END IF;

  -- 2. 清理該球隊所有舊紀錄 (確保新數據乾淨)
  DELETE FROM sport.daily_records 
  WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
  
  DELETE FROM sport.pain_reports
  WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);

  -- 3. 遍歷球員生成 30 天數據
  FOR v_p IN SELECT id, name FROM sport.players WHERE team_id = v_team_id
  LOOP
    FOR v_i IN 0..29 LOOP
      v_date := v_ref_date - (29 - v_i) * INTERVAL '1 day';
      
      -- 基礎數值設定
      v_base_minutes := 0;
      v_base_rpe := 0;

      -- 週末比賽日 (假設)
      IF EXTRACT(ISODOW FROM v_date) IN (6, 7) THEN
         -- 週六比賽
         IF EXTRACT(ISODOW FROM v_date) = 6 THEN
            v_base_minutes := 40; 
            v_base_rpe := 8;
         END IF;
         -- 週日休息
      ELSE
         -- 平日訓練
         IF v_p.name = '流川 楓' THEN
            -- 觸發 ACWR 警報：前三週輕量，最後一週爆量 (ACWR > 1.5)
            IF v_i < 20 THEN
               v_base_minutes := 40; v_base_rpe := 4;
            ELSE
               v_base_minutes := 160; v_base_rpe := 9;
            END IF;
         ELSIF v_p.name = '三井 壽' THEN
            v_base_minutes := 90; v_base_rpe := 7;
         ELSIF v_p.name = '櫻木花道' THEN
            v_base_minutes := 120; v_base_rpe := 8;
         ELSE
            v_base_minutes := 100; v_base_rpe := 6;
         END IF;
      END IF;

      -- 週日休息
      IF EXTRACT(ISODOW FROM v_date) = 7 THEN
         v_base_minutes := 0; v_base_rpe := 0;
      END IF;

      -- 寫入記錄 (注意：即便當天休息(minutes=0)，RHR與Wellness數據也會記錄做為展示)
      INSERT INTO sport.daily_records (
        player_id, record_date, training_minutes, srpe_score, rhr_bpm,
        sleep_quality, fatigue_level, mood, stress_level, muscle_soreness,
        feedback
      ) VALUES (
        v_p.id, v_date, v_base_minutes, v_base_rpe, 
        -- 晨間心跳 RHR：赤木觸發 (基準 60, 今日 72 -> Delta 12)
        CASE 
           WHEN v_p.name = '赤木剛憲' AND v_i = 29 THEN 72 
           WHEN v_p.name = '赤木剛憲' THEN 60
           ELSE 65 
        END,
        -- 身心狀態 WELLNESS：三井觸發 (今日全 2 分 -> 總分 10)
        CASE 
           WHEN v_p.name = '三井 壽' AND v_i = 29 THEN 2
           ELSE 4
        END,
        CASE 
           WHEN v_p.name = '三井 壽' AND v_i = 29 THEN 2
           ELSE 4
        END,
        CASE 
           WHEN v_p.name = '三井 壽' AND v_i = 29 THEN 2
           ELSE 4
        END,
        CASE 
           WHEN v_p.name = '三井 壽' AND v_i = 29 THEN 2
           ELSE 4
        END,
        CASE 
           WHEN v_p.name = '三井 壽' AND v_i = 29 THEN 2
           ELSE 4
        END,
        CASE 
            WHEN v_p.name = '櫻木花道' THEN '我是天才！今天也很努力！'
            WHEN v_p.name = '流川 楓' THEN '體力耗盡... 休息。'
            WHEN v_p.name = '赤木剛憲' THEN '身為隊長，不能在關鍵時刻倒下。'
            WHEN v_p.name = '三井 壽' THEN '膝蓋有點不對勁，體力恢復變慢了...'
            WHEN v_p.name = '宮城良田' THEN '冷靜組織進攻。'
            ELSE '完成本日訓練量。'
        END
      );
    END LOOP;

    -- 插入最新傷病 (2026-01-25)
    IF v_p.name = '赤木剛憲' THEN
       INSERT INTO sport.pain_reports (player_id, report_date, body_part, pain_level, description, is_resolved)
       VALUES (v_p.id, v_ref_date - 2, 'Ankle (R)', 4, '腳踝舊傷略顯僵硬', FALSE);
     END IF;
  END LOOP;

  RAISE NOTICE '✅ 湘北籃球隊展示數據 (多樣化風險) 生成完成！';
END $$;
