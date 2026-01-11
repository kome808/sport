-- ================================================
-- 基層運動訓練系統 - RLS 修正
-- 修正 team_members 讀取權限問題
-- 日期: 2026-01-11
-- ================================================

-- 修正: 允許教練直接讀取屬於自己的成員資料，解決遞迴查詢導致的權限鎖死
DROP POLICY IF EXISTS "team_members_select" ON sport.team_members;

CREATE POLICY "team_members_select" ON sport.team_members
FOR SELECT TO authenticated
USING (
  -- 1. 可以看自己的資料 (Base case)
  coach_id = sport.get_current_coach_id()
  OR
  -- 2. 可以看同球隊其他人的資料 (Recursive case)
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ team_members RLS 政策已修正！';
END $$;
