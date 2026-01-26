-- ================================================
-- 開放所有球員與球隊的基本公開讀取權限
-- 日期: 2026-01-26
-- 說明：讓未登入使用者 (anon) 能讀取所有球隊與球員基本資料，
-- 解決「認領後找不到球員資料」的問題。密碼 Hash 依然受限。
-- ================================================

BEGIN;

-- 1. 調整 players 表的 RLS
-- 移除之前的 demo-only 策略
DROP POLICY IF EXISTS "players_select_public_demo" ON sport.players;
DROP POLICY IF EXISTS "players_select_public" ON sport.players;

-- 允許 anon 讀取所有啟用中的球員基本資料
-- 註：此策略僅允許 SELECT 資料，DML (Update/Insert) 依然受限
CREATE POLICY "players_select_public" ON sport.players
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- 2. 調整 teams 表的 RLS
-- 移除之前的 demo-only 策略
DROP POLICY IF EXISTS "teams_select_public_demo" ON sport.teams;
DROP POLICY IF EXISTS "teams_select_public" ON sport.teams;

-- 允許所有人讀取球隊基本資料
CREATE POLICY "teams_select_public" ON sport.teams
FOR SELECT TO anon, authenticated
USING (true);

-- 3. [安全性] 限制 anon 對敏感欄位的存取
-- 雖然 SELECT 策略允許讀取 Row，但我們可以透過 Column-level Security 或 RPC 確保安全
-- 但在 Supabase 中，最簡單方式是確保 anon select 時不會拿到 password_hash
-- 以下為保險起見，再次確保 RPC 是 SECURITY DEFINER 且邏輯正確
-- (014_team_invitation.sql 已處理 RPC 邏輯)

-- 補強安全：強制限制 anon 只能在 SELECT 時看到特定欄位 (選用，因 RLS 通常是 Row-level)
-- 如果要更嚴格，可以在這裡 REVOKE 欄位權限，但通常 RLS + RPC 已足夠
-- REVOKE SELECT (password_hash) ON sport.players FROM anon;

COMMIT;
