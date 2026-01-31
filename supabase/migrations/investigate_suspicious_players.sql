-- investigate_suspicious_players.sql
SELECT 
    p.name, 
    p.jersey_number, 
    p.created_at,
    t.name as team_name, 
    t.slug as team_slug,
    t.is_demo
FROM sport.players p
JOIN sport.teams t ON p.team_id = t.id
WHERE p.name IN ('陳慎', '胡逸涵', '許雲奕', '戴昊恩', '陳小小')
ORDER BY p.name, t.name;
