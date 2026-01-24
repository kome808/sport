-- ================================================
-- 建立 get_my_teams RPC (增強版)
-- 日期: 2026-01-25
-- 說明：讓教練取得自己所屬的所有球隊 (包含建立的與被邀請的)
-- 增強：同時檢查 team_members 表與 teams.coach_id (擁有者)，避免資料不一致導致遺漏
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

    -- 3. 查詢關聯球隊 (Union 擁有者與成員)
    RETURN QUERY
    WITH user_teams AS (
        -- 透過成員表查詢
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
        
        -- 透過擁有者欄位查詢 (Fallback，處理舊資料或建立失敗的情況)
        SELECT 
            t.id,
            t.name,
            t.slug,
            t.logo_url,
            'owner' as role
        FROM sport.teams t
        WHERE t.coach_id = v_coach_id
        AND NOT EXISTS (
            SELECT 1 FROM sport.team_members tm 
            WHERE tm.team_id = t.id AND tm.coach_id = v_coach_id
        )
    )
    SELECT DISTINCT ON (id) 
        id, 
        name::TEXT, 
        slug::TEXT, 
        logo_url::TEXT, 
        role::TEXT
    FROM user_teams;
    
END;
$$;

-- 授權
GRANT EXECUTE ON FUNCTION public.get_my_teams() TO authenticated, service_role;
