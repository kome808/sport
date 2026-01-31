-- update_sakuragi_today_srpe.sql
DO $$
DECLARE
    v_player_id UUID;
    v_demo_date DATE := '2026-01-27'::DATE;
BEGIN
    SELECT id INTO v_player_id FROM sport.players WHERE name = '櫻木 花道' LIMIT 1;

    -- 強制更新 1/27 的數據，讓他有點訓練量 (恢復性訓練)
    UPDATE sport.daily_records
    SET 
        training_minutes = 30,  -- 30 分鐘
        srpe_score = 3,         -- 強度 3 (輕鬆)
        fatigue_level = 4,      -- 還是有點累
        muscle_soreness = 4     -- 還在酸
    WHERE player_id = v_player_id AND record_date = v_demo_date;

    RAISE NOTICE '✅ 已更新櫻木花道 1/27 的訓練數據 (30min * RPE 3)';
END $$;
