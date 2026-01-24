-- ================================================
-- 038 生產環境安全性收網
-- 撤銷所有臨時的寬鬆 RLS 政策，恢復嚴格權限檢查
-- ================================================

-- 1. 撤銷 coaches 表格的寬鬆政策
DROP POLICY IF EXISTS "coaches_select_all_authenticated" ON sport.coaches;
DROP POLICY IF EXISTS "coaches_insert_authenticated" ON sport.coaches;

-- 2. 撤銷 teams 相關的寬鬆政策
DROP POLICY IF EXISTS "teams_select_authenticated" ON sport.teams;
DROP POLICY IF EXISTS "teams_select_slug_all" ON sport.teams;

-- 重新定義安全的 slug 檢查政策 (僅允許已驗證帳號進行存在性檢查)
CREATE POLICY "teams_slug_check_policy" ON sport.teams
FOR SELECT TO authenticated
USING (true); -- 注意：雖然是 true，但前端應配合 select('id')，且配合 RLS 限制其他欄位
-- 修正：為了絕對安全，我們恢復到只有成員能 select 的政策，
-- 代碼重複檢查將改由後端建立時的 error 捕捉，這才是最安全的做法。
DROP POLICY IF EXISTS "teams_slug_check_policy" ON sport.teams;

-- 3. 恢復所有表格的嚴格 RLS 政策 (確保只有所屬成員能看)
-- 這裡我們確保 002 和 005 的正確政策生效

-- 移除 009 產生的所有寬鬆政策
DROP POLICY IF EXISTS "team_members_select_authenticated" ON sport.team_members;
DROP POLICY IF EXISTS "players_select_authenticated" ON sport.players;
DROP POLICY IF EXISTS "daily_records_select_authenticated" ON sport.daily_records;
DROP POLICY IF EXISTS "pain_reports_select_authenticated" ON sport.pain_reports;
DROP POLICY IF EXISTS "notifications_select_authenticated" ON sport.notifications;

-- 4. 針對球隊建立邏輯，保持最精簡的必要存取
DROP POLICY IF EXISTS "teams_insert_authenticated" ON sport.teams;
CREATE POLICY "teams_insert_authenticated" ON sport.teams
FOR INSERT TO authenticated
WITH CHECK (coach_id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '✅ 038: 生產環境安全性設定已恢復。';
  RAISE NOTICE '🔐 所有寬鬆政策已移除，現在僅限授權成員存取其資料。';
END $$;
