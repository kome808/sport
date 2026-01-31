-- check_shohoku_data.sql
DO $$
DECLARE
    v_team_id UUID;
    v_player_count INT;
    v_record_count INT;
BEGIN
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'shohoku-basketball';
    
    IF v_team_id IS NULL THEN
        RAISE NOTICE '❌ Team "shohoku-basketball" NOT found.';
    ELSE
        RAISE NOTICE '✅ Team "shohoku-basketball" found. ID: %', v_team_id;
        
        SELECT COUNT(*) INTO v_player_count FROM sport.players WHERE team_id = v_team_id;
        RAISE NOTICE '📊 Player count: %', v_player_count;
        
        IF v_player_count > 0 THEN
             SELECT COUNT(*) INTO v_record_count 
             FROM sport.daily_records 
             WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
             RAISE NOTICE '📊 Total daily records: %', v_record_count;
        END IF;
    END IF;
END $$;
