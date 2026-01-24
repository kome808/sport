-- ================================================
-- 修復演示帳號 V5 (Fix Demo Account - Clean Rebuild)
-- 日期: 2026-01-25
-- 說明：暴力刪除舊帳號，抓取正確 instance_id 重建
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
    v_instance_id UUID;
BEGIN
    -- 0. 清理舊資料 (確保之後的 INSERT 不會有殘留問題)
    DELETE FROM auth.identities WHERE user_id = v_demo_id OR email = v_demo_email;
    DELETE FROM auth.users WHERE id = v_demo_id OR email = v_demo_email;
    
    -- 1. 取得正確的 Instance ID (如果有其他使用者，沿用他們的設定，否則用預設值)
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;
    
    RAISE NOTICE 'Using Instance ID: %', v_instance_id;

    -- 2. 重新建立 Auth User
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
        v_instance_id,
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

    -- 3. 重新建立 Identity (只有必要的欄位)
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

    -- 4. 確保 Public Coaches 資料
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_demo_id, v_demo_email, 'Demo 教練', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCoach')
    ON CONFLICT (id) DO UPDATE SET name = 'Demo 教練';

    -- 5. 綁定或建立球隊
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = v_team_slug;
    
    IF v_team_id IS NOT NULL THEN
        UPDATE sport.teams SET coach_id = v_demo_id WHERE id = v_team_id;
    ELSE
        INSERT INTO sport.teams (name, slug, coach_id, sport_type)
        VALUES ('大雄棒球隊 (Demo)', v_team_slug, v_demo_id, 'baseball');
    END IF;

    RAISE NOTICE 'Demo account setup V5 (Clean Rebuild) complete for %', v_demo_email;

END $$;

COMMIT;
