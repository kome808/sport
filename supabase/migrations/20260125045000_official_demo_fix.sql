-- ================================================
-- 正式演示帳號修復 (Official Demo Account Fix)
-- 日期: 2026-01-25
-- 說明：
-- 1. 清理所有舊的 demo@sportrepo.com 資料
-- 2. 正式建立/修復 sportrepotw@gmail.com
-- 3. 綁定大雄隊
-- ================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_demo_email TEXT := 'sportrepotw@gmail.com';
    v_demo_pwd   TEXT := 'sportrepotw';
    v_demo_id    UUID;
    v_instance_id UUID;
    v_old_email  TEXT := 'demo@sportrepo.com';
BEGIN
    -- 0. 清理舊測試資料
    DELETE FROM auth.identities WHERE email = v_old_email;
    DELETE FROM auth.users WHERE email = v_old_email;
    DELETE FROM sport.coaches WHERE email = v_old_email;

    -- 1. 取得 Instance ID
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 2. 處理 sportrepotw@gmail.com
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_demo_email) THEN
        UPDATE auth.users 
        SET encrypted_password = crypt(v_demo_pwd, gen_salt('bf')),
            email_confirmed_at = now(),
            updated_at = now(),
            raw_user_meta_data = '{"name": "DEMO"}'
        WHERE email = v_demo_email;
        
        SELECT id INTO v_demo_id FROM auth.users WHERE email = v_demo_email;
    ELSE
        v_demo_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_instance_id, v_demo_id, 'authenticated', 'authenticated', v_demo_email, crypt(v_demo_pwd, gen_salt('bf')),
            now(), '{"provider": "email", "providers": ["email"]}', '{"name": "DEMO"}', now(), now()
        );
    END IF;

    -- 3. 強制修復 Identity
    DELETE FROM auth.identities WHERE user_id = v_demo_id;
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_demo_id, v_demo_id, format('{"sub": "%s", "email": "%s"}', v_demo_id, v_demo_email)::jsonb,
        'email', v_demo_id::text, now(), now(), now()
    );

    -- 4. 關聯教練與球隊
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_demo_id, v_demo_email, 'DEMO', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DEMO')
    ON CONFLICT (id) DO UPDATE SET name = 'DEMO', email = v_demo_email;

    UPDATE sport.teams SET coach_id = v_demo_id WHERE slug = 'doraemon-baseball';
    
    INSERT INTO sport.teams (name, slug, coach_id, sport_type)
    SELECT '大雄棒球隊 (Demo)', 'doraemon-baseball', v_demo_id, 'baseball'
    WHERE NOT EXISTS (SELECT 1 FROM sport.teams WHERE slug = 'doraemon-baseball');

    RAISE NOTICE 'Official Demo account set to sportrepotw@gmail.com';
END $$;

COMMIT;
