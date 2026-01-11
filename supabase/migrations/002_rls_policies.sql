-- ================================================
-- 基層運動訓練系統 - Row Level Security (RLS) 政策
-- Schema: sport
-- 日期: 2026-01-11
-- ================================================

-- ================================================
-- 1. 輔助函數：取得當前教練 ID
-- ================================================

CREATE OR REPLACE FUNCTION sport.get_current_coach_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM sport.coaches 
    WHERE email = auth.jwt() ->> 'email'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 2. 啟用 RLS
-- ================================================

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

-- ================================================
-- 3. Coaches 政策
-- ================================================

-- 教練只能查看自己的資料
CREATE POLICY "coaches_select_own" ON sport.coaches
FOR SELECT TO authenticated
USING (email = auth.jwt() ->> 'email');

-- 教練可以更新自己的資料
CREATE POLICY "coaches_update_own" ON sport.coaches
FOR UPDATE TO authenticated
USING (email = auth.jwt() ->> 'email');

-- 新教練註冊時自動建立
CREATE POLICY "coaches_insert_self" ON sport.coaches
FOR INSERT TO authenticated
WITH CHECK (email = auth.jwt() ->> 'email');

-- ================================================
-- 4. Teams 政策
-- ================================================

-- 教練可以查看自己管理的球隊
CREATE POLICY "teams_select_member" ON sport.teams
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- 教練可以建立球隊
CREATE POLICY "teams_insert_coach" ON sport.teams
FOR INSERT TO authenticated
WITH CHECK (coach_id = sport.get_current_coach_id());

-- 球隊擁有者可以更新球隊
CREATE POLICY "teams_update_owner" ON sport.teams
FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id() AND role = 'owner'
  )
);

-- 球隊擁有者可以刪除球隊
CREATE POLICY "teams_delete_owner" ON sport.teams
FOR DELETE TO authenticated
USING (
  id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id() AND role = 'owner'
  )
);

-- ================================================
-- 5. Team Members 政策
-- ================================================

-- 成員可以查看同球隊的成員
CREATE POLICY "team_members_select" ON sport.team_members
FOR SELECT TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- 擁有者可以新增成員
CREATE POLICY "team_members_insert_owner" ON sport.team_members
FOR INSERT TO authenticated
WITH CHECK (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id() AND role IN ('owner', 'admin')
  )
);

-- ================================================
-- 6. Players 政策
-- ================================================

-- 教練可以查看自己球隊的球員
CREATE POLICY "players_select_team" ON sport.players
FOR SELECT TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- 教練可以新增球員
CREATE POLICY "players_insert_team" ON sport.players
FOR INSERT TO authenticated
WITH CHECK (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- 教練可以更新球員
CREATE POLICY "players_update_team" ON sport.players
FOR UPDATE TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- 教練可以刪除球員
CREATE POLICY "players_delete_team" ON sport.players
FOR DELETE TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 7. Daily Records 政策
-- ================================================

-- 教練可以查看自己球隊球員的紀錄
CREATE POLICY "daily_records_select" ON sport.daily_records
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- 允許插入（球員或教練）
CREATE POLICY "daily_records_insert" ON sport.daily_records
FOR INSERT TO authenticated
WITH CHECK (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- 允許更新
CREATE POLICY "daily_records_update" ON sport.daily_records
FOR UPDATE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 8. Pain Reports 政策
-- ================================================

CREATE POLICY "pain_reports_select" ON sport.pain_reports
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "pain_reports_insert" ON sport.pain_reports
FOR INSERT TO authenticated
WITH CHECK (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "pain_reports_update" ON sport.pain_reports
FOR UPDATE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 9. Medical Records 政策
-- ================================================

CREATE POLICY "medical_records_select" ON sport.medical_records
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "medical_records_insert" ON sport.medical_records
FOR INSERT TO authenticated
WITH CHECK (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "medical_records_update" ON sport.medical_records
FOR UPDATE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 10. Training Logs 政策
-- ================================================

CREATE POLICY "training_logs_select" ON sport.training_logs
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "training_logs_insert" ON sport.training_logs
FOR INSERT TO authenticated
WITH CHECK (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "training_logs_update" ON sport.training_logs
FOR UPDATE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 11. Player Goals 政策
-- ================================================

CREATE POLICY "player_goals_select" ON sport.player_goals
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "player_goals_insert" ON sport.player_goals
FOR INSERT TO authenticated
WITH CHECK (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "player_goals_update" ON sport.player_goals
FOR UPDATE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 12. Notifications 政策
-- ================================================

CREATE POLICY "notifications_select" ON sport.notifications
FOR SELECT TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

CREATE POLICY "notifications_update" ON sport.notifications
FOR UPDATE TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

-- ================================================
-- 13. Service Role 政策（用於 Edge Functions）
-- ================================================

-- 允許 service_role 完整存取所有表
-- 這些政策會在使用 service_key 時生效

-- ================================================
-- 完成訊息
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS 政策設定完成！';
END $$;
