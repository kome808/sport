-- cleanup_shohoku_players.sql
-- 只保留湘北五虎，刪除其他閒雜人等
DELETE FROM sport.players 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball')
AND name NOT IN ('櫻木 花道', '流川 楓', '赤木 剛憲', '宮城 良田', '三井 壽', '樱木花道', '赤木剛憲', '宮城良田'); 
-- 注意：包含簡體/繁體可能的異體字，或之前的 seed 寫入的名字

DO $$
BEGIN
    RAISE NOTICE '✅ 湘北隊陣容已清理，只保留先發五人';
END $$;
