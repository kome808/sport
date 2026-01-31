-- update_shohoku_short_codes.sql
-- 根據原始設計恢復 short_code
UPDATE sport.players SET short_code = '3ss' WHERE name = '櫻木 花道' AND team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');
UPDATE sport.players SET short_code = 'rukawa' WHERE name = '流川 楓' AND team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');
UPDATE sport.players SET short_code = 'gori' WHERE name = '赤木 剛憲' AND team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');
UPDATE sport.players SET short_code = 'ryota' WHERE name = '宮城 良田' AND team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');
UPDATE sport.players SET short_code = 'mitchi' WHERE name = '三井 壽' AND team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');

RAISE NOTICE '✅ 湘北隊球員 short_code 已更新';
