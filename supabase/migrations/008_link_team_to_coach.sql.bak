-- ================================================
-- 快速修復：將測試球隊關聯到已註冊帳號
-- 執行方式：在 Supabase SQL Editor 中執行此腳本
-- ================================================

DO $$
DECLARE
  v_coach_id UUID;
  v_team_id UUID;
BEGIN
  -- 1. 取得教練 ID (使用您註冊的 Email)
  SELECT id INTO v_coach_id FROM sport.coaches WHERE email = 'komepanfu@gmail.com';
  
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION '找不到 komepanfu@gmail.com 的教練資料，請先完成註冊。';
  END IF;
  
  RAISE NOTICE '找到教練 ID: %', v_coach_id;

  -- 2. 檢查是否已有球隊
  SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'doraemon-baseball';
  
  IF v_team_id IS NULL THEN
    -- 建立新球隊
    INSERT INTO sport.teams (coach_id, name, slug, sport_type)
    VALUES (v_coach_id, '大雄棒球隊', 'doraemon-baseball', 'baseball')
    RETURNING id INTO v_team_id;
    RAISE NOTICE '已建立新球隊，ID: %', v_team_id;
  ELSE
    -- 更新球隊擁有者
    UPDATE sport.teams SET coach_id = v_coach_id WHERE id = v_team_id;
    RAISE NOTICE '已更新球隊擁有者，Team ID: %', v_team_id;
  END IF;

  -- 3. 確保有 team_members 關聯 (owner 角色)
  INSERT INTO sport.team_members (team_id, coach_id, role)
  VALUES (v_team_id, v_coach_id, 'owner')
  ON CONFLICT (team_id, coach_id) DO UPDATE SET role = 'owner';
  
  RAISE NOTICE '✅ 完成！球隊 "大雄棒球隊" 已關聯到您的帳號。';
  RAISE NOTICE '請重新登入後前往: /doraemon-baseball';
END $$;
