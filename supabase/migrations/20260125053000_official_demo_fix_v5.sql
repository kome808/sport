-- ================================================
-- 正式演示帳號修補 V5 (Hard Reset - Correct Order)
-- 日期: 2026-01-25
-- 說明：修正 V4 中 update teams coach_id = NULL 導致的約束錯誤
-- ================================================

BEGIN;

-- 1. 徹底拔除所有可能導致 500 錯誤的觸發器 (不限名稱)
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
    -- 【修正點】直接刪除球隊，避免嘗試將 coach_id 設為 NULL
    DELETE FROM sport.teams WHERE slug = 'doraemon-baseball';
    
    -- 徹底刪除舊資料
    -- 先刪除 Identity
    DELETE FROM auth.identities 
    WHERE email = v_email 
       OR user_id IN (SELECT id FROM auth.users WHERE email = v_email);
    
    -- 刪除教練
    DELETE FROM sport.coaches WHERE email = v_email;
    
    -- 最後刪除 User
    DELETE FROM auth.users WHERE email = v_email;

    -- 取得 Instance ID
    SELECT instance_id INTO v_inst_id FROM auth.users LIMIT 1;
    IF v_inst_id IS NULL THEN v_inst_id := '00000000-0000-0000-0000-000000000000'; END IF;

    -- 3. 標準插入 (不使用 Trigger)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        is_super_admin, confirmed_at
    ) VALUES (
        v_inst_id, v_user_id, 'authenticated', 'authenticated', v_email, crypt('sportrepotw', gen_salt('bf')),
        now(), '{"provider": "email", "providers": ["email"]}', '{"name": "DEMO"}', now(), now(),
        false, now()
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

    RAISE NOTICE 'Hard Reset Successful V5. Email: %, ID: %', v_email, v_user_id;
END $$;

COMMIT;
