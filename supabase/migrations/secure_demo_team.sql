-- secure_demo_team.sql
-- 將邀請碼改為隨機 UUID，防止外人猜測加入
UPDATE sport.teams 
SET invitation_code = gen_random_uuid()::text 
WHERE slug = 'shohoku-basketball';

DO $$
BEGIN
    RAISE NOTICE '✅ 湘北隊已鎖定：邀請碼已重置為隨機亂碼，防止外部寫入';
END $$;
