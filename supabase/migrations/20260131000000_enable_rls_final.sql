-- ================================================
-- 修正 RLS 問題 - 最終版 (符合混合認證架構)
-- 日期: 2026-01-31
-- 說明: 
--   1. 啟用所有表的 RLS (修正 Linter 警告)
--   2. 移除 anon 角色的寫入權限 (安全強化)
--   3. 保留基於 Auth 的教練政策
--   4. 球員存取透過 SECURITY DEFINER RPCs
-- ================================================

-- ===== 步驟 1: 啟用所有表的 RLS =====
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

-- ===== 步驟 2: 移除 anon 角色的寫入權限 (僅保留 SELECT) =====
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sport FROM anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sport TO anon;

-- 同樣更新未來新表的預設權限
ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
GRANT SELECT ON TABLES TO anon;

-- ===== 步驟 3: 加入 Demo 資料的匿名讀取政策 =====
-- 允許 anon 查看 Demo 球隊資料 (供展示使用)
CREATE POLICY IF NOT EXISTS "daily_records_select_anonymous_demo" ON sport.daily_records
    FOR SELECT TO anon
    USING (
        player_id IN (
            SELECT id FROM sport.players 
            WHERE team_id IN (
                SELECT id FROM sport.teams WHERE is_demo = true
            )
        )
    );

CREATE POLICY IF NOT EXISTS "pain_reports_select_anonymous_demo" ON sport.pain_reports
    FOR SELECT TO anon
    USING (
        player_id IN (
            SELECT id FROM sport.players 
            WHERE team_id IN (
                SELECT id FROM sport.teams WHERE is_demo = true
            )
        )
    );

CREATE POLICY IF NOT EXISTS "notifications_select_anonymous_demo" ON sport.notifications
    FOR SELECT TO anon
    USING (
        team_id IN (
            SELECT id FROM sport.teams WHERE is_demo = true
        )
    );

-- ===== 步驟 4: 驗證 RLS 與權限狀態 =====
DO $$
DECLARE
    tbl_record RECORD;
    total_tables INTEGER := 0;
    enabled_tables INTEGER := 0;
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'RLS 狀態檢查報告';
    RAISE NOTICE '================================================';
    
    FOR tbl_record IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'sport'
        ORDER BY tablename
    LOOP
        total_tables := total_tables + 1;
        IF tbl_record.rowsecurity THEN
            enabled_tables := enabled_tables + 1;
            RAISE NOTICE '✅ %.% - RLS 已啟用', tbl_record.schemaname, tbl_record.tablename;
        ELSE
            RAISE WARNING '❌ %.% - RLS 未啟用', tbl_record.schemaname, tbl_record.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '總計: % 個資料表, % 個已啟用 RLS', total_tables, enabled_tables;
    
    IF enabled_tables = total_tables THEN
        RAISE NOTICE '✅ 所有資料表已正確啟用 RLS';
    ELSE
        RAISE WARNING '⚠️ 仍有 % 個資料表未啟用 RLS', (total_tables - enabled_tables);
    END IF;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Schema 權限檢查';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'anon 角色權限: SELECT (僅讀取)';
    RAISE NOTICE 'authenticated 角色權限: SELECT, INSERT, UPDATE, DELETE (受 RLS 限制)';
    RAISE NOTICE '================================================';
END $$;

-- ===== 備註 =====
-- 1. 球員資料存取透過 SECURITY DEFINER RPCs:
--    - login_player(player_code, password)
--    - get_player_fatigue_metrics(player_id)
--    - update_player_profile(...)
-- 
-- 2. 這些 RPCs 會繞過 RLS，因此必須在 RPC 內部實作完整的業務邏輯驗證
--
-- 3. Demo 資料允許匿名讀取，供展示使用
--
-- 4. 執行後請在 Supabase Dashboard 確認 Linter 警告已消除
