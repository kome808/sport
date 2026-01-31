-- ================================================
-- 修正 RLS 未啟用的問題
-- 日期: 2026-01-31
-- 說明: 確保所有 sport schema 的資料表都啟用 RLS
--       (修正 20260126020000 遺漏的 ENABLE RLS 步驟)
-- ================================================

-- 啟用所有核心資料表的 RLS
ALTER TABLE sport.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.pain_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.player_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport.notifications ENABLE ROW LEVEL SECURITY;

-- 驗證 RLS 狀態
DO $$
DECLARE
    tbl_record RECORD;
    total_tables INTEGER := 0;
    enabled_tables INTEGER := 0;
BEGIN
    FOR tbl_record IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'sport'
    LOOP
        total_tables := total_tables + 1;
        IF tbl_record.rowsecurity THEN
            enabled_tables := enabled_tables + 1;
            RAISE NOTICE '✅ RLS已啟用: %.%', tbl_record.schemaname, tbl_record.tablename;
        ELSE
            RAISE WARNING '❌ RLS未啟用: %.%', tbl_record.schemaname, tbl_record.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '總計: %個資料表, %個已啟用RLS', total_tables, enabled_tables;
    RAISE NOTICE '================================================';
END $$;
