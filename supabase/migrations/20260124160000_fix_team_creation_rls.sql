-- ================================================
-- 036 修復球隊建立權限 (RLS)
-- 改用 auth.uid() 直接驗證，避免因 coaches 資料同步延遲導致建立失敗
-- ================================================

-- 1. 修正 Teams 新增政策
DROP POLICY IF EXISTS "teams_insert_coach" ON sport.teams;
CREATE POLICY "teams_insert_authenticated" ON sport.teams
FOR INSERT TO authenticated
WITH CHECK (coach_id = auth.uid());

-- 2. 修正 Team Members 新增政策 (初始建立球隊時需要)
DROP POLICY IF EXISTS "team_members_insert_owner" ON sport.team_members;
CREATE POLICY "team_members_insert_initial" ON sport.team_members
FOR INSERT TO authenticated
WITH CHECK (coach_id = auth.uid());

-- 3. 確保 coaches 表也允許對應 ID 的插入
DROP POLICY IF EXISTS "coaches_insert_authenticated" ON sport.coaches;
CREATE POLICY "coaches_insert_self" ON sport.coaches
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '✅ 036: 球隊與教練 RLS 權限已修正為優先使用 auth.uid()。';
END $$;
