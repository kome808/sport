-- ================================================
-- 教練多球隊支援功能
-- 日期: 2026-01-25
-- 說明：新增取得教練所屬球隊列表的 RPC
-- ================================================

-- 1. 取得當前教練所屬的所有球隊 RPC
CREATE OR REPLACE FUNCTION sport.fn_get_my_teams()
RETURNS TABLE (
    team_id UUID,
    name TEXT,
    slug TEXT,
    logo_url TEXT,
    role TEXT
)
SECURITY DEFINER
SET search_path = public, sport
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name::TEXT, t.slug::TEXT, t.logo_url::TEXT, tm.role::TEXT
    FROM sport.team_members tm
    JOIN sport.teams t ON tm.team_id = t.id
    WHERE tm.coach_id = (SELECT id FROM sport.coaches WHERE email = auth.jwt() ->> 'email' LIMIT 1)
    ORDER BY tm.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Proxy RPC
CREATE OR REPLACE FUNCTION public.get_my_teams()
RETURNS TABLE (team_id UUID, name TEXT, slug TEXT, logo_url TEXT, role TEXT)
AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_get_my_teams(); END;
$$ LANGUAGE plpgsql;

-- 3. 權限
GRANT EXECUTE ON FUNCTION public.get_my_teams() TO authenticated;
