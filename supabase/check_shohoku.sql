DO $$
DECLARE
    v_team_id UUID;
    v_team_name TEXT;
    v_is_demo BOOLEAN;
    v_player_count INT;
BEGIN
    SELECT id, name, is_demo INTO v_team_id, v_team_name, v_is_demo
    FROM sport.teams
    WHERE slug = 'shohoku-basketball';

    RAISE NOTICE 'Team Information:';
    RAISE NOTICE '  Name: %', v_team_name;
    RAISE NOTICE '  ID: %', v_team_id;
    RAISE NOTICE '  Is Demo: %', v_is_demo;

    IF v_team_id IS NOT NULL THEN
        SELECT count(*) INTO v_player_count
        FROM sport.players
        WHERE team_id = v_team_id;
        
        RAISE NOTICE '  Player Count: %', v_player_count;
    ELSE
        RAISE NOTICE '❌ Team shohoku-basketball NOT FOUND';
    END IF;
END $$;
