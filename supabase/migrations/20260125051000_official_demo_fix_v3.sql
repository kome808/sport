-- ================================================
-- 正式演示帳號修補 V3 (Official Demo Fix V3 - Anti-NOT NULL Error)
-- 日期: 2026-01-25
-- 說明：修正 teams.coach_id 不能為 NULL 的報錯
-- ================================================

BEGIN;

-- 1. 移除可能干擾系統的 Trigger 與 Function
DROP TRIGGER IF EXISTS tr_before_demo_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_after_demo_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_demo_user();
DROP FUNCTION IF EXISTS public.link_demo_team_after_signup();

-- 2. 清理所有舊測試資料 (暴力清理：先刪除 Team 以免 Constraint 擋住)
DO $$
DECLARE
    v_target_email TEXT := 'sportrepotw@gmail.com';
    v_old_email    TEXT := 'demo@sportrepo.com';
BEGIN
    -- 先刪除球隊 (因為 coach_id NOT NULL 且指向 Coach/User)
    DELETE FROM sport.teams WHERE slug = 'doraemon-baseball';

    -- 刪除舊帳號與教練資料
    DELETE FROM auth.identities WHERE email = v_old_email OR email = v_target_email;
    DELETE FROM auth.users WHERE email = v_old_email OR email = v_target_email;
    DELETE FROM sport.coaches WHERE email = v_old_email OR email = v_target_email;

    RAISE NOTICE 'Cleanup complete.';
END $$;

-- 3. 重新建立標準帳號與關聯
DO $$
DECLARE
    v_email      TEXT := 'sportrepotw@gmail.com';
    v_pwd        TEXT := 'sportrepotw';
    v_user_id    UUID := gen_random_uuid();
    v_instance_id UUID;
BEGIN
    -- 取得正確的 Instance ID
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 建立 Auth User (強制設定為 Confirmed)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        last_sign_in_at, confirmation_token, is_super_admin
    ) VALUES (
        v_instance_id, v_user_id, 'authenticated', 'authenticated', v_email, crypt(v_pwd, gen_salt('bf')),
        now(), '{"provider": "email", "providers": ["email"]}', '{"name": "DEMO"}', now(), now(),
        now(), '', false
    );

    -- 建立 Identity
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

    -- 建立 Coach
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_user_id, v_email, 'DEMO', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DEMO');

    -- 建立「大雄棒球隊」並直接設定 coach_id
    INSERT INTO sport.teams (name, slug, coach_id, sport_type)
    VALUES ('大雄棒球隊 (Demo)', 'doraemon-baseball', v_user_id, 'baseball');

    RAISE NOTICE 'Final Fix V3 Success: User Created and Team Re-linked.';
END $$;

COMMIT;
