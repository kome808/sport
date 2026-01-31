-- generate_sakuragi_history.sql
DO $$
DECLARE
    v_player_id UUID;
    v_demo_date DATE := '2026-01-27'::DATE;
    v_start_date DATE;
    v_curr_date DATE;
    v_rhr INT;
    v_minutes INT;
    v_srpe INT;
BEGIN
    SELECT id INTO v_player_id FROM sport.players WHERE name = '櫻木 花道' LIMIT 1;
    IF v_player_id IS NULL THEN RAISE EXCEPTION '找不到櫻木花道'; END IF;

    v_start_date := v_demo_date - INTERVAL '29 days';

    -- 迴圈生成過去 30 天資料 (包含 Demo 當天)
    FOR i IN 0..29 LOOP
        v_curr_date := v_start_date + (i || ' days')::INTERVAL;
        
        -- 模擬數據
        v_rhr := 55 + floor(random() * 10);      -- 心率 55-65
        v_minutes := 60 + floor(random() * 60);  -- 訓練 60-120 分鐘
        v_srpe := 4 + floor(random() * 4);       -- sRPE 4-8 (有點累)

        -- 模擬受傷前幾天 (1/24 受傷)
        IF v_curr_date >= (v_demo_date - INTERVAL '3 days') THEN
             v_minutes := 0; -- 受傷後無法訓練
             v_srpe := 0;
             v_rhr := v_rhr + 5; -- 受傷心率略升
        END IF;

        INSERT INTO sport.daily_records (
            player_id, record_date, 
            rhr_bpm, training_minutes, srpe_score, 
            sleep_quality, fatigue_level, stress_level, muscle_soreness, mood
        )
        VALUES (
            v_player_id, 
            v_curr_date,
            v_rhr,
            v_minutes,
            v_srpe,
            3, -- 睡眠普通
            3 + floor(random() * 3), -- 疲勞 3-5
            3,
            CASE WHEN v_curr_date >= (v_demo_date - INTERVAL '3 days') THEN 5 ELSE 2 END, -- 受傷後極痛
            3
        )
        ON CONFLICT (player_id, record_date) DO UPDATE SET
            rhr_bpm = EXCLUDED.rhr_bpm,
            training_minutes = EXCLUDED.training_minutes,
            srpe_score = EXCLUDED.srpe_score;
            
    END LOOP;

    RAISE NOTICE '✅ 已生成櫻木花道過去 30 天的訓練數據 (ACWR 應正常顯示)';
END $$;
