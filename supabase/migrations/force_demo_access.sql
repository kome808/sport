-- force_demo_access.sql
-- 1. 刪除可能卡住的舊 Policy (如果名稱相同)
DROP POLICY IF EXISTS "players_demo_read_only_for_anon" ON sport.players;
DROP POLICY IF EXISTS "daily_records_demo_read_only_for_anon" ON sport.daily_records;

-- 2. 建立更直接、更寬鬆的 Policy
-- 允許 anon 讀取任何 Demo 球隊的球員
CREATE POLICY "players_demo_read_only_for_anon" ON sport.players
FOR SELECT TO anon
USING (
    EXISTS (
        SELECT 1 FROM sport.teams 
        WHERE teams.id = players.team_id 
        AND teams.slug = 'shohoku-basketball'  -- 直接指定 slug，最穩
    )
    OR
    EXISTS (
        SELECT 1 FROM sport.teams
        WHERE teams.id = players.team_id
        AND teams.is_demo = true
    )
);

-- 允許 anon 讀取這些球員的數據
CREATE POLICY "daily_records_demo_read_only_for_anon" ON sport.daily_records
FOR SELECT TO anon
USING (
    EXISTS (
        SELECT 1 FROM sport.players
        JOIN sport.teams ON teams.id = players.team_id
        WHERE players.id = daily_records.player_id
        AND (teams.slug = 'shohoku-basketball' OR teams.is_demo = true)
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ 強制 Demo 存取規則已套用 (針對 shohoku-basketball)';
END $$;
