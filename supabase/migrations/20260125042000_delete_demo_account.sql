-- ================================================
-- 清除演示帳號 (Delete Demo Account)
-- 日期: 2026-01-25
-- 說明：清空 demo@sportrepo.com 讓前端可以重新註冊
-- ================================================

BEGIN;

DELETE FROM auth.identities WHERE email = 'demo@sportrepo.com';
DELETE FROM auth.users WHERE email = 'demo@sportrepo.com';
-- 也刪除關聯的 Public Coach 資料，以免 ID 衝突
DELETE FROM sport.coaches WHERE email = 'demo@sportrepo.com';

COMMIT;
