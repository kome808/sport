-- check_teams_schema.sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'sport' AND table_name = 'teams'
ORDER BY ordinal_position;
