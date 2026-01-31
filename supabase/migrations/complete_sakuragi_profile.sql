-- complete_sakuragi_profile.sql
DO $$
DECLARE
    v_player_id UUID;
    v_demo_date DATE := '2026-01-27'::DATE;
BEGIN
    SELECT id INTO v_player_id FROM sport.players WHERE name = '櫻木 花道' LIMIT 1;

    IF v_player_id IS NULL THEN RAISE EXCEPTION '找不到櫻木花道'; END IF;

    -- 1. 補齊基本資料
    UPDATE sport.players
    SET 
        height_cm = 189.2,
        weight_kg = 83.0,
        birth_date = '2008-04-01', -- 假設是高一 16 歲
        avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakuragi' -- 預設頭貼
    WHERE id = v_player_id;

    -- 2. 補齊 1/27 每日紀錄 (如果有缺)
    INSERT INTO sport.daily_records (
        player_id, record_date, training_minutes, srpe_score, 
        sleep_quality, fatigue_level, stress_level, muscle_soreness, 
        mood
    )
    VALUES (
        v_player_id, 
        v_demo_date,
        0,   -- 受傷沒練
        0,   -- 強度 0
        2,   -- 睡不好 (痛)
        5,   -- 很疲勞
        4,   -- 壓力大
        5,   -- 極度痠痛
        2    -- 心情差
    )
    ON CONFLICT (player_id, record_date) DO UPDATE SET
        fatigue_level = 5,
        muscle_soreness = 5,
        training_minutes = 0; -- 確保顯示受傷狀態

    RAISE NOTICE '✅ 櫻木花道資料已補全 (基本資料 + 1/27 日誌)';
END $$;
