-- ================================================
-- 重設教練密碼
-- 目標: komepanfu@gmail.com
-- 新密碼: kometrf99
-- ================================================

-- 啟用 pgcrypto 擴充功能 (如果尚未啟用)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  -- 更新 auth.users 表中的密碼
  -- 使用 bf (Blowfish) 演算法加密，這是 Supabase Auth 預設使用的
  UPDATE auth.users
  SET encrypted_password = crypt('kometrf99', gen_salt('bf')),
      updated_at = NOW()
  WHERE email = 'komepanfu@gmail.com';
  
  IF FOUND THEN
    RAISE NOTICE '✅ 密碼已成功更新為 kometrf99 (Email: komepanfu@gmail.com)';
  ELSE
    RAISE WARNING '⚠️ 找不到 Email 為 komepanfu@gmail.com 的使用者，請確認該使用者是否已註冊。';
  END IF;
END $$;
