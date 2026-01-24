-- ================================================
-- 緊急修復與診斷：教練邀請碼
-- 日期: 2026-01-25
-- ================================================

-- 1. 殺掉所有可能卡住的查詢 (Dangerous, but necessary if stuck)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND pid <> pg_backend_pid()
  AND query LIKE '%validate_coach_invitation_code%';

-- 2. 重建 validate_coach_invitation_code 函數 (最單純 SQL 版本)
-- 移除 PLPGSQL, 移除變數, 僅使用 SQL
DROP FUNCTION IF EXISTS public.validate_coach_invitation_code(text) CASCADE;
DROP FUNCTION IF EXISTS sport.fn_validate_coach_invitation_code(text) CASCADE;

CREATE OR REPLACE FUNCTION public.validate_coach_invitation_code(p_invcode text)
RETURNS TABLE (team_id uuid, team_name text, team_slug text) 
SECURITY DEFINER
SET search_path = public, sport
LANGUAGE sql
AS $$
    SELECT t.id, t.name::text, t.slug::text
    FROM sport.teams t
    WHERE t.coach_invitation_code = p_invcode 
      AND t.is_coach_invitation_enabled = true
    LIMIT 1;
$$;

-- 3. 確保欄位存在且索引正確
DO $$
BEGIN
    -- 檢查 column 是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='sport' AND table_name='teams' AND column_name='coach_invitation_code') THEN
        ALTER TABLE sport.teams ADD COLUMN coach_invitation_code VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='sport' AND table_name='teams' AND column_name='is_coach_invitation_enabled') THEN
        ALTER TABLE sport.teams ADD COLUMN is_coach_invitation_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

DROP INDEX IF EXISTS sport.idx_teams_coach_invitation_code;
CREATE INDEX idx_teams_coach_invitation_code ON sport.teams(coach_invitation_code);

-- 4. 寫入測試數據 (確保一致性)
UPDATE sport.teams 
SET coach_invitation_code = '8217',
    is_coach_invitation_enabled = true
WHERE slug = 'manto1';

-- 5. 授權
GRANT EXECUTE ON FUNCTION public.validate_coach_invitation_code(text) TO anon, authenticated, service_role;

-- 6. 自我診斷結果回報
DO $$
DECLARE
    v_count int;
BEGIN
    SELECT count(*) INTO v_count FROM sport.teams WHERE coach_invitation_code = '8217';
    RAISE NOTICE 'Teams with code 8217: %', v_count;
END $$;
