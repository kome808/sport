-- check_rls_policies.sql
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname = 'sport' 
  AND tablename IN ('players', 'daily_records', 'teams');
