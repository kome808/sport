SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'sport' 
AND table_name IN ('teams', 'players')
ORDER BY table_name, ordinal_position;
