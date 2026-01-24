-- ================================================
-- 取得球隊邀請狀態 (用於邀請頁面預先檢查)
-- 日期: 2026-01-25
-- ================================================

CREATE OR REPLACE FUNCTION public.get_team_invitation_status(p_slug TEXT)
RETURNS TABLE (
    team_name TEXT,
    is_invitation_enabled BOOLEAN,
    is_coach_invitation_enabled BOOLEAN
) 
SECURITY DEFINER 
SET search_path = public, sport
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        name::TEXT,
        is_invitation_enabled,
        is_coach_invitation_enabled
    FROM sport.teams
    WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_team_invitation_status(TEXT) TO anon, authenticated, service_role;
