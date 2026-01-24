-- ================================================
-- 修正球員認領狀態
-- 日期: 2026-01-23
-- 說明：將密碼為預設值 '1234' 或 Hash 後為對應值的球員，狀態重設為 is_claimed = false
-- 以便在邀請頁面中可以被認領。
-- ================================================

-- 1. 重設明文密碼為 '1234' 的球員
UPDATE sport.players
SET is_claimed = false
WHERE password_hash = '1234';

-- 2. 重設特定測試 Hash 的球員 (對應 seed data)
-- seed data hash: $2a$10$abcdefghijklmnopqrstuv (這是偽造的 hash)
UPDATE sport.players
SET is_claimed = false
WHERE password_hash = '$2a$10$abcdefghijklmnopqrstuv';

-- 3. 確認結果
SELECT name, jersey_number, is_claimed, password_hash
FROM sport.players
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball')
ORDER BY jersey_number::integer;
