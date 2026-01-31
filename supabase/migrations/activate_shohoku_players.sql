-- activate_shohoku_players.sql
UPDATE sport.players 
SET is_active = true 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');

DO $$
BEGIN
    RAISE NOTICE '✅ 湘北隊球員已設為活躍狀態 (is_active = true)';
END $$;
