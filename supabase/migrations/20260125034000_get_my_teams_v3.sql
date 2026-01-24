-- ================================================
-- 建立 get_my_teams RPC (V3 - 修復 Ambiguous Column 錯誤)
-- 日期: 2026-01-25
-- 說明：解決 400 Bad Request ERROR: column reference "name" is ambiguous
-- 修正：在最後的 SELECT 中明確使用 Table Alias
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
        RETURN;
    END IF;

    -- 2. 取得 Coach ID
    SELECT id INTO v_coach_id FROM sport.coaches WHERE email = v_email;
    IF v_coach_id IS NULL THEN
        RETURN;
    END IF;

    -- 3. 查詢關聯球隊
    -- 使用 CTE 並在最終查詢明確指定 alias 以避免與 OUT 參數衝突
    RETURN QUERY
    WITH user_teams AS (
        -- 成員關聯
        SELECT 
            t.id,
            t.name,
            t.slug,
            t.logo_url,
            tm.role
        FROM sport.team_members tm
        JOIN sport.teams t ON tm.team_id = t.id
        WHERE tm.coach_id = v_coach_id
        
        UNION ALL
        
        -- 擁有者關聯 (Fallback)
        SELECT 
            t.id,
            t.name,
            t.slug,
            t.logo_url,
            'owner'::text as role
        FROM sport.teams t
        WHERE t.coach_id = v_coach_id
        AND NOT EXISTS (
            SELECT 1 FROM sport.team_members tm 
            WHERE tm.team_id = t.id AND tm.coach_id = v_coach_id
        )
    )
    SELECT DISTINCT ON (ut.id) 
        ut.id, 
        ut.name::TEXT, 
        ut.slug::TEXT, 
        ut.logo_url::TEXT, 
        ut.role::TEXT
    FROM user_teams ut;
    
END;
$$;

-- 授權
GRANT EXECUTE ON FUNCTION public.get_my_teams() TO authenticated, service_role;
