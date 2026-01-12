-- ================================================
-- 重設球員密碼為測試密碼 '1234'
-- 執行時機：開發/測試環境
-- ================================================

UPDATE sport.players 
SET password_hash = '1234' 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball');

-- 確認更新結果
SELECT id, jersey_number, name, password_hash 
FROM sport.players 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball')
ORDER BY jersey_number::integer;
