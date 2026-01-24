-- ================================================
-- 匿名展示模式終極修補 (解決無 Email 問題)
-- 日期: 2026-01-25
-- ================================================

BEGIN;

-- 1. 標記演示球隊
UPDATE sport.teams SET is_demo = TRUE WHERE slug = 'doraemon-baseball';
-- 保險措施：如果沒有指定的 slug，就拿最近建立的一個球隊當 Demo
UPDATE sport.teams SET is_demo = TRUE 
WHERE id = (SELECT id FROM sport.teams ORDER BY created_at ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM sport.teams WHERE is_demo = TRUE);

-- 2. 修正 RPC: get_my_teams (移除對 Email 的強制依賴)
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
    v_is_anon BOOLEAN;
    v_email TEXT;
BEGIN
    v_is_anon := (auth.jwt() ->> 'is_anonymous')::boolean;
    v_email := auth.jwt() ->> 'email';

    -- 匿名帳號邏輯：回傳所有標記為 Demo 的球隊
    IF v_is_anon IS TRUE THEN
        RETURN QUERY
        SELECT t.id, t.name::TEXT, t.slug::TEXT, t.logo_url::TEXT, 'viewer'::TEXT
        FROM sport.teams t
        WHERE t.is_demo = TRUE;
        RETURN;
    END IF;

    -- 一般帳號邏輯
    RETURN QUERY
    WITH current_coach AS (
        SELECT id FROM sport.coaches WHERE email = v_email
    )
    SELECT DISTINCT ON (t.id) 
        t.id, t.name::TEXT, t.slug::TEXT, t.logo_url::TEXT, 
        COALESCE(tm.role, 'owner')::TEXT as role
    FROM sport.teams t
    LEFT JOIN sport.team_members tm ON t.id = tm.team_id
    WHERE t.coach_id IN (SELECT id FROM current_coach)
       OR tm.coach_id IN (SELECT id FROM current_coach);
END;
$$;

-- 3. 解放 RLS 政策 (關鍵：只要是 Demo 球隊，登入者就能看)
-- 我們使用全新的政策名稱，避免衝突

-- Teams 選取
DROP POLICY IF EXISTS "teams_anonymous_read" ON sport.teams;
CREATE POLICY "teams_anonymous_read" ON sport.teams
FOR SELECT TO authenticated
USING (is_demo = TRUE);

-- Players 選取
DROP POLICY IF EXISTS "players_anonymous_read" ON sport.players;
CREATE POLICY "players_anonymous_read" ON sport.players
FOR SELECT TO authenticated
USING (
    team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
);

-- Daily Records 選取
DROP POLICY IF EXISTS "records_anonymous_read" ON sport.daily_records;
CREATE POLICY "records_anonymous_read" ON sport.daily_records
FOR SELECT TO authenticated
USING (
    player_id IN (
        SELECT id FROM sport.players 
        WHERE team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    )
);

-- Coaches 選取 (讓儀表板能顯示教練姓名)
DROP POLICY IF EXISTS "coaches_anonymous_read" ON sport.coaches;
CREATE POLICY "coaches_anonymous_read" ON sport.coaches
FOR SELECT TO authenticated
USING (
    id IN (SELECT coach_id FROM sport.teams WHERE is_demo = TRUE)
);

-- Pain Reports 選取
DROP POLICY IF EXISTS "pain_anonymous_read" ON sport.pain_reports;
CREATE POLICY "pain_anonymous_read" ON sport.pain_reports
FOR SELECT TO authenticated
USING (
    player_id IN (
        SELECT id FROM sport.players 
        WHERE team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
    )
);

-- Notifications 選取
DROP POLICY IF EXISTS "notifications_anonymous_read" ON sport.notifications;
CREATE POLICY "notifications_anonymous_read" ON sport.notifications
FOR SELECT TO authenticated
USING (
    team_id IN (SELECT id FROM sport.teams WHERE is_demo = TRUE)
);

COMMIT;
