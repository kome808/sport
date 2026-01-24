-- ================================================
-- 建立 get_my_teams RPC
-- 日期: 2026-01-25
-- 說明：讓教練取得自己所屬的所有球隊 (包含建立的與被邀請的)
-- ================================================

CREATE OR REPLACE FUNCTION public.get_my_teams()
RETURNS TABLE (
    team_id UUID,
    name TEXT,
    slug TEXT,
    logo_url TEXT,
    role TEXT
)
SECURITY DEFINER
SET search_path = public, sport
LANGUAGE plpgsql
AS $$
DECLARE
    v_email TEXT;
    v_coach_id UUID;
BEGIN
    -- 1. 取得當前使用者 Email
    v_email := auth.jwt() ->> 'email';
    IF v_email IS NULL THEN
        RETURN; -- 未登入回傳空
    END IF;

    -- 2. 取得 Coach ID
    SELECT id INTO v_coach_id FROM sport.coaches WHERE email = v_email;
    IF v_coach_id IS NULL THEN
        RETURN; -- 無教練資料回傳空
    END IF;

    -- 3. 查詢關聯球隊
    RETURN QUERY
    SELECT 
        t.id,
        t.name::TEXT,
        t.slug::TEXT,
        t.logo_url::TEXT,
        tm.role::TEXT
    FROM sport.team_members tm
    JOIN sport.teams t ON tm.team_id = t.id
    WHERE tm.coach_id = v_coach_id
    ORDER BY tm.joined_at DESC;
END;
$$;

-- 授權
GRANT EXECUTE ON FUNCTION public.get_my_teams() TO authenticated, service_role;
