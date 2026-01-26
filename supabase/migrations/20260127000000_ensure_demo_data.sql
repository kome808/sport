-- ================================================
-- 讓演示球隊自動填寫資料的預存程序
-- ================================================

CREATE OR REPLACE FUNCTION sport.ensure_demo_data(
  p_team_slug text, 
  p_days_to_check int DEFAULT 7,
  p_today DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_team_id UUID;
  v_player_id UUID;
  v_player_name TEXT;
  v_date DATE;
  v_base_minutes INT;
  v_base_rpe INT;
  v_role TEXT;
BEGIN
  -- 1. 取得球隊 ID
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = p_team_slug;
  
  IF v_team_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. 針對球隊內的每個球員進行檢查
  FOR v_player_id, v_player_name IN SELECT id, name FROM sport.players WHERE team_id = v_team_id
  LOOP
    -- 決定角色類型
    v_role := CASE 
      WHEN v_player_name = '流川 楓' THEN 'high_load'
      WHEN v_player_name = '三井 壽' THEN 'fatigue_prone'
      WHEN v_player_name = '赤木剛憲' THEN 'injury_risk'
      WHEN v_player_name = '櫻木花道' THEN 'high_energy'
      ELSE 'speed'
    END;

    -- 檢查過去 N 天
    FOR i IN 0..(p_days_to_check - 1) LOOP
      v_date := p_today - i * INTERVAL '1 day';
      
      -- 如果這天還沒有資料，就生成資料
      IF NOT EXISTS (SELECT 1 FROM sport.daily_records WHERE player_id = v_player_id AND record_date = v_date) THEN
        
        -- 基礎數值設定
        v_base_minutes := 0;
        v_base_rpe := 0;

        -- 週末比賽日 (假設)
        IF EXTRACT(ISODOW FROM v_date) IN (6, 7) THEN
           v_base_minutes := 40; 
           v_base_rpe := 8 + floor(random() * 3)::INT; -- 8-10
        ELSE
           -- 平日訓練
           IF v_role = 'high_load' THEN
              v_base_minutes := 120 + floor(random() * 30)::INT;
              v_base_rpe := 6 + floor(random() * 3)::INT;
           ELSIF v_role = 'fatigue_prone' THEN 
              v_base_minutes := 90 + floor(random() * 20)::INT;
              v_base_rpe := 7 + floor(random() * 3)::INT; 
           ELSE
              v_base_minutes := 100 + floor(random() * 20)::INT;
              v_base_rpe := 5 + floor(random() * 3)::INT;
           END IF;
        END IF;

        -- 休息日邏輯 (週日休息)
        IF EXTRACT(ISODOW FROM v_date) = 7 THEN
           v_base_minutes := 0;
           v_base_rpe := 0;
        END IF;

        -- 寫入記錄
        IF v_base_minutes > 0 THEN
            INSERT INTO sport.daily_records (
              player_id, record_date, training_minutes, srpe_score, rhr_bpm,
              sleep_quality, fatigue_level, mood, stress_level, muscle_soreness,
              feedback
            ) VALUES (
              v_player_id, v_date, v_base_minutes, v_base_rpe, 
              60 + floor(random() * 10)::INT, -- RHR
              3 + floor(random() * 3)::INT,   -- Sleep (3-5)
              2 + floor(random() * 2)::INT,   -- Fatigue (2-3)
              4, 4, 
              CASE WHEN v_role = 'injury_risk' AND floor(random()*10) > 7 THEN 4 ELSE 2 END, -- Soreness
              CASE 
                WHEN v_role = 'high_energy' THEN '天才的訓練！'
                WHEN v_role = 'high_load' THEN '還不夠。'
                WHEN v_role = 'fatigue_prone' THEN '有點喘，但還能撐住。'
                WHEN v_role = 'injury_risk' THEN '關節有些緊繃，需加強伸展。'
                ELSE '完成今日訓練。'
              END
            );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
