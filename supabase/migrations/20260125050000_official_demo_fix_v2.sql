-- ================================================
-- 正式演示帳號修補 V2 (Official Demo Fix V2 - Anti-500 Error)
-- 日期: 2026-01-25
-- 說明：
-- 1. 移除先前測試用的 Trigger (避免導致 500 錯誤)
-- 2. 暴力清除所有相關 ID 資料
-- 3. 以最標準方式建立 sportrepotw@gmail.com
-- ================================================

BEGIN;

-- 1. 移除可能干擾系統的 Trigger 與 Function
DROP TRIGGER IF EXISTS tr_before_demo_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_after_demo_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_demo_user();
DROP FUNCTION IF EXISTS public.link_demo_team_after_signup();

-- 2. 清理所有舊測試資料 (包括不同 ID 的同信箱帳號)
DO $$
DECLARE
    v_target_email TEXT := 'sportrepotw@gmail.com';
    v_old_email    TEXT := 'demo@sportrepo.com';
    v_target_id    UUID;
BEGIN
    -- 解除大雄隊綁定，避免 FK 錯誤
    UPDATE sport.teams SET coach_id = NULL WHERE slug = 'doraemon-baseball';

    -- 刪除舊帳號
    DELETE FROM auth.identities WHERE email = v_old_email OR email = v_target_email;
    DELETE FROM auth.users WHERE email = v_old_email OR email = v_target_email;
    DELETE FROM sport.coaches WHERE email = v_old_email OR email = v_target_email;

    RAISE NOTICE 'Cleanup complete.';
END $$;

-- 3. 重新建立標準帳號
DO $$
DECLARE
    v_email      TEXT := 'sportrepotw@gmail.com';
    v_pwd        TEXT := 'sportrepotw';
    v_user_id    UUID := gen_random_uuid();
    v_instance_id UUID;
BEGIN
    -- 取得正確的 Instance ID (通常是第一個使用者的)
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 建立 Auth User
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        last_sign_in_at, confirmation_token, is_super_admin
    ) VALUES (
        v_instance_id, v_user_id, 'authenticated', 'authenticated', v_email, crypt(v_pwd, gen_salt('bf')),
        now(), '{"provider": "email", "providers": ["email"]}', '{"name": "DEMO"}', now(), now(),
        now(), '', false
    );

    -- 建立 Identity (Supabase 標準：id 通常是隨機 UUID，但 user_id 指向使用者)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), -- Identity 自己的 ID 應該隨機
        v_user_id, 
        format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
        'email', 
        v_email, -- 對於 email provider, provider_id 通常是 email
        now(), now(), now()
    );

    -- 建立 Coach
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_user_id, v_email, 'DEMO', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DEMO');

    -- 綁定球隊
    UPDATE sport.teams SET coach_id = v_user_id WHERE slug = 'doraemon-baseball';
    
    -- 如果球隊不存在再建立
    IF NOT EXISTS (SELECT 1 FROM sport.teams WHERE slug = 'doraemon-baseball') THEN
        INSERT INTO sport.teams (name, slug, coach_id, sport_type)
        VALUES ('大雄棒球隊 (Demo)', 'doraemon-baseball', v_user_id, 'baseball');
    END IF;

    RAISE NOTICE 'Final Fix V2 Success: User Created and Linked.';
END $$;

COMMIT;
