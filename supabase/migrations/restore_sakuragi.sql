-- restore_sakuragi.sql (v3: Manual Check)
DO $$
DECLARE
    v_team_id UUID;
    v_player_id UUID;
BEGIN
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'shohoku-basketball';

    -- 1. 嘗試查找現有的櫻木花道 (用背號或名字)
    SELECT id INTO v_player_id 
    FROM sport.players 
    WHERE team_id = v_team_id AND (jersey_number = '10' OR name LIKE '%櫻木%');

    IF v_player_id IS NOT NULL THEN
        -- 2. 若存在，更新之
        UPDATE sport.players
        SET 
            name = '櫻木 花道',
            jersey_number = '10',
            position = 'PF',
            is_active = true,
            is_claimed = true,
            short_code = '3ss',
            password_hash = crypt('demo123', gen_salt('bf'))
        WHERE id = v_player_id;
        RAISE NOTICE '✅ 已更新現有櫻木花道資料 (id: %)', v_player_id;
    ELSE
        -- 3. 若不存在，插入之
        INSERT INTO sport.players (team_id, name, jersey_number, position, password_hash, is_active, is_claimed, short_code)
        VALUES (
            v_team_id, 
            '櫻木 花道', 
            '10', 
            'PF', 
            crypt('demo123', gen_salt('bf')),
            true, 
            true,
            '3ss'
        );
        RAISE NOTICE '✅ 已新建櫻木花道資料';
    END IF;

END $$;
