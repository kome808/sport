-- add_sakuragi_injury.sql
DO $$
DECLARE
    v_player_id UUID;
    v_demo_date DATE := '2026-01-27'::DATE; -- Demo 鎖定日期
BEGIN
    SELECT id INTO v_player_id FROM sport.players 
    WHERE name = '櫻木 花道' AND team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');

    IF v_player_id IS NULL THEN
        RAISE EXCEPTION '找不到櫻木花道，請先執行 restore_sakuragi.sql';
    END IF;

    -- 1. (Skip) pain_records 不存在，跳過痠痛紀錄插入
    -- 僅插入正式傷病報告


    -- 2. 新增正式傷病報告 (Active Injury)
    INSERT INTO sport.pain_reports (
        player_id, 
        report_date, 
        body_part, 
        pain_level, 
        pain_type,
        description, 
        is_resolved
    )
    VALUES (
        v_player_id, 
        v_demo_date - INTERVAL '3 days',  -- 報告日期：1/24
        'Lower Back',                     -- 部位
        8,                                -- 疼痛指數
        'acute',                          -- 疼痛類型 (符合 constraint: acute, chronic, fatigue)
        '山王戰救球時背部受擊，疑似脊椎損傷，需休養觀察。預計復原：2026-02-10', -- 描述
        false                             -- 未解決 (Active)
    );

    RAISE NOTICE '✅ 已新增櫻木花道的背傷紀錄 (鎖定日期: 2026-01-27)';
END $$;
