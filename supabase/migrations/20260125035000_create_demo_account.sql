-- ================================================
-- 建立演示帳號 (Demo Account Setup)
-- 日期: 2026-01-25
-- 說明：直接在後端建立 demo@sportrepo.com 帳號並綁定球隊
-- ================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_demo_email TEXT := 'demo@sportrepo.com';
    v_demo_pwd   TEXT := 'demo@sportrepo.com';
    v_demo_id    UUID := '99999999-9999-9999-9999-999999999999'; -- 固定 ID 方便管理
    v_team_slug  TEXT := 'doraemon-baseball';
    v_team_id    UUID;
BEGIN
    -- 1. 建立 Auth User (如果不存在)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_demo_email) THEN
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
            '00000000-0000-0000-0000-000000000000',
            v_demo_id,
            'authenticated',
            'authenticated',
            v_demo_email,
            crypt(v_demo_pwd, gen_salt('bf')), -- 使用 bcrypt 加密
            now(), -- Email confirmed
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Demo Coach"}',
            now(),
            now()
        );
        RAISE NOTICE '已建立 Auth User: %', v_demo_email;
    ELSE
        -- 如果已存在 (可能之前手動建的)，更新密碼確保一致
        UPDATE auth.users 
        SET encrypted_password = crypt(v_demo_pwd, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE email = v_demo_email;
        
        SELECT id INTO v_demo_id FROM auth.users WHERE email = v_demo_email;
        RAISE NOTICE '更新既有 User 密碼: % (ID: %)', v_demo_email, v_demo_id;
    END IF;

    -- 2. 建立 Public Coaches 資料
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_demo_id, v_demo_email, 'Demo 教練', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCoach')
    ON CONFLICT (id) DO NOTHING;

    -- 3. 綁定 Doraemon 球隊
    -- 先找找看球隊是否存在
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = v_team_slug;
    
    IF v_team_id IS NOT NULL THEN
        -- 更新球隊擁有者為 Demo 帳號
        UPDATE sport.teams SET coach_id = v_demo_id WHERE id = v_team_id;
        RAISE NOTICE '已將球隊 % 轉移給 Demo 帳號', v_team_slug;
    ELSE
        -- 如果球隊不存在，建立一個
        INSERT INTO sport.teams (name, slug, coach_id, sport_type)
        VALUES ('大雄棒球隊 (Demo)', v_team_slug, v_demo_id, 'baseball');
        RAISE NOTICE '已建立新球隊: %', v_team_slug;
    END IF;

END $$;

COMMIT;
