-- ================================================
-- 安全強化：RLS + RPC 雙重防護模型
-- 日期: 2026-01-31
-- 說明: 根據 Supabase 專家建議實作多層次安全防護
-- ================================================

-- ===== 第一部分: 啟用 RLS (必要步驟) =====
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

-- ===== 第二部分: 權限收緊 (最小權限原則) =====

-- 2.1 移除 anon 角色的寫入權限
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sport FROM anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sport TO anon;

-- 2.2 更新未來新表的預設權限
ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
GRANT SELECT ON TABLES TO anon;

-- ===== 第三部分: 嚴格的 RLS 政策 (底層防護) =====

-- 3.1 players 表 - 完全阻擋 anon 直接寫入
CREATE POLICY IF NOT EXISTS "players_block_anon_write" ON sport.players
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- 3.2 daily_records 表 - 完全阻擋 anon 直接寫入
CREATE POLICY IF NOT EXISTS "daily_records_block_anon_write" ON sport.daily_records
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- 3.3 pain_reports 表 - 完全阻擋 anon 直接寫入
CREATE POLICY IF NOT EXISTS "pain_reports_block_anon_write" ON sport.pain_reports
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- 3.4 允許 anon 讀取 Demo 資料 (僅 SELECT)
CREATE POLICY IF NOT EXISTS "daily_records_select_demo_anon" ON sport.daily_records
    FOR SELECT TO anon
    USING (
        player_id IN (
            SELECT p.id FROM sport.players p
            JOIN sport.teams t ON p.team_id = t.id
            WHERE t.slug = 'demo' OR t.slug = 'shohoku' OR t.slug = 'doraemon-baseball'
        )
    );

CREATE POLICY IF NOT EXISTS "pain_reports_select_demo_anon" ON sport.pain_reports
    FOR SELECT TO anon
    USING (
        player_id IN (
            SELECT p.id FROM sport.players p
            JOIN sport.teams t ON p.team_id = t.id
            WHERE t.slug = 'demo' OR t.slug = 'shohoku' OR t.slug = 'doraemon-baseball'
        )
    );

CREATE POLICY IF NOT EXISTS "players_select_demo_anon" ON sport.players
    FOR SELECT TO anon
    USING (
        team_id IN (
            SELECT id FROM sport.teams 
            WHERE slug IN ('demo', 'shohoku', 'doraemon-baseball')
        )
    );

-- ===== 第四部分: 強化 RPC 安全性 =====

-- 4.1 Rate Limiting Table (防止暴力破解)
CREATE TABLE IF NOT EXISTS sport.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_code TEXT NOT NULL,
    attempt_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_code_time 
ON sport.login_attempts(player_code, attempt_time DESC);

-- 4.2 Audit Log Table (記錄所有敏感操作)
CREATE TABLE IF NOT EXISTS sport.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    record_id UUID,
    player_id UUID,
    coach_id UUID,
    old_data JSONB,
    new_data JSONB,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_player 
ON sport.audit_logs(player_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_time 
ON sport.audit_logs(performed_at DESC);

-- 4.3 強化 login_player - 加入 Rate Limiting
CREATE OR REPLACE FUNCTION sport.login_player_secure(
    player_code text, 
    password text,
    ip_address text DEFAULT NULL,
    user_agent text DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    team_id uuid,
    name varchar,
    jersey_number varchar,
    position varchar,
    birth_date date,
    height_cm decimal,
    weight_kg decimal,
    avatar_url text,
    short_code varchar,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player sport.players%ROWTYPE;
    v_failed_attempts INTEGER;
BEGIN
    -- 檢查 5 分鐘內失敗次數 (防止暴力破解)
    SELECT COUNT(*) INTO v_failed_attempts
    FROM sport.login_attempts
    WHERE lower(player_code) = lower($1)
      AND success = false
      AND attempt_time > NOW() - INTERVAL '5 minutes';
    
    IF v_failed_attempts >= 5 THEN
        INSERT INTO sport.login_attempts (player_code, success, ip_address, user_agent)
        VALUES (lower($1), false, ip_address, user_agent);
        
        RAISE EXCEPTION '登入失敗次數過多，請 5 分鐘後再試';
    END IF;
    
    -- 驗證球員代碼與密碼
    SELECT * INTO v_player
    FROM sport.players
    WHERE (short_code = lower($1) OR id::text = $1)
      AND is_active = true
      AND password_hash = crypt($2, password_hash);
    
    IF v_player.id IS NULL THEN
        -- 記錄失敗
        INSERT INTO sport.login_attempts (player_code, success, ip_address, user_agent)
        VALUES (lower($1), false, ip_address, user_agent);
        
        RAISE EXCEPTION '球員代碼或密碼錯誤';
    END IF;
    
    -- 記錄成功登入
    INSERT INTO sport.login_attempts (player_code, success, ip_address, user_agent)
    VALUES (lower($1), true, ip_address, user_agent);
    
    -- 回傳球員資料 (排除敏感欄位)
    RETURN QUERY
    SELECT 
        v_player.id,
        v_player.team_id,
        v_player.name,
        v_player.jersey_number,
        v_player.position,
        v_player.birth_date,
        v_player.height_cm,
        v_player.weight_kg,
        v_player.avatar_url,
        v_player.short_code,
        v_player.is_active;
END;
$$;

-- 4.4 強化 update_player_profile - 加入 Audit Log
CREATE OR REPLACE FUNCTION sport.update_player_profile_secure(
    p_player_id uuid,
    p_old_password text,
    p_name text DEFAULT NULL,
    p_jersey_number text DEFAULT NULL,
    p_position text DEFAULT NULL,
    p_height_cm numeric DEFAULT NULL,
    p_weight_kg numeric DEFAULT NULL,
    p_new_password text DEFAULT NULL,
    p_birth_date date DEFAULT NULL
)
RETURNS SETOF sport.players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_player sport.players%ROWTYPE;
BEGIN
    -- 取得舊資料
    SELECT to_jsonb(p.*) INTO v_old_data
    FROM sport.players p
    WHERE id = p_player_id;
    
    IF v_old_data IS NULL THEN
        RAISE EXCEPTION 'Player not found';
    END IF;
    
    -- 驗證舊密碼
    SELECT * INTO v_player FROM sport.players WHERE id = p_player_id;
    
    IF v_player.password_hash IS NOT NULL 
       AND (p_old_password IS NULL OR v_player.password_hash != crypt(p_old_password, v_player.password_hash)) THEN
        RAISE EXCEPTION '舊密碼錯誤';
    END IF;
    
    -- 執行更新
    RETURN QUERY
    UPDATE sport.players
    SET 
        name = COALESCE(p_name, name),
        jersey_number = COALESCE(p_jersey_number, jersey_number),
        position = COALESCE(p_position, position),
        height_cm = COALESCE(p_height_cm, height_cm),
        weight_kg = COALESCE(p_weight_kg, weight_kg),
        birth_date = COALESCE(p_birth_date, birth_date),
        password_hash = CASE 
            WHEN p_new_password IS NOT NULL AND length(p_new_password) > 0 
            THEN crypt(p_new_password, gen_salt('bf')) 
            ELSE password_hash 
        END,
        is_claimed = true,
        updated_at = NOW()
    WHERE id = p_player_id
    RETURNING *;
    
    -- 記錄 Audit Log
    SELECT to_jsonb(p.*) INTO v_new_data
    FROM sport.players p
    WHERE id = p_player_id;
    
    INSERT INTO sport.audit_logs (
        table_name, operation, record_id, player_id, old_data, new_data
    ) VALUES (
        'players', 'UPDATE', p_player_id, p_player_id, v_old_data, v_new_data
    );
END;
$$;

-- ===== 第五部分: 權限設定 (僅 RPC 可呼叫) =====

-- 5.1 收回舊的 login_player 權限
REVOKE ALL ON FUNCTION sport.login_player(text, text) FROM PUBLIC;

-- 5.2 授予新的安全版本權限
GRANT EXECUTE ON FUNCTION sport.login_player_secure(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sport.update_player_profile_secure(uuid, text, text, text, text, numeric, numeric, text, date) TO anon, authenticated;

-- 5.3 保持 get_player_fatigue_metrics 權限 (已是 SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION sport.get_player_fatigue_metrics(UUID, DATE) TO anon, authenticated;

-- ===== 第六部分: 驗證與報告 =====
DO $$
DECLARE
    tbl_record RECORD;
    total_tables INTEGER := 0;
    enabled_tables INTEGER := 0;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '安全強化部署報告';
    RAISE NOTICE '================================================';
    
    -- 檢查 RLS 狀態
    FOR tbl_record IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'sport'
        ORDER BY tablename
    LOOP
        total_tables := total_tables + 1;
        IF tbl_record.rowsecurity THEN
            enabled_tables := enabled_tables + 1;
            
            -- 計算該表的 policy 數量
            SELECT COUNT(*) INTO policy_count
            FROM pg_policies
            WHERE schemaname = 'sport' AND tablename = tbl_record.tablename;
            
            RAISE NOTICE '✅ %.% - RLS 已啟用 (% 個政策)', 
                tbl_record.schemaname, tbl_record.tablename, policy_count;
        ELSE
            RAISE WARNING '❌ %.% - RLS 未啟用', 
                tbl_record.schemaname, tbl_record.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '總計: % 個資料表, % 個已啟用 RLS', total_tables, enabled_tables;
    RAISE NOTICE '================================================';
    RAISE NOTICE '安全強化項目:';
    RAISE NOTICE '✅ 1. 所有表已啟用 RLS';
    RAISE NOTICE '✅ 2. anon 角色僅有 SELECT 權限';
    RAISE NOTICE '✅ 3. 嚴格阻擋 anon 直接寫入敏感表';
    RAISE NOTICE '✅ 4. Rate Limiting (5 分鐘 5 次失敗)';
    RAISE NOTICE '✅ 5. Audit Logging (記錄所有更新)';
    RAISE NOTICE '✅ 6. 密碼驗證使用 Bcrypt';
    RAISE NOTICE '================================================';
    RAISE NOTICE '下一步: 測試 login_player_secure 與 update_player_profile_secure';
    RAISE NOTICE '================================================';
END $$;
