-- ================================================
-- V4 Enhanced: 嚴格 RLS 整合版 (Strict & Secure & Backup)
-- 日期: 2026-01-26
-- 說明: 整合 Supabase AI 建議，包含備份、嚴格權限與防呆索引
-- ================================================

-- ===== 0. 建立 Policy 備份機制 (Safeguard) =====
CREATE SCHEMA IF NOT EXISTS admin; -- 確保 admin schema 存在

CREATE TABLE IF NOT EXISTS admin.policy_backups (
    id serial PRIMARY KEY,
    schema_name text NOT NULL,
    policy_name text NOT NULL,
    table_name text NOT NULL,
    policy_def text,
    created_at timestamptz DEFAULT now(),
    created_by text
);

-- 自動備份當前 sport schema 的所有 Policy (簡易版，避免 pg_get_policydef 權限問題)
INSERT INTO admin.policy_backups (schema_name, policy_name, table_name, policy_def, created_by)
SELECT 
    schemaname, 
    policyname, 
    tablename, 
    -- 由於權限問題無法直接取得完整定義，這裡僅記錄名稱作為參考
    'Direct backup not available via SQL Editor', 
    current_user 
FROM pg_policies 
WHERE schemaname = 'sport';

-- ===== 1. 清理舊 Policy =====
-- (使用 DO block 再次確保乾淨，避免殘留)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'sport'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON sport.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ===== 2. 建立安全且高效的 Helper Functions =====

-- 2.1 取得教練球隊列表 (效能核心)
-- 改良點: 回傳空陣列而非 NULL、嚴格限制執行權限
CREATE OR REPLACE FUNCTION sport.get_coach_team_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) 
    FROM sport.teams 
    WHERE coach_id = auth.uid();
$$;

-- 權限控管: 防止 Public 呼叫
REVOKE ALL ON FUNCTION sport.get_coach_team_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sport.get_coach_team_ids() TO authenticated; 
-- 建議未來可以只 GRANT 給教練角色，目前先開放給 authenticated


-- 2.2 判斷是否為該球員的教練 (Policy 語法糖)
CREATE OR REPLACE FUNCTION sport.is_coach_of_player(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM sport.players p 
        WHERE p.id = $1 
        AND p.team_id IN (
            SELECT id FROM sport.teams WHERE coach_id = auth.uid()
        )
    );
$$;

REVOKE ALL ON FUNCTION sport.is_coach_of_player(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sport.is_coach_of_player(uuid) TO authenticated;


-- ===== 3. 建立防呆與效能索引 =====
-- 確保 RLS 在 join 時不會 full scan
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON sport.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON sport.players(team_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_player_id ON sport.daily_records(player_id);
CREATE INDEX IF NOT EXISTS idx_pain_reports_report_date ON sport.pain_reports(report_date); 
-- 複合索引優化: 
CREATE INDEX IF NOT EXISTS idx_daily_records_player_date ON sport.daily_records(player_id, record_date);


-- ===== 4. 建立新的 Strict RLS Policies =====

-- [teams] 球隊
-- 讀取: 仍保持公開 (為了 Slug 查詢)，若要嚴格限制需改用 View，但此階段維持原案
CREATE POLICY "teams_public_read_v4" ON sport.teams
    FOR SELECT USING (true);

-- 管理: 嚴格限制教練本人
CREATE POLICY "teams_coach_manage_v4" ON sport.teams
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = coach_id)
    WITH CHECK ((SELECT auth.uid()) = coach_id);


-- [players] 球員
-- 讀取: 球員自己 OR 該球隊教練
CREATE POLICY "players_read_v4" ON sport.players
    FOR SELECT TO authenticated
    USING (
        id = (SELECT auth.uid())::uuid OR 
        team_id = ANY(sport.get_coach_team_ids())
    );

-- 管理: 只有教練能新增/修改/刪除球員
CREATE POLICY "players_coach_manage_v4" ON sport.players
    FOR ALL TO authenticated
    USING (team_id = ANY(sport.get_coach_team_ids()))
    WITH CHECK (team_id = ANY(sport.get_coach_team_ids()));


-- [daily_records] 訓練日誌
-- 讀取: 球員自己 OR 教練 (使用 helper function)
CREATE POLICY "daily_records_read_v4" ON sport.daily_records
    FOR SELECT TO authenticated
    USING (
        player_id = (SELECT auth.uid())::uuid OR 
        sport.is_coach_of_player(player_id)
    );

-- 寫入: 球員自己
CREATE POLICY "daily_records_player_insert_v4" ON sport.daily_records
    FOR INSERT TO authenticated
    WITH CHECK (player_id = (SELECT auth.uid())::uuid);

-- 更新: 球員自己
CREATE POLICY "daily_records_player_update_v4" ON sport.daily_records
    FOR UPDATE TO authenticated
    USING (player_id = (SELECT auth.uid())::uuid)
    WITH CHECK (player_id = (SELECT auth.uid())::uuid);

-- 教練管理: 教練可以讀寫自己球員的日誌 (如需限制教練只能讀不能改，可拿掉此條)
CREATE POLICY "daily_records_coach_manage_v4" ON sport.daily_records
    FOR ALL TO authenticated
    USING (sport.is_coach_of_player(player_id))
    WITH CHECK (sport.is_coach_of_player(player_id));


-- [pain_reports] 疼痛報告
-- 讀取: 球員自己 OR 教練
CREATE POLICY "pain_reports_read_v4" ON sport.pain_reports
    FOR SELECT TO authenticated
    USING (
        player_id = (SELECT auth.uid())::uuid OR 
        sport.is_coach_of_player(player_id)
    );

-- 管理: 球員自己完全控制
CREATE POLICY "pain_reports_player_manage_v4" ON sport.pain_reports
    FOR ALL TO authenticated
    USING (player_id = (SELECT auth.uid())::uuid)
    WITH CHECK (player_id = (SELECT auth.uid())::uuid);
-- 備註: 教練通常不修改球員的疼痛報告，故僅開放讀取 (若需修改可比照 daily_records 加一條)


-- [notifications] 通知
-- 極度嚴格: 只能存取 user_id 是自己的
CREATE POLICY "notifications_own_v4" ON sport.notifications
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid())::uuid)
    WITH CHECK (user_id = (SELECT auth.uid())::uuid);

-- ================================================
-- 部署完成確認
-- 建議執行: SELECT * FROM admin.policy_backups ORDER BY created_at DESC LIMIT 5;
-- ================================================
