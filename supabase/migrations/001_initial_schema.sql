-- ================================================
-- 基層運動訓練系統 - Database Schema DDL
-- Schema: sport
-- 日期: 2026-01-11
-- ================================================

-- 建立 Schema
CREATE SCHEMA IF NOT EXISTS sport;

-- ================================================
-- 1. 輔助函數
-- ================================================

-- 更新時間戳函數
CREATE OR REPLACE FUNCTION sport.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. 教練資料表
-- ================================================

CREATE TABLE sport.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coaches_email ON sport.coaches(email);

CREATE TRIGGER update_coaches_timestamp
BEFORE UPDATE ON sport.coaches
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 3. 球隊資料表
-- ================================================

CREATE TABLE sport.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES sport.coaches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  logo_url TEXT,
  sport_type VARCHAR(50) NOT NULL DEFAULT 'baseball',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_slug ON sport.teams(slug);
CREATE INDEX idx_teams_coach_id ON sport.teams(coach_id);

CREATE TRIGGER update_teams_timestamp
BEFORE UPDATE ON sport.teams
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 4. 球隊成員表（多教練支援）
-- ================================================

CREATE TABLE sport.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES sport.teams(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES sport.coaches(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, coach_id)
);

CREATE INDEX idx_team_members_team_coach ON sport.team_members(team_id, coach_id);

-- ================================================
-- 5. 球員資料表
-- ================================================

CREATE TABLE sport.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES sport.teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  jersey_number VARCHAR(10),
  position VARCHAR(50),
  birth_date DATE,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_team_id ON sport.players(team_id);
CREATE UNIQUE INDEX idx_players_team_jersey ON sport.players(team_id, jersey_number) 
WHERE jersey_number IS NOT NULL;

CREATE TRIGGER update_players_timestamp
BEFORE UPDATE ON sport.players
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 6. 每日訓練紀錄表
-- ================================================

CREATE TABLE sport.daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sport.players(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  rhr_bpm INTEGER CHECK (rhr_bpm > 0 AND rhr_bpm < 250),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 5),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 5),
  wellness_total INTEGER CHECK (wellness_total >= 5 AND wellness_total <= 25),
  srpe_score INTEGER CHECK (srpe_score >= 0 AND srpe_score <= 10),
  training_minutes INTEGER CHECK (training_minutes >= 0),
  training_load_au INTEGER CHECK (training_load_au >= 0),
  acwr DECIMAL(4,2),
  risk_level VARCHAR(20) CHECK (risk_level IN ('green', 'yellow', 'red', 'black')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, record_date)
);

CREATE INDEX idx_daily_records_player_date ON sport.daily_records(player_id, record_date);
CREATE INDEX idx_daily_records_date ON sport.daily_records(record_date);
CREATE INDEX idx_daily_records_risk ON sport.daily_records(risk_level);

CREATE TRIGGER update_daily_records_timestamp
BEFORE UPDATE ON sport.daily_records
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- 自動計算 Wellness 總分與訓練負荷
CREATE OR REPLACE FUNCTION sport.calculate_daily_record_values()
RETURNS TRIGGER AS $$
BEGIN
  -- 計算 Wellness 總分
  NEW.wellness_total = COALESCE(NEW.sleep_quality, 0) 
                     + COALESCE(NEW.fatigue_level, 0) 
                     + COALESCE(NEW.mood, 0) 
                     + COALESCE(NEW.stress_level, 0) 
                     + COALESCE(NEW.muscle_soreness, 0);
  
  -- 計算訓練負荷 AU
  IF NEW.srpe_score IS NOT NULL AND NEW.training_minutes IS NOT NULL THEN
    NEW.training_load_au = NEW.srpe_score * NEW.training_minutes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_daily_record_values_trigger
BEFORE INSERT OR UPDATE ON sport.daily_records
FOR EACH ROW EXECUTE FUNCTION sport.calculate_daily_record_values();

-- ================================================
-- 7. 疼痛回報表
-- ================================================

CREATE TABLE sport.pain_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sport.players(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  body_part VARCHAR(50) NOT NULL,
  body_position JSONB,
  pain_level INTEGER NOT NULL CHECK (pain_level >= 1 AND pain_level <= 10),
  pain_type VARCHAR(50) CHECK (pain_type IN ('acute', 'chronic', 'fatigue')),
  description TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pain_reports_player_id ON sport.pain_reports(player_id);
CREATE INDEX idx_pain_reports_unresolved ON sport.pain_reports(player_id) WHERE is_resolved = FALSE;

CREATE TRIGGER update_pain_reports_timestamp
BEFORE UPDATE ON sport.pain_reports
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 8. 醫療紀錄表
-- ================================================

CREATE TABLE sport.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sport.players(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reported_by_type VARCHAR(20) NOT NULL CHECK (reported_by_type IN ('coach', 'player')),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis VARCHAR(255),
  doctor_advice TEXT,
  image_urls TEXT[],
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_records_player_id ON sport.medical_records(player_id);
CREATE INDEX idx_medical_records_date ON sport.medical_records(record_date);

CREATE TRIGGER update_medical_records_timestamp
BEFORE UPDATE ON sport.medical_records
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 9. 訓練日誌表 (P2)
-- ================================================

CREATE TABLE sport.training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sport.players(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  training_items JSONB DEFAULT '[]',
  mood_emoji VARCHAR(10),
  reflection TEXT,
  coach_feedback TEXT,
  feedback_coach_id UUID REFERENCES sport.coaches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, log_date)
);

CREATE INDEX idx_training_logs_player_date ON sport.training_logs(player_id, log_date);

CREATE TRIGGER update_training_logs_timestamp
BEFORE UPDATE ON sport.training_logs
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 10. 目標管理表 (P2)
-- ================================================

CREATE TABLE sport.player_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sport.players(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('skill', 'fitness', 'performance')),
  goal_period VARCHAR(20) NOT NULL CHECK (goal_period IN ('monthly', 'quarterly', 'yearly')),
  goal_description TEXT NOT NULL,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_goals_player_id ON sport.player_goals(player_id);
CREATE INDEX idx_player_goals_status ON sport.player_goals(status);

CREATE TRIGGER update_player_goals_timestamp
BEFORE UPDATE ON sport.player_goals
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- ================================================
-- 11. 通知紀錄表
-- ================================================

CREATE TABLE sport.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES sport.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES sport.players(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('risk_alert', 'pain_report', 'medical_update')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_team_id ON sport.notifications(team_id);
CREATE INDEX idx_notifications_unread ON sport.notifications(team_id) WHERE is_read = FALSE;

-- ================================================
-- 12. 高風險預警通知觸發器
-- ================================================

CREATE OR REPLACE FUNCTION sport.create_risk_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_player_name VARCHAR;
  v_team_id UUID;
BEGIN
  IF NEW.risk_level IN ('red', 'black') AND 
     (OLD.risk_level IS NULL OR OLD.risk_level NOT IN ('red', 'black')) THEN
    
    SELECT p.name, p.team_id INTO v_player_name, v_team_id
    FROM sport.players p WHERE p.id = NEW.player_id;
    
    INSERT INTO sport.notifications (team_id, player_id, type, title, message)
    VALUES (
      v_team_id,
      NEW.player_id,
      'risk_alert',
      '⚠️ 高風險警報',
      format('%s 的訓練負荷達到 %s 級風險，ACWR: %s，建議立即關注！', 
             v_player_name, 
             UPPER(NEW.risk_level), 
             COALESCE(NEW.acwr::TEXT, 'N/A'))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_risk_notification_trigger
AFTER INSERT OR UPDATE ON sport.daily_records
FOR EACH ROW EXECUTE FUNCTION sport.create_risk_notification();

-- ================================================
-- 完成訊息
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '✅ sport Schema 建立完成！共建立 10 個資料表。';
END $$;
