-- check_login_function.sql
-- 測試 Legacy Login (前端可能還在用這個)
SELECT * FROM sport.fn_login_player('3ss', 'demo123');

-- 測試 New Login (如果前端已更新)
SELECT * FROM sport.login_player('3ss', 'demo123');
