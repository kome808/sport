-- ================================================
-- 匿名展示模式 Migrations
-- 日期: 2026-01-25
-- 說明：實現基於 Supabase 匿名登入的唯讀展示功能
-- ================================================

BEGIN;

-- 1. 在 Teams 增加 is_demo 標記
ALTER TABLE sport.teams ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- 將現有的官方演示球隊標記為 demo
UPDATE sport.teams SET is_demo = TRUE WHERE slug = 'doraemon-baseball';

-- 2. 修正 RLS 政策，允許匿名使用者讀取 Demo 數據
-- 匿名使用者的特徵：(auth.jwt()->>'is_anonymous')::boolean IS TRUE

-- Teams 偵測
CREATE POLICY "teams_select_anonymous_demo" ON sport.teams
FOR SELECT TO authenticated
USING (
    is_demo = TRUE AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- Players 偵測
CREATE POLICY "players_select_anonymous_demo" ON sport.players
FOR SELECT TO authenticated
USING (
    team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- Team Members 偵測
CREATE POLICY "team_members_select_anonymous_demo" ON sport.team_members
FOR SELECT TO authenticated
USING (
    team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- Daily Records 偵測
CREATE POLICY "daily_records_select_anonymous_demo" ON sport.daily_records
FOR SELECT TO authenticated
USING (
    player_id IN (
        SELECT id FROM sport.players 
        WHERE team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    )
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- Pain Reports 偵測
CREATE POLICY "pain_reports_select_anonymous_demo" ON sport.pain_reports
FOR SELECT TO authenticated
USING (
    player_id IN (
        SELECT id FROM sport.players 
        WHERE team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    )
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- Notifications 偵測
CREATE POLICY "notifications_select_anonymous_demo" ON sport.notifications
FOR SELECT TO authenticated
USING (
    team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- 3. 修改 get_my_teams RPC，讓匿名帳號能看到 Demo 球隊
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
    v_is_anonymous BOOLEAN;
    v_email TEXT;
    v_coach_id UUID;
BEGIN
    -- 1. 判斷是否為匿名帳號
    v_is_anonymous := (auth.jwt() ->> 'is_anonymous')::boolean;
    
    -- 2. 匿名帳號直接回傳所有 is_demo = true 的球隊
    IF v_is_anonymous IS TRUE THEN
        RETURN QUERY
        SELECT 
            t.id as team_id,
            t.name::TEXT,
            t.slug::TEXT,
            t.logo_url::TEXT,
            'viewer'::TEXT as role -- 匿名者統一給予觀賞者角色
        FROM sport.teams t
        WHERE t.is_demo = TRUE;
        RETURN;
    END IF;

    -- 3. 非匿名帳號走原本邏輯
    v_email := auth.jwt() ->> 'email';
    IF v_email IS NULL THEN
        RETURN;
    END IF;

    SELECT id INTO v_coach_id FROM sport.coaches WHERE email = v_email;
    IF v_coach_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH user_teams AS (
        SELECT t.id, t.name, t.slug, t.logo_url, tm.role
        FROM sport.team_members tm
        JOIN sport.teams t ON tm.team_id = t.id
        WHERE tm.coach_id = v_coach_id
        
        UNION ALL
        
        SELECT t.id, t.name, t.slug, t.logo_url, 'owner'::text as role
        FROM sport.teams t
        WHERE t.coach_id = v_coach_id
        AND NOT EXISTS (
            SELECT 1 FROM sport.team_members tm 
            WHERE tm.team_id = t.id AND tm.coach_id = v_coach_id
        )
    )
    SELECT DISTINCT ON (ut.id) 
        ut.id, ut.name::TEXT, ut.slug::TEXT, ut.logo_url::TEXT, ut.role::TEXT
    FROM user_teams ut;
END;
$$;

COMMIT;
