-- ================================================
-- 009 寬鬆 RLS 政策 - 臨時修復
-- 允許所有已驗證用戶存取基本資料
-- ================================================

-- 1. 修復 coaches 表格政策
DROP POLICY IF EXISTS "coaches_select_own" ON sport.coaches;
CREATE POLICY "coaches_select_all_authenticated" ON sport.coaches
FOR SELECT TO authenticated
USING (true);  -- 暫時允許所有已驗證用戶查看

DROP POLICY IF EXISTS "coaches_insert_self" ON sport.coaches;
CREATE POLICY "coaches_insert_authenticated" ON sport.coaches
FOR INSERT TO authenticated
WITH CHECK (true);  -- 暫時允許所有已驗證用戶新增

-- 2. 修復 teams 表格政策  
DROP POLICY IF EXISTS "teams_select_member" ON sport.teams;
CREATE POLICY "teams_select_authenticated" ON sport.teams
FOR SELECT TO authenticated
USING (true);

-- 3. 修復 team_members 表格政策
DROP POLICY IF EXISTS "team_members_select" ON sport.team_members;
CREATE POLICY "team_members_select_authenticated" ON sport.team_members
FOR SELECT TO authenticated
USING (true);

-- 4. 修復 players 表格政策
DROP POLICY IF EXISTS "players_select_team" ON sport.players;
CREATE POLICY "players_select_authenticated" ON sport.players
FOR SELECT TO authenticated
USING (true);

-- 5. 修復 daily_records 表格政策
DROP POLICY IF EXISTS "daily_records_select" ON sport.daily_records;
CREATE POLICY "daily_records_select_authenticated" ON sport.daily_records
FOR SELECT TO authenticated
USING (true);

-- 6. 修復 pain_reports 表格政策
DROP POLICY IF EXISTS "pain_reports_select" ON sport.pain_reports;
CREATE POLICY "pain_reports_select_authenticated" ON sport.pain_reports
FOR SELECT TO authenticated
USING (true);

-- 7. 修復 notifications 表格政策
DROP POLICY IF EXISTS "notifications_select" ON sport.notifications;
CREATE POLICY "notifications_select_authenticated" ON sport.notifications
FOR SELECT TO authenticated
USING (true);

DO $$
BEGIN
  RAISE NOTICE '✅ 009: 寬鬆 RLS 政策已套用，所有已驗證用戶可存取基本資料。';
  RAISE NOTICE '⚠️ 注意：這是臨時修復，正式環境應使用更嚴格的政策。';
END $$;
