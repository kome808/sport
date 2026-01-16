-- ================================================
-- 修復 Notifications 資料表欄位 (v2)
-- 目的: 解決 020 執行時的 23503 外鍵衝突錯誤
-- ================================================

DO $$
BEGIN
    -- 1. 如果存在舊的 player_id，先將其重新命名或處理數據
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'sport' AND table_name = 'notifications' AND column_name = 'player_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'sport' AND table_name = 'notifications' AND column_name = 'user_id'
    ) THEN
        -- 重要：因為 player_id 的數據 (球員 UUID) 不符合 auth.users 的外鍵
        -- 我們選擇清空舊通知，或是將該欄位先允許為空並清除數據
        DELETE FROM sport.notifications; 
        
        ALTER TABLE sport.notifications RENAME COLUMN player_id TO user_id;
        ALTER TABLE sport.notifications ALTER COLUMN user_id SET NOT NULL;
        
        -- 移除舊的外鍵 (指向 players)
        ALTER TABLE sport.notifications DROP CONSTRAINT IF EXISTS notifications_player_id_fkey;
    END IF;

    -- 2. 處理現有的 user_id 數據衝突 (如果剛才沒刪乾淨或結構已存在但數據不對)
    -- 刪除所有 user_id 不在 auth.users 中的紀錄，以免之後建立外鍵失敗
    DELETE FROM sport.notifications WHERE user_id NOT IN (SELECT id FROM auth.users);

    -- 3. 建立正確的外鍵 (指向 auth.users)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey' AND table_schema = 'sport'
    ) THEN
        ALTER TABLE sport.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 4. 補齊其餘欄位 (type, link, updated_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'sport' AND table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE sport.notifications ADD COLUMN type TEXT CHECK (type IN ('info', 'warning', 'danger')) DEFAULT 'info';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'sport' AND table_name = 'notifications' AND column_name = 'link') THEN
        ALTER TABLE sport.notifications ADD COLUMN link TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'sport' AND table_name = 'notifications' AND column_name = 'updated_at') THEN
        ALTER TABLE sport.notifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- 5. 更新觸發器函數以正確找到教練並發送通知
CREATE OR REPLACE FUNCTION sport.create_risk_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_player_name VARCHAR;
  v_team_id UUID;
  v_recipient_id UUID;
BEGIN
  -- 只有在風險等級變高時才通知
  IF NEW.risk_level IN ('red', 'black') AND 
     (OLD.risk_level IS NULL OR OLD.risk_level NOT IN ('red', 'black')) THEN
    
    SELECT p.name, p.team_id INTO v_player_name, v_team_id
    FROM sport.players p WHERE p.id = NEW.player_id;
    
    -- 尋找教練 (這部分邏輯必須精確：coaches.email -> auth.users.id)
    SELECT u.id INTO v_recipient_id 
    FROM auth.users u
    JOIN sport.coaches c ON u.email = c.email
    JOIN sport.teams t ON t.coach_id = c.id
    WHERE t.id = v_team_id
    LIMIT 1;

    IF v_recipient_id IS NOT NULL THEN
        INSERT INTO sport.notifications (user_id, team_id, type, title, message, link)
        VALUES (
          v_recipient_id,
          v_team_id,
          'danger',
          '⚠️ 高風險警報',
          format('%s 的訓練負荷達到 %s 級風險，ACWR: %s', 
                 v_player_name, 
                 UPPER(NEW.risk_level), 
                 COALESCE(NEW.acwr::TEXT, 'N/A')),
          format('/team/%s/player/%s', (SELECT slug FROM sport.teams WHERE id = v_team_id), NEW.player_id)
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
