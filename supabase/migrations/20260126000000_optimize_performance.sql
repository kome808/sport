-- 1. 為球隊網址路徑建立索引 (解決 manto1 找不到的問題)
CREATE INDEX IF NOT EXISTS idx_teams_slug ON sport.teams(slug);

-- 2. 為所有核心關聯建立索引 (解決 48,853 行全表掃描問題)
CREATE INDEX IF NOT EXISTS idx_players_team_id ON sport.players(team_id);
CREATE INDEX IF NOT EXISTS idx_trainings_team_id ON sport.trainings(team_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_team_id ON sport.daily_records(team_id);
CREATE INDEX IF NOT EXISTS idx_pain_reports_team_id ON sport.pain_reports(team_id);

-- 3. 為時間維度建立索引 (加速戰情室 7 天/30 天數據查詢)
CREATE INDEX IF NOT EXISTS idx_trainings_date ON sport.trainings(date);
CREATE INDEX IF NOT EXISTS idx_daily_records_created_at ON sport.daily_records(created_at);
CREATE INDEX IF NOT EXISTS idx_pain_reports_created_at ON sport.pain_reports(created_at);

-- 4. 針對常用的 RLS 查詢進行優化
CREATE INDEX IF NOT EXISTS idx_team_coaches_user_id ON sport.team_coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_team_coaches_team_id ON sport.team_coaches(team_id);
