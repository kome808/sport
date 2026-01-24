-- ================================================
-- 演示帳號修復 V6 (Fix Demo Account - Force Update)
-- 日期: 2026-01-25
-- 說明：不刪除帳號，而是強制更新密碼與修復 Identity
-- ================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_demo_email TEXT := 'demo@sportrepo.com';
    v_demo_pwd   TEXT := 'demo@sportrepo.com';
    v_demo_id    UUID;
    v_instance_id UUID;
BEGIN
    -- 1. 取得 Instance ID
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 2. 確保或更新 Auth User
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_demo_email) THEN
        -- 更新現有使用者
        UPDATE auth.users 
        SET encrypted_password = crypt(v_demo_pwd, gen_salt('bf')),
            email_confirmed_at = now(),
            updated_at = now(),
            raw_user_meta_data = '{"name": "Demo Coach"}'
        WHERE email = v_demo_email;
        
        SELECT id INTO v_demo_id FROM auth.users WHERE email = v_demo_email;
        RAISE NOTICE '已更新使用者 % (ID: %)', v_demo_email, v_demo_id;
    ELSE
        -- 建立新使用者
        v_demo_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_instance_id,
            v_demo_id,
            'authenticated',
            'authenticated',
            v_demo_email,
            crypt(v_demo_pwd, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Demo Coach"}',
            now(),
            now()
        );
        RAISE NOTICE '已建立使用者 % (ID: %)', v_demo_email, v_demo_id;
    END IF;

    -- 3. 確保 Auth Identity (強制修復)
    -- 先刪除該使用者的舊 identity 以免 id 衝突 (如果之前是用不同 ID 建立的)
    DELETE FROM auth.identities WHERE user_id = v_demo_id;
    
    -- 重新插入正確的 identity
    -- 注意：不寫入 email (generated column)，補上 provider_id
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_demo_id, 
        v_demo_id,
        format('{"sub": "%s", "email": "%s"}', v_demo_id, v_demo_email)::jsonb,
        'email',
        v_demo_id::text,
        now(),
        now(),
        now()
    );

    -- 4. 確保 Public Coaches 與 Team
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_demo_id, v_demo_email, 'Demo 教練', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCoach')
    ON CONFLICT (id) DO UPDATE SET name = 'Demo 教練', email = v_demo_email;

    UPDATE sport.teams SET coach_id = v_demo_id WHERE slug = 'doraemon-baseball';
    
    -- 如果球隊不存在，建立它
    INSERT INTO sport.teams (name, slug, coach_id, sport_type)
    SELECT '大雄棒球隊 (Demo)', 'doraemon-baseball', v_demo_id, 'baseball'
    WHERE NOT EXISTS (SELECT 1 FROM sport.teams WHERE slug = 'doraemon-baseball');

    RAISE NOTICE 'Demo account V6 fix complete.';

END $$;

COMMIT;
