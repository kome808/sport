-- ================================================
-- 開放 Demo 球隊與球員的公開讀取權限
-- 日期: 2026-01-26
-- 說明：讓未登入的使用者 (anon) 也能讀取 Demo 球隊與球員的基本資料，
-- 以便在登入頁面 (PlayerLoginPage) 顯示球隊名稱與球員姓名。
-- ================================================

BEGIN;

-- 1. 允許 anon 讀取 Demo 球員資料
-- 這樣 usePlayer('3ss') 在未登入時才能查到資料
DROP POLICY IF EXISTS "players_select_public_demo" ON sport.players;

CREATE POLICY "players_select_public_demo" ON sport.players
FOR SELECT TO anon
USING (
    sport.fn_is_demo_team(team_id)
);

-- 2. 允許 anon 讀取 Demo 球隊資料
-- 這樣 useTeam('shohoku-basketball') 在未登入時才能查到資料
DROP POLICY IF EXISTS "teams_select_public_demo" ON sport.teams;

CREATE POLICY "teams_select_public_demo" ON sport.teams
FOR SELECT TO anon
USING (
    is_demo = TRUE
);

COMMIT;
