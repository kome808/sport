-- ================================================
-- 修復演示帳號 V4 (Fix Demo Account - No Generated Email)
-- 日期: 2026-01-25
-- 說明：修正 auth.identities email 為 generated column 無法寫入的問題
-- ================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_demo_email TEXT := 'demo@sportrepo.com';
    v_demo_pwd   TEXT := 'demo@sportrepo.com';
    v_demo_id    UUID := '99999999-9999-9999-9999-999999999999';
    v_team_slug  TEXT := 'doraemon-baseball';
    v_team_id    UUID;
BEGIN
    -- 1. 建立或更新 Auth User
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_demo_id) THEN
        UPDATE auth.users 
        SET encrypted_password = crypt(v_demo_pwd, gen_salt('bf')),
            email_confirmed_at = now(),
            updated_at = now(),
            email = v_demo_email,
            raw_user_meta_data = '{"name": "Demo Coach"}'
        WHERE id = v_demo_id;
    ELSE
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
            is_super_admin,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_demo_id,
            'authenticated',
            'authenticated',
            v_demo_email,
            crypt(v_demo_pwd, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Demo Coach"}',
            false,
            now(),
            now()
        );
    END IF;

    -- 2. 建立 Identity
    -- 注意：不寫入 email 欄位 (因為是 generated column)
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_demo_id) THEN
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,   -- 補上 provider_id
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_demo_id, 
            v_demo_id,
            format('{"sub": "%s", "email": "%s"}', v_demo_id, v_demo_email)::jsonb,
            'email',
            v_demo_id::text, -- user_id 作為 provider_id
            now(),
            now(),
            now()
        );
        RAISE NOTICE '已建立 Identity for %', v_demo_email;
    ELSE
        -- 確保 Identity 資料正確
        UPDATE auth.identities
        SET provider_id = v_demo_id::text,
            identity_data = format('{"sub": "%s", "email": "%s"}', v_demo_id, v_demo_email)::jsonb,
            updated_at = now()
        WHERE user_id = v_demo_id;
        RAISE NOTICE '已更新 Identity for %', v_demo_email;
    END IF;

    -- 3. 確保 Public Coaches 資料
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_demo_id, v_demo_email, 'Demo 教練', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCoach')
    ON CONFLICT (id) DO UPDATE SET name = 'Demo 教練';

    -- 4. 綁定或建立球隊
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = v_team_slug;
    
    IF v_team_id IS NOT NULL THEN
        UPDATE sport.teams SET coach_id = v_demo_id WHERE id = v_team_id;
    ELSE
        INSERT INTO sport.teams (name, slug, coach_id, sport_type)
        VALUES ('大雄棒球隊 (Demo)', v_team_slug, v_demo_id, 'baseball');
    END IF;

    RAISE NOTICE 'Demo account setup V4 complete for %', v_demo_email;

END $$;

COMMIT;
