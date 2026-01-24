-- ================================================
-- 終極演示帳號修復 (Fix Demo Account - Lifecycle Hooks)
-- 日期: 2026-01-25
-- 說明：
-- 1. 解除球隊綁定並清除舊資料 (解決 400 Bad Request)
-- 2. 建立 Trigger 自動驗證 Email (免去收信困擾)
-- 3. 建立 Trigger 自動綁定球隊 (確保登入後有看到球隊)
-- ================================================

BEGIN;

-- 1. 清理舊資料 (依賴順序：Team -> Coach -> Identity -> User)
UPDATE sport.teams SET coach_id = NULL WHERE slug = 'doraemon-baseball';
DELETE FROM sport.coaches WHERE email = 'demo@sportrepo.com';
DELETE FROM auth.identities WHERE email LIKE 'demo@sportrepo.com%';
DELETE FROM auth.users WHERE email = 'demo@sportrepo.com';


-- 2. 建立 BEFORE INSERT Trigger (自動驗證 Email)
CREATE OR REPLACE FUNCTION public.auto_confirm_demo_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'demo@sportrepo.com' THEN
    NEW.email_confirmed_at := now(); -- 強制設定為已驗證
    NEW.raw_user_meta_data := jsonb_build_object('name', 'Demo Coach'); -- 強制設定名稱
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_before_demo_user_created ON auth.users;
CREATE TRIGGER tr_before_demo_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_demo_user();


-- 3. 建立 AFTER INSERT Trigger (自動綁定球隊)
CREATE OR REPLACE FUNCTION public.link_demo_team_after_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'demo@sportrepo.com' THEN
    -- 需要等待 sport.coaches 被 handle_new_user 建立嗎？
    -- handle_new_user 通常也是 AFTER INSERT。
    -- 這裡我們單純更新 Team。如果 Coach 還沒建立，update 可能會因為 FK 失敗嗎？
    -- 通常 FK 檢查是在 Transaction commit 時？或是語句執行時？
    -- 為了保險，我們這裡也嘗試建立 Coach (如果 handle_new_user 慢了)
    
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (NEW.id, NEW.email, 'Demo 教練', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCoach')
    ON CONFLICT (id) DO NOTHING;
    
    -- 更新球隊
    UPDATE sport.teams 
    SET coach_id = NEW.id 
    WHERE slug = 'doraemon-baseball';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_after_demo_user_created ON auth.users;
CREATE TRIGGER tr_after_demo_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_demo_team_after_signup();

COMMIT;
