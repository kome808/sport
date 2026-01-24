-- ================================================
-- 教練邀請機制 (從備份恢復)
-- 日期: 2026-01-24
-- 說明：確保教練邀請碼、加入球隊與管理教練列表功能已部署
-- ================================================

-- 1. 新增欄位至 sport.teams
ALTER TABLE sport.teams 
ADD COLUMN IF NOT EXISTS coach_invitation_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_coach_invitation_enabled BOOLEAN DEFAULT true;

-- 2. 驗證教練邀請碼 RPC
CREATE OR REPLACE FUNCTION sport.fn_validate_coach_invitation_code(code TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT) 
SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name::TEXT, t.slug::TEXT
    FROM sport.teams t 
    WHERE t.coach_invitation_code = code AND t.is_coach_invitation_enabled = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Proxy RPC
CREATE OR REPLACE FUNCTION public.validate_coach_invitation_code(code TEXT) 
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT) AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_validate_coach_invitation_code(code); END; $$ LANGUAGE plpgsql;

-- 3. 教練加入球隊 RPC
CREATE OR REPLACE FUNCTION sport.fn_join_team_as_coach(
    invitation_code TEXT, 
    coach_name TEXT DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE 
    v_team_id UUID;
    v_coach_id UUID;
    v_email TEXT;
    v_existing_member UUID;
BEGIN
    -- A. 驗證邀請碼
    SELECT id INTO v_team_id FROM sport.teams 
    WHERE coach_invitation_code = fn_join_team_as_coach.invitation_code 
      AND is_coach_invitation_enabled = true;
      
    IF v_team_id IS NULL THEN 
        RAISE EXCEPTION '無效或已過期的通行碼'; 
    END IF;

    -- B. 取得當前 User Email (從 Session)
    v_email := auth.jwt() ->> 'email';
    IF v_email IS NULL THEN 
        RAISE EXCEPTION '尚未登入'; 
    END IF;

    -- C. 檢查/建立 sport.coaches
    SELECT id INTO v_coach_id FROM sport.coaches WHERE email = v_email;
    
    IF v_coach_id IS NULL THEN
        -- 自動建立教練資料
        INSERT INTO sport.coaches (email, name)
        VALUES (v_email, COALESCE(coach_name, split_part(v_email, '@', 1)))
        RETURNING id INTO v_coach_id;
    END IF;

    -- D. 加入 team_members
    INSERT INTO sport.team_members (team_id, coach_id, role)
    VALUES (v_team_id, v_coach_id, 'admin')
    ON CONFLICT (team_id, coach_id) DO NOTHING
    RETURNING id INTO v_existing_member;

    IF v_existing_member IS NULL THEN
        -- 如果已經是成員，取得現有資料回傳，不報錯
        RETURN jsonb_build_object('success', true, 'message', '您已是該球隊教練');
    END IF;

    RETURN jsonb_build_object('success', true, 'team_id', v_team_id);
END;
$$ LANGUAGE plpgsql;

-- Proxy RPC
CREATE OR REPLACE FUNCTION public.join_team_as_coach(invitation_code TEXT, coach_name TEXT DEFAULT NULL) 
RETURNS JSONB AS $$
BEGIN RETURN sport.fn_join_team_as_coach(invitation_code, coach_name); END; $$ LANGUAGE plpgsql;

-- 4. 取得球隊教練列表 RPC
CREATE OR REPLACE FUNCTION sport.fn_get_team_coaches(p_team_id UUID)
RETURNS TABLE (
    coach_id UUID, 
    name TEXT, 
    email TEXT, 
    avatar_url TEXT, 
    role TEXT,
    joined_at TIMESTAMPTZ
) 
SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name::TEXT, c.email::TEXT, c.avatar_url::TEXT, tm.role::TEXT, tm.joined_at
    FROM sport.team_members tm
    JOIN sport.coaches c ON tm.coach_id = c.id
    WHERE tm.team_id = p_team_id
    ORDER BY tm.joined_at; -- Owner usually first
END;
$$ LANGUAGE plpgsql;

-- Proxy RPC
CREATE OR REPLACE FUNCTION public.get_team_coaches(team_id UUID) 
RETURNS TABLE (coach_id UUID, name TEXT, email TEXT, avatar_url TEXT, role TEXT, joined_at TIMESTAMPTZ) AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_get_team_coaches(team_id); END; $$ LANGUAGE plpgsql;

-- 5. 移除教練 RPC
CREATE OR REPLACE FUNCTION sport.fn_remove_team_coach(p_team_id UUID, p_target_coach_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE 
    v_current_coach_id UUID;
    v_current_role TEXT;
    v_target_role TEXT;
BEGIN
    -- 取得當前操作者
    v_current_coach_id := (SELECT id FROM sport.coaches WHERE email = auth.jwt() ->> 'email' LIMIT 1);
    
    -- 檢查當前操作者權限
    SELECT role INTO v_current_role FROM sport.team_members 
    WHERE team_id = p_team_id AND coach_id = v_current_coach_id;
    
    IF v_current_role IS NULL THEN RAISE EXCEPTION '權限不足'; END IF;

    -- 檢查目標角色
    SELECT role INTO v_target_role FROM sport.team_members
    WHERE team_id = p_team_id AND coach_id = p_target_coach_id;

    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION '無法移除擁有者';
    END IF;

    -- 執行移除
    DELETE FROM sport.team_members
    WHERE team_id = p_team_id AND coach_id = p_target_coach_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Proxy RPC
CREATE OR REPLACE FUNCTION public.remove_team_coach(team_id UUID, target_coach_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN RETURN sport.fn_remove_team_coach(team_id, target_coach_id); END; $$ LANGUAGE plpgsql;

-- 放寬 Teams Update Policy 給 Admin
DROP POLICY IF EXISTS "teams_update_owner" ON sport.teams;
DROP POLICY IF EXISTS "teams_update_admin" ON sport.teams;

CREATE POLICY "teams_update_admin" ON sport.teams
FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = (SELECT id FROM sport.coaches WHERE email = auth.jwt() ->> 'email' LIMIT 1) 
      AND role IN ('owner', 'admin')
  )
);

-- 權限 Grant
GRANT EXECUTE ON FUNCTION public.validate_coach_invitation_code(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_team_as_coach(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_coaches(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_team_coach(UUID, UUID) TO authenticated, service_role;
