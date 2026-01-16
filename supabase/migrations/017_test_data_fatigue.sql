-- ================================================
-- 球員疲勞監測模組 1.3 - Test Data Generation
-- 日期: 2026-01-16
-- 說明: 為現有球員生成過去 28 天的模擬訓練數據
-- ================================================

DO $$
DECLARE
  v_player RECORD;
  v_date DATE;
  v_base_minutes INT;
  v_base_rpe INT;
  v_base_rhr INT;
  v_variation INT;
BEGIN
  -- 針對所有活躍球員 (限制 10 位以免執行太久，或是特定球隊)
  -- 這裡針對 'doraemon-baseball' 球隊 (假如 slug 是這個，需先查 id)
  -- 簡化：針對最近建立的 5 位球員
  
  FOR v_player IN 
    SELECT id, name FROM sport.players 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 10
  LOOP
    RAISE NOTICE 'Generating data for player: %', v_player.name;
    
    -- 生成過去 28 天的數據
    FOR i IN 0..27 LOOP
      v_date := CURRENT_DATE - (27 - i) * INTERVAL '1 day';
      
      -- 基礎設定 (模擬週期性訓練)
      -- 週期: 7天 (5天練, 2天休)
      IF EXTRACT(ISODOW FROM v_date) IN (6, 7) THEN
        -- 週末休息或輕度
        v_base_minutes := 0;
        v_base_rpe := 0;
      ELSE
        -- 平日訓練
        -- 前三週 (0-20): 正常負荷 (60分, RPE 4-6) -> Load ~300
        -- 第四週 (21-27): 高負荷 (90分, RPE 7-9) -> Load ~700 (Spike ACWR)
        
        IF i < 21 THEN
          v_base_minutes := 60 + floor(random() * 20)::INT;
          v_base_rpe := 4 + floor(random() * 3)::INT;
        ELSE 
          v_base_minutes := 90 + floor(random() * 30)::INT;
          v_base_rpe := 7 + floor(random() * 3)::INT; -- 7,8,9
        END IF;
      END IF;

      -- RHR 模擬 (疲勞時升高)
      v_base_rhr := 60;
      IF i >= 21 THEN
         v_base_rhr := 65 + floor(random() * 5)::INT; -- 疲勞期 RHR 升高
      ELSE
         v_base_rhr := 55 + floor(random() * 5)::INT;
      END IF;

      -- 插入數據 (UPSERT)
      INSERT INTO sport.daily_records (
        player_id, 
        record_date,
        training_minutes,
        srpe_score,
        rhr_bpm,
        sleep_quality,
        fatigue_level,
        mood,
        stress_level,
        muscle_soreness
        -- wellness_total, training_load_au 會由 Trigger 自動計算
      ) VALUES (
        v_player.id,
        v_date,
        v_base_minutes,
        v_base_rpe,
        v_base_rhr,
        3 + floor(random() * 3)::INT, -- 3-5
        CASE WHEN i >= 21 THEN 4 ELSE 2 END, -- Fatigue: High in last week
        3 + floor(random() * 3)::INT,
        3,
        CASE WHEN i >= 21 THEN 4 ELSE 2 END -- Soreness: High in last week
      )
      ON CONFLICT (player_id, record_date) 
      DO UPDATE SET
        training_minutes = EXCLUDED.training_minutes,
        srpe_score = EXCLUDED.srpe_score,
        rhr_bpm = EXCLUDED.rhr_bpm,
        fatigue_level = EXCLUDED.fatigue_level,
        muscle_soreness = EXCLUDED.muscle_soreness;
        
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Test data generation completed.';
END $$;
