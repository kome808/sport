-- ================================================
-- 測試數據生成腳本：疲勞監測模組演示 (哆啦A夢版)
-- 日期: 2026-01-16
-- 描述: 定義 sport.regenerate_demo_data() 函數，為"大雄棒球隊"生成測試數據
-- ================================================

-- 1. 定義生成函數
CREATE OR REPLACE FUNCTION sport.regenerate_demo_data()
RETURNS void AS $$
DECLARE
  v_team_id UUID;
  v_player_safe_id UUID;   -- 出木杉 (模範生，狀態穩定)
  v_player_warn_id UUID;   -- 技安 (捕手，負荷重)
  v_player_risk_id UUID;   -- 大雄 (體能差，易疲勞/受傷)
  v_date DATE;
  i INT;
  
  -- 變數用於生成數據
  v_rpe INT;
  v_minutes INT;
  v_rhr INT;
  v_sleep INT;
  v_fatigue INT;
  v_mood INT;
  v_stress INT;
  v_soreness INT;
  
BEGIN
  -- 1. 取得 "大雄棒球隊"
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'doraemon-baseball';
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION '找不到大雄棒球隊 (doraemon-baseball)，請先確認種子資料 (003_seed_data.sql) 已執行。';
  END IF;

  RAISE NOTICE '目標球隊: 大雄棒球隊 (ID: %)', v_team_id;

  -- 2. 鎖定測試球員
  
  -- Safe: 出木杉
  SELECT id INTO v_player_safe_id FROM sport.players WHERE team_id = v_team_id AND name = '出木杉';
  -- Warning: 技安
  SELECT id INTO v_player_warn_id FROM sport.players WHERE team_id = v_team_id AND name = '技安';
  -- Risk: 大雄
  SELECT id INTO v_player_risk_id FROM sport.players WHERE team_id = v_team_id AND name = '大雄';

  IF v_player_safe_id IS NULL OR v_player_warn_id IS NULL OR v_player_risk_id IS NULL THEN
     RAISE NOTICE '部分球員找不到，嘗試查找替代球員...';
     -- Fallback logic if specific names don't exist, just pick any 3
     IF v_player_safe_id IS NULL THEN SELECT id INTO v_player_safe_id FROM sport.players WHERE team_id = v_team_id LIMIT 1; END IF;
     IF v_player_warn_id IS NULL THEN SELECT id INTO v_player_warn_id FROM sport.players WHERE team_id = v_team_id AND id != v_player_safe_id LIMIT 1; END IF;
     IF v_player_risk_id IS NULL THEN SELECT id INTO v_player_risk_id FROM sport.players WHERE team_id = v_team_id AND id NOT IN (v_player_safe_id, v_player_warn_id) LIMIT 1; END IF;
  END IF;
  
  RAISE NOTICE '測試球員鎖定:';
  RAISE NOTICE '  Safe (出木杉/替代): %', v_player_safe_id;
  RAISE NOTICE '  Warning (技安/替代): %', v_player_warn_id;
  RAISE NOTICE '  Risk (大雄/替代): %', v_player_risk_id;

  -- 4. 清除這三位球員的舊數據 (重置用)
  DELETE FROM sport.daily_records WHERE player_id IN (v_player_safe_id, v_player_warn_id, v_player_risk_id);
  RAISE NOTICE '已清除目標球員的舊有數據...';

  -- 5. 生成 30 天歷史數據 (截至今天)
  FOR i IN 0..29 LOOP
    v_date := CURRENT_DATE - (29 - i) * INTERVAL '1 day';
    
    -- ==========================================
    -- Player Safe (出木杉): 穩定訓練，高恢復
    -- ==========================================
    -- RPE: 3-5 (穩定)
    -- Minutes: 90-120
    v_rpe := 3 + floor(random() * 3); -- 3, 4, 5
    v_minutes := 90 + floor(random() * 30); -- 90-120
    -- Wellness: 20-25 (高)
    v_sleep := 4 + floor(random() * 2); -- 4-5
    v_fatigue := 4 + floor(random() * 2); -- 4-5
    v_mood := 4 + floor(random() * 2);
    v_stress := 4 + floor(random() * 2); 
    v_soreness := 4 + floor(random() * 2);
    -- RHR: Baseline ~52. Current ~50-54
    v_rhr := 50 + floor(random() * 5); 

    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes)
    VALUES (v_player_safe_id, v_date, v_rhr, v_sleep, v_fatigue, v_mood, v_stress, v_soreness, v_rpe, v_minutes);

    -- ==========================================
    -- Player Warning (技安): 負荷增加，恢復下降
    -- ==========================================
    -- 前兩週正常，後兩週加量
    IF i < 14 THEN
        v_rpe := 4 + floor(random() * 2);
        v_minutes := 90;
    ELSE
        -- 逐漸增加
        v_rpe := 6 + floor(random() * 2);
        v_minutes := 120 + floor(random() * 30);
    END IF;
    
    -- Wellness: 15-20 (中等)
    v_sleep := 3 + floor(random() * 2);
    v_fatigue := 3 + floor(random() * 2);
    v_mood := 3 + floor(random() * 2);
    v_stress := 3 + floor(random() * 2);
    v_soreness := 3 + floor(random() * 2);
    
    -- RHR: Slightly elevated.
    v_rhr := 55 + floor(random() * 5);

    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes)
    VALUES (v_player_warn_id, v_date, v_rhr, v_sleep, v_fatigue, v_mood, v_stress, v_soreness, v_rpe, v_minutes);

    -- ==========================================
    -- Player Risk (大雄): 忽高忽低，過度訓練，身體素質差
    -- ==========================================
    -- 模擬 Spike
    IF i > 20 THEN
        v_rpe := 8 + floor(random() * 3); -- 8-10
        v_minutes := 150 + floor(random() * 60);
    ELSE
        v_rpe := 3 + floor(random() * 3);
        v_minutes := 60;
    END IF;
    
    -- Wellness: < 15 (差)
    v_sleep := 1 + floor(random() * 3);
    v_fatigue := 1 + floor(random() * 3);
    v_mood := 1 + floor(random() * 3);
    v_stress := 1 + floor(random() * 3);
    v_soreness := 1 + floor(random() * 3);
    
    -- RHR: High.
    v_rhr := 65 + floor(random() * 10); 

    INSERT INTO sport.daily_records (player_id, record_date, rhr_bpm, sleep_quality, fatigue_level, mood, stress_level, muscle_soreness, srpe_score, training_minutes)
    VALUES (v_player_risk_id, v_date, v_rhr, v_sleep, v_fatigue, v_mood, v_stress, v_soreness, v_rpe, v_minutes);

  END LOOP;
  
  RAISE NOTICE '✅ 測試數據刷新完成！對象：出木杉(安)、技安(警)、大雄(危)。時間範圍: % 到 %', (CURRENT_DATE - INTERVAL '29 days')::DATE, CURRENT_DATE;
  
END $$ LANGUAGE plpgsql;

-- 2. 賦予執行權限
GRANT EXECUTE ON FUNCTION sport.regenerate_demo_data TO authenticated, service_role;

-- 3. 立即執行一次
SELECT sport.regenerate_demo_data();
