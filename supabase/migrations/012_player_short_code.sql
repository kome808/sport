-- ================================================
-- 新增球員短代碼欄位
-- 日期: 2026-01-12
-- 說明：為球員增加 3 碼短代碼，用於簡化登入 URL
-- ================================================

-- 1. 新增 short_code 欄位
ALTER TABLE sport.players 
ADD COLUMN IF NOT EXISTS short_code VARCHAR(10) UNIQUE;

-- 2. 建立隨機短代碼產生函數
CREATE OR REPLACE FUNCTION sport.generate_short_code(length INTEGER DEFAULT 3)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';  -- 排除易混淆的 0/o, 1/l/i
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. 為現有球員產生短代碼
DO $$
DECLARE
  player_record RECORD;
  new_code TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER;
BEGIN
  FOR player_record IN 
    SELECT id FROM sport.players WHERE short_code IS NULL
  LOOP
    attempt := 0;
    LOOP
      new_code := sport.generate_short_code(3);
      attempt := attempt + 1;
      
      -- 檢查是否重複
      IF NOT EXISTS (SELECT 1 FROM sport.players WHERE short_code = new_code) THEN
        UPDATE sport.players SET short_code = new_code WHERE id = player_record.id;
        EXIT;
      END IF;
      
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION '無法為球員 % 產生唯一短代碼', player_record.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 4. 設定 short_code 為 NOT NULL（在產生所有代碼後）
ALTER TABLE sport.players 
ALTER COLUMN short_code SET NOT NULL;

-- 5. 建立觸發器：新增球員時自動產生短代碼
CREATE OR REPLACE FUNCTION sport.auto_generate_short_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  IF NEW.short_code IS NULL THEN
    LOOP
      new_code := sport.generate_short_code(3);
      attempt := attempt + 1;
      
      IF NOT EXISTS (SELECT 1 FROM sport.players WHERE short_code = new_code) THEN
        NEW.short_code := new_code;
        EXIT;
      END IF;
      
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION '無法產生唯一短代碼';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_short_code ON sport.players;
CREATE TRIGGER trg_auto_short_code
  BEFORE INSERT ON sport.players
  FOR EACH ROW
  EXECUTE FUNCTION sport.auto_generate_short_code();

-- 6. 確認結果
SELECT jersey_number, name, short_code 
FROM sport.players 
WHERE team_id = (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball')
ORDER BY jersey_number::integer;
