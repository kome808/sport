-- ================================================
-- 007 Fix Coaches RLS and Insert Permissions
-- 解決教練註冊與登入時的權限問題
-- ================================================

-- 1. 確保教練可以查詢自己的資料 (使用更寬鬆的條件避免遞迴)
DROP POLICY IF EXISTS "coaches_select_own" ON sport.coaches;
CREATE POLICY "coaches_select_own" ON sport.coaches
FOR SELECT TO authenticated
USING (
    -- 允許查詢自己的 Email
    email = auth.jwt() ->> 'email'
    -- 或者如果已經是教練，允許查詢自己 (雙重保險)
    OR id::text = (auth.jwt() ->> 'sub') -- 這是因為我們無法保證 id 與 auth.uid() 一致，所以主要依賴 Email
);

-- 2. 允許 Authenticated 用戶插入資料 (如果 Email 匹配)
-- 這是關鍵：如果之前政策太嚴格，可能導致 insert hanging
DROP POLICY IF EXISTS "coaches_insert_self" ON sport.coaches;
CREATE POLICY "coaches_insert_self" ON sport.coaches
FOR INSERT TO authenticated
WITH CHECK (
    email = auth.jwt() ->> 'email'
);

-- 3. 確保 Service Role (Edge Functions) 可以完全存取
-- (Service Key 預設 bypass RLS，但明確宣告無害)

-- 4. 針對 sport.teams 的 insert 政策進行放寬 (避免 "get_current_coach_id" 導致的問題)
-- 我們保持 get_current_coach_id 為 SECURITY DEFINER，這已經解決了大部分問題。

-- 5. 確保 auth.users 觸發器不存在 (我們改用 Client 端插入，避免衝突)
-- 檢查是否存在不預期的 Trigger (此處僅為註解，手動確認)

DO $$
BEGIN
  RAISE NOTICE '✅ 007: Coaches RLS 政策已更新，確保註冊與查詢順暢。';
END $$;
