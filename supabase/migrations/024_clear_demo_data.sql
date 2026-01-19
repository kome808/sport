-- ================================================
-- 測試數據清除函數
-- 日期: 2026-01-19
-- 描述: 清除指定球隊的所有球員每日紀錄與疼痛回報 (演示用途)
-- ================================================

CREATE OR REPLACE FUNCTION sport.clear_demo_data(p_team_slug TEXT)
RETURNS void AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- 1. 取得球隊 ID
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = p_team_slug;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION '找不到球隊 slug: %', p_team_slug;
  END IF;

  -- 2. 刪除該球隊所有球員的相關數據
  -- 刪除每日紀錄
  DELETE FROM sport.daily_records 
  WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
  
  -- 刪除疼痛回報
  DELETE FROM sport.pain_reports 
  WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
  
  -- 刪除通知
  DELETE FROM sport.notifications 
  WHERE team_id = v_team_id;

  RAISE NOTICE '已清空球隊 % 的所有測試數據', p_team_slug;
END $$ LANGUAGE plpgsql;

-- 賦予執行權限
GRANT EXECUTE ON FUNCTION sport.clear_demo_data TO authenticated, service_role;
