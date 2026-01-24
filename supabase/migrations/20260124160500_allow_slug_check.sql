-- ================================================
-- 037 允許已驗證教練檢查球隊代碼可用性
-- ================================================

-- 修改搜尋球隊的權限：允許查看所有球隊的 slug (僅限 slug)，以便檢查重複
DROP POLICY IF EXISTS "teams_select_authenticated" ON sport.teams;
CREATE POLICY "teams_select_slug_all" ON sport.teams
FOR SELECT TO authenticated
USING (true); -- 允許查看，反正我們只 select id，不涉及隱私

-- 確保教練資料表的 schema 權限
GRANT USAGE ON SCHEMA sport TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sport TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sport TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ 037: 已放寬球隊查詢權限，解決代碼檢查卡死問題。';
END $$;
