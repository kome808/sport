-- ================================================
-- 讓教練驗證 RPC 回傳啟用狀態，以區分「無效」與「未啟用」
-- 日期: 2026-01-25
-- ================================================

-- 1. 更新 Core RPC
CREATE OR REPLACE FUNCTION sport.fn_validate_coach_invitation_code(code TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT, is_enabled BOOLEAN) 
SECURITY DEFINER 
SET search_path = public, sport
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name::TEXT, t.slug::TEXT, t.is_coach_invitation_enabled
    FROM sport.teams t 
    WHERE t.coach_invitation_code = code 
    -- 這裡移除原本的 AND is_coach_invitation_enabled = true，改由前端判斷
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 2. 更新 Proxy RPC (參數名稱改為 p_code 避免衝突)
CREATE OR REPLACE FUNCTION public.validate_coach_invitation_code(p_invcode TEXT) 
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT, is_enabled BOOLEAN) AS $$
BEGIN 
    RETURN QUERY SELECT * FROM sport.fn_validate_coach_invitation_code(p_invcode); 
END; 
$$ LANGUAGE plpgsql;

-- 3. 權限
GRANT EXECUTE ON FUNCTION public.validate_coach_invitation_code(TEXT) TO anon, authenticated, service_role;
