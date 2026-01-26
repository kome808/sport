-- 測試 RLS 權限 (模擬匿名使用者)

-- 1. 設定 JWT Claims 模擬已登入的匿名使用者
-- 注意: 'anon' role 是 Supabase 的公開角色，但 RLS 通常檢查 'authenticated' role 加 JWT
-- 在 Supabase 中，匿名登入其實是給予一個特殊的 JWT，該 JWT 包含 is_anonymous: true
-- 並且 role 仍然是 'authenticated' (或類似，取決於設定，通常 anonymous sign-in 也是 authenticated role)

-- 為了最接近真實情況，我們先切換到 authenticated 角色，並設定 claims
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"is_anonymous": true, "role": "authenticated", "sub": "00000000-0000-0000-0000-000000000000"}', true);

-- 2. 嘗試查詢 Demo Team
SELECT 'Querying Team as Anonymous' as test_name;
SELECT id, name, slug, is_demo FROM sport.teams WHERE slug = 'shohoku-basketball';

-- 3. 嘗試查詢 Demo Players
SELECT 'Querying Players as Anonymous' as test_name;
SELECT id, name, team_id FROM sport.players 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball');

-- 4. 嘗試查詢 Daily Records
SELECT 'Querying Records as Anonymous' as test_name;
SELECT id, record_date, training_minutes FROM sport.daily_records 
WHERE player_id IN (
    SELECT id FROM sport.players WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'shohoku-basketball')
) LIMIT 5;

-- 恢復權限 (雖然後續執行通常會重置，但好習慣)
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);
