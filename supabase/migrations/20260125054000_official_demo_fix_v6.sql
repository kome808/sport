-- ================================================
-- 正式演示帳號修補 V6 (Hard Reset - No Generated Columns)
-- 日期: 2026-01-25
-- 說明：修正 V5 中 confirmed_at 為 generated column 無法寫入的問題
-- ================================================

BEGIN;

-- 1. 徹底拔除所有可能導致 500 錯誤的觸發器
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.auto_confirm_demo_user() CASCADE;
DROP FUNCTION IF EXISTS public.link_demo_team_after_signup() CASCADE;

-- 2. 安全清理與重置
DO $$
DECLARE
    v_email   TEXT := 'sportrepotw@gmail.com';
    v_user_id UUID := gen_random_uuid();
    v_inst_id UUID;
BEGIN
    -- 先刪除球隊，避免 coach_id NOT NULL 限制
    DELETE FROM sport.teams WHERE slug = 'doraemon-baseball';
    
    -- 徹底刪除舊資料
    DELETE FROM auth.identities 
    WHERE email = v_email 
       OR user_id IN (SELECT id FROM auth.users WHERE email = v_email);
    
    DELETE FROM sport.coaches WHERE email = v_email;
    DELETE FROM auth.users WHERE email = v_email;

    -- 取得 Instance ID
    SELECT instance_id INTO v_inst_id FROM auth.users LIMIT 1;
    IF v_inst_id IS NULL THEN v_inst_id := '00000000-0000-0000-0000-000000000000'; END IF;

    -- 3. 標準插入 (移除 confirmed_at，那是 generated column)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        is_super_admin
    ) VALUES (
        v_inst_id, v_user_id, 'authenticated', 'authenticated', v_email, crypt('sportrepotw', gen_salt('bf')),
        now(), '{"provider": "email", "providers": ["email"]}', '{"name": "DEMO"}', now(), now(),
        false
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id, 
        format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
        'email', 
        v_email, 
        now(), now(), now()
    );

    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_user_id, v_email, 'DEMO', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DEMO');

    -- 重建球隊
    INSERT INTO sport.teams (name, slug, coach_id, sport_type)
    VALUES ('大雄棒球隊 (Demo)', 'doraemon-baseball', v_user_id, 'baseball');

    RAISE NOTICE 'Hard Reset Successful V6. Email: %, ID: %', v_email, v_user_id;
END $$;

COMMIT;
