-- disable_demo_invitations.sql
-- 關閉湘北隊的球員與教練邀請功能
UPDATE sport.teams 
SET 
    is_invitation_enabled = false,
    is_coach_invitation_enabled = false
WHERE slug = 'shohoku-basketball';

DO $$
BEGIN
    RAISE NOTICE '✅ 湘北隊邀請功能已完全關閉';
END $$;
