-- check_demo_access_debug.sql
-- 1. 檢查球員資料與短代碼
SELECT 
    p.name, 
    p.short_code, 
    p.is_active, 
    t.slug as team_slug, 
    t.is_demo,
    t.id as team_id
FROM sport.players p
JOIN sport.teams t ON p.team_id = t.id
WHERE p.name LIKE '%櫻木%';

-- 2. 測試 RLS (模擬匿名訪問)
-- 注意：在 SQL Editor 中通常是 postgres/service_role 權限，無法完全模擬 anon。
-- 但我們可以檢查 Policy 是否存在且啟用。
SELECT * FROM pg_policies WHERE tablename = 'players' AND policyname LIKE '%demo%';
