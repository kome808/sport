-- ================================================
-- 修復演示帳號 (Fix Demo Account - Complete)
-- 日期: 2026-01-25
-- 說明：完整建立 Auth User 與 Identity，解決 422 錯誤
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
    -- 1. 確保 / 更新 Auth User
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
    )
    ON CONFLICT (id) DO UPDATE SET 
        encrypted_password = crypt(v_demo_pwd, gen_salt('bf')),
        email_confirmed_at = now(),
        updated_at = now();

    -- 2. 確保 Auth Identity (關鍵修復：解決 422 錯誤)
    -- 注意：auth.identities 的 id 欄位通常是 UUID (使用者 ID)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_demo_id,
        v_demo_id,
        format('{"sub": "%s", "email": "%s"}', v_demo_id, v_demo_email)::jsonb,
        'email',
        now(),
        now(),
        now()
    )
    ON CONFLICT (provider, id) DO NOTHING; -- 舊版可能沒有這個 Constraint
    -- 如果上面的 ON CONFLICT 失敗 (因為 schema 差異)，請忽略，因為 user 已經存在即可

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

    RAISE NOTICE 'Demo account setup complete for %', v_demo_email;

END $$;

COMMIT;
