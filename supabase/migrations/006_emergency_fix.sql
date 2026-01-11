-- ================================================
-- 基層運動訓練系統 - 緊急 RLS 修正 (006)
-- 暫時移除遞迴查詢，僅允許查看自己的成員資格
-- 用於解決登入死鎖問題
-- 日期: 2026-01-11
-- ================================================

-- 1. 移除舊政策
DROP POLICY IF EXISTS "team_members_select" ON sport.team_members;

-- 2. 建立最簡化政策 (無遞迴)
-- 僅允許教練查看"自己"的成員資料
-- 這足以讓登入流程運作 (取得自己的 Team ID)
CREATE POLICY "team_members_select" ON sport.team_members
FOR SELECT TO authenticated
USING (
  coach_id = sport.get_current_coach_id()
);

-- 3. 確保函數擁有者正確 (避免 Security Definer 失效)
ALTER FUNCTION sport.get_current_coach_id() OWNER TO postgres;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS 已降級為基礎模式 (僅允許查看自身資料)，應可解決登入死鎖。';
END $$;
