-- ================================================
-- 修復展示模式權限
-- ================================================

-- 確保所有人都能執行取得球隊的 RPC
GRANT EXECUTE ON FUNCTION public.get_my_teams() TO anon, authenticated;

-- 再次確認湘北籃球隊是 Demo 球隊
UPDATE sport.teams SET is_demo = TRUE WHERE slug = 'shohoku-basketball';

-- 修復 sport.fn_is_demo_team 函數權限
GRANT EXECUTE ON FUNCTION sport.fn_is_demo_team(UUID) TO anon, authenticated;
