-- ================================================
-- Migration 022: Populate Historical Risk levels and ACWR
-- Fixes NULL values in daily_records and adds trigger for future updates
-- ================================================

-- 1. 更新現有的 daily_records 資料
-- 對於每一筆紀錄，使用已有的 calculate_ewma_acwr 邏輯來計算
DO $$ 
DECLARE 
    r RECORD;
    v_acwr DECIMAL(4,2);
    v_risk VARCHAR(20);
BEGIN
    FOR r IN (SELECT id, player_id, record_date FROM sport.daily_records ORDER BY record_date) LOOP
        -- 我們這裡直接執行計算邏輯或調用 RPC 內部的邏輯
        -- 為了簡單起見，我們調用 calculate_ewma_acwr 但它只返回當天的
        SELECT acwr INTO v_acwr FROM sport.calculate_ewma_acwr(r.player_id, r.record_date);
        
        -- 風險等級邏輯
        IF v_acwr IS NULL THEN v_risk := 'green';
        ELSIF v_acwr > 1.5 THEN v_risk := 'red';
        ELSIF v_acwr > 1.3 THEN v_risk := 'yellow';
        ELSIF v_acwr < 0.8 THEN v_risk := 'yellow';
        ELSE v_risk := 'green';
        END IF;

        UPDATE sport.daily_records 
        SET acwr = v_acwr, risk_level = v_risk
        WHERE id = r.id;
    END LOOP;
END $$;

-- 2. 修改自動計算觸發器，納入 ACWR 與 風險等級
CREATE OR REPLACE FUNCTION sport.calculate_daily_record_values()
RETURNS TRIGGER AS $$
DECLARE
    v_acwr DECIMAL(4,2);
BEGIN
  -- A. 計算 Wellness 總分
  NEW.wellness_total = COALESCE(NEW.sleep_quality, 0) 
                     + COALESCE(NEW.fatigue_level, 0) 
                     + COALESCE(NEW.mood, 0) 
                     + COALESCE(NEW.stress_level, 0) 
                     + COALESCE(NEW.muscle_soreness, 0);

  -- B. 計算 訓練負荷 (sRPE * minutes)
  NEW.training_load_au = COALESCE(NEW.srpe_score, 0) * COALESCE(NEW.training_minutes, 0);

  -- C. 自動計算 ACWR (調用現有函數)
  SELECT acwr INTO v_acwr FROM sport.calculate_ewma_acwr(NEW.player_id, NEW.record_date);
  NEW.acwr = v_acwr;

  -- D. 判定 風險等級
  IF v_acwr IS NULL THEN NEW.risk_level := 'green';
  ELSIF v_acwr > 1.5 THEN NEW.risk_level := 'red';
  ELSIF v_acwr > 1.3 THEN NEW.risk_level := 'yellow';
  ELSIF v_acwr < 0.8 THEN NEW.risk_level := 'yellow';
  ELSE NEW.risk_level := 'green';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
