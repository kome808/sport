-- 新增球員狀態欄位
ALTER TABLE sport.players ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 先刪除舊的檢查限制（如果存在）再重新建立，以確保冪等性
ALTER TABLE sport.players DROP CONSTRAINT IF EXISTS players_status_check;
ALTER TABLE sport.players ADD CONSTRAINT players_status_check CHECK (status IN ('active', 'graduated'));
