-- ================================================
-- 基層運動訓練系統 - RLS 終極修正
-- 使用 SECURITY DEFINER 函數徹底解決 RLS 遞迴問題
-- 日期: 2026-01-11
-- ================================================

-- 1. 建立一個 Security Definer 函數來取得 "我的球隊 IDs"
-- 這個函數會以系統權限執行，因此會繞過 team_members 的 RLS，避免無窮迴圈
CREATE OR REPLACE FUNCTION sport.get_my_team_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT tm.team_id 
  FROM sport.team_members tm
  JOIN sport.coaches c ON tm.coach_id = c.id
  WHERE c.email = auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 重新定義 team_members 的 RLS
DROP POLICY IF EXISTS "team_members_select" ON sport.team_members;

CREATE POLICY "team_members_select" ON sport.team_members
FOR SELECT TO authenticated
USING (
  -- 情況 A: 我是這個成員 (coach_id 就是我)
  coach_id = sport.get_current_coach_id()
  OR
  -- 情況 B: 這是我的球隊的成員 (使用 bypass RLS 的函數查詢)
  team_id IN ( SELECT sport.get_my_team_ids() )
);

-- 3. 順便修正其他可能受影響的表 (Teams)
-- Teams 之前的寫法也可能有淺層遞迴，建議一併優化
DROP POLICY IF EXISTS "teams_select_member" ON sport.teams;

CREATE POLICY "teams_select_member" ON sport.teams
FOR SELECT TO authenticated
USING (
  id IN ( SELECT sport.get_my_team_ids() )
);

-- 4. 修正 Players
DROP POLICY IF EXISTS "players_select_team" ON sport.players;

CREATE POLICY "players_select_team" ON sport.players
FOR SELECT TO authenticated
USING (
  team_id IN ( SELECT sport.get_my_team_ids() )
);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS 政策已全面更新，使用 SECURITY DEFINER 解決遞迴死鎖問題。';
END $$;
