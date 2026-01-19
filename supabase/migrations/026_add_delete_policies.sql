-- ================================================
-- 新增 DELETE 權限給教練
-- 日期: 2026-01-19
-- 描述: 允許教練刪除其球隊的每日紀錄、疼痛回報與通知
-- ================================================

-- Daily Records DELETE 政策
CREATE POLICY "daily_records_delete" ON sport.daily_records
FOR DELETE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- Pain Reports DELETE 政策
CREATE POLICY "pain_reports_delete" ON sport.pain_reports
FOR DELETE TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM sport.players p
    JOIN sport.team_members tm ON p.team_id = tm.team_id
    WHERE tm.coach_id = sport.get_current_coach_id()
  )
);

-- Notifications DELETE 政策
CREATE POLICY "notifications_delete" ON sport.notifications
FOR DELETE TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM sport.team_members
    WHERE coach_id = sport.get_current_coach_id()
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ DELETE 政策已新增：daily_records, pain_reports, notifications';
END $$;
