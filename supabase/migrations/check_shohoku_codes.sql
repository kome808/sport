SELECT p.name, p.jersey_number, p.short_code, t.slug as team_slug
FROM sport.players p
JOIN sport.teams t ON p.team_id = t.id
WHERE t.slug = 'shohoku-basketball'
ORDER BY p.jersey_number;
