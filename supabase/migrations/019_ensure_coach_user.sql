-- ================================================
-- 確保教練 Auth 帳號存在
-- 目標: komepanfu@gmail.com
-- 密碼: kometrf99
-- 原因: 解決登入 400 錯誤 (無 Auth 使用者)
-- ================================================

-- 啟用必要擴充
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_email VARCHAR := 'komepanfu@gmail.com';
  v_password VARCHAR := 'kometrf99';
BEGIN
  -- 1. 檢查 Auth User 是否存在
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- A. 不存在 -> 建立新使用者
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- Default instance_id
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(), -- email_confirmed_at (重要：設為已驗證)
      NULL,
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ 已建立新的 Auth 使用者: % (ID: %)', v_email, v_user_id;
  ELSE
    -- B. 已存在 -> 重設密碼與確認狀態
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()), -- 確保已驗證
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ 已重設 Auth 使用者密碼: % (ID: %)', v_email, v_user_id;
  END IF;

  -- 2. 確認 sport.coaches 是否已建立 (應已由 seed 建立，但再次確認)
  -- 這裡不需要做什麼，因為 seed 已經處理了。
  -- 只要 email 對應，RLS 就會生效。
  
END $$;
