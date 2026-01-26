-- 查看球隊資訊
SELECT id, name, slug, is_demo, coach_id 
FROM sport.teams 
WHERE slug = 'shohoku-basketball';

-- 查看該球隊的球員
SELECT id, name, jersey_number, team_id, is_active, status 
FROM sport.players 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');

-- 查看該球隊的今日訓練紀錄 (確認是否有生成數據)
SELECT id, player_id, record_date, training_minutes, srpe_score 
FROM sport.daily_records 
WHERE player_id IN (
    SELECT id FROM sport.players 
    WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball')
)
ORDER BY record_date DESC
LIMIT 10;
