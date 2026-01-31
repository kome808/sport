-- fix_demo_permissions.sql
-- 確保 anon 角色可以執行判斷 demo 球隊的函式
GRANT EXECUTE ON FUNCTION sport.fn_is_demo_team(uuid) TO anon;
GRANT EXECUTE ON FUNCTION sport.fn_is_demo_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION sport.fn_is_demo_team(uuid) TO service_role;

-- 此外，確保 players 表本身對 anon 可讀 (雖然已有 Policy，但再確認一次)
GRANT SELECT ON TABLE sport.players TO anon;
GRANT SELECT ON TABLE sport.daily_records TO anon;
GRANT SELECT ON TABLE sport.teams TO anon;

RAISE NOTICE '✅ Demo 模式權限已修復';
