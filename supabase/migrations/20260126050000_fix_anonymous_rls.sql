-- ================================================
-- 強化 RLS 策略 (Robust RLS for Anonymous)
-- 日期: 2026-01-26
-- 說明：改用 SECURITY DEFINER 函數來判斷 Demo 權限，避免 RLS 遞迴查詢問題。
-- ================================================

BEGIN;

-- 1. 建立 Helper Function (Security Definer)
-- 這讓權限判定可以繞過 RLS 直接查詢 teams 表
CREATE OR REPLACE FUNCTION sport.fn_is_demo_team(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, sport
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM sport.teams 
        WHERE id = p_team_id 
        AND is_demo = TRUE
    );
END;
$$;

-- 2. 重建 Players 的 RLS Policy
DROP POLICY IF EXISTS "players_select_anonymous_demo" ON sport.players;

CREATE POLICY "players_select_anonymous_demo" ON sport.players
FOR SELECT TO authenticated
USING (
    -- 判斷1: 是 Demo 球隊 (透過 Admin 權限函數檢查)
    sport.fn_is_demo_team(team_id)
    -- 判斷2: 是匿名使用者
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- 3. 重建 Daily Records 的 RLS Policy
DROP POLICY IF EXISTS "daily_records_select_anonymous_demo" ON sport.daily_records;

CREATE POLICY "daily_records_select_anonymous_demo" ON sport.daily_records
FOR SELECT TO authenticated
USING (
    -- 檢查該紀錄的球員是否屬於 Demo 球隊
    EXISTS (
        SELECT 1 FROM sport.players p
        WHERE p.id = daily_records.player_id
        AND sport.fn_is_demo_team(p.team_id)
    )
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- 4. 重建 Pain Reports 的 RLS Policy
DROP POLICY IF EXISTS "pain_reports_select_anonymous_demo" ON sport.pain_reports;

CREATE POLICY "pain_reports_select_anonymous_demo" ON sport.pain_reports
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM sport.players p
        WHERE p.id = pain_reports.player_id
        AND sport.fn_is_demo_team(p.team_id)
    )
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- 5. 重建 Notifications 的 RLS Policy
DROP POLICY IF EXISTS "notifications_select_anonymous_demo" ON sport.notifications;

CREATE POLICY "notifications_select_anonymous_demo" ON sport.notifications
FOR SELECT TO authenticated
USING (
    sport.fn_is_demo_team(team_id)
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

-- 6. Team Members 也更新一下
DROP POLICY IF EXISTS "team_members_select_anonymous_demo" ON sport.team_members;

CREATE POLICY "team_members_select_anonymous_demo" ON sport.team_members
FOR SELECT TO authenticated
USING (
    sport.fn_is_demo_team(team_id)
    AND (auth.jwt()->>'is_anonymous')::boolean IS TRUE
);

COMMIT;
