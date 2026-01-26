-- ================================================
-- 驗證 RLS 權限修復
-- ================================================

-- 1. 模擬 anon 角色
SET ROLE anon;

-- 2. 測試讀取球隊 (非 Demo 球隊)
-- 應該要能看到 manto1
SELECT id, name, slug FROM sport.teams WHERE slug = 'manto1';

-- 3. 測試讀取球員 (非 Demo 球員)
-- 應該要能看到 pud
SELECT id, name, short_code FROM sport.players WHERE short_code = 'pud';

-- 4. 測試讀取敏感欄位 (應受到限制或 RPC 層級保護)
-- 這裡我們在 Hook 層級已經手動過濾欄位，資料庫端若要更嚴格可以加 Column 權限
SELECT password_hash FROM sport.players WHERE short_code = 'pud';

-- 重設角色
RESET ROLE;
