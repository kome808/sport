SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'sport' AND table_name LIKE '%pain%';
