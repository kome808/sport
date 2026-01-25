-- ================================================
-- System Admin Functions
-- Purpose: Support /admin dashboard for kome808@gmail.com
-- Date: 2026-01-25
-- ================================================

-- 1. Get Admin Stats (KPIs & Charts)
-- 修正：移除 CTE 改用直接子查詢，避免 Ambiguous Column 錯誤
CREATE OR REPLACE FUNCTION sport.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = sport, public
AS $$
DECLARE
  v_user_email VARCHAR;
  v_stats JSONB;
BEGIN
  -- Strict Access Control
  SELECT u.email INTO v_user_email 
  FROM auth.users u 
  WHERE u.id = auth.uid();
  
  IF v_user_email IS NULL OR v_user_email <> 'kome808@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  SELECT jsonb_build_object(
    'kpi', jsonb_build_object(
      'total_teams', (SELECT COUNT(*) FROM sport.teams),
      'total_players', (SELECT COUNT(*) FROM sport.players),
      'daily_active_users', (SELECT COUNT(*) FROM sport.daily_records dr WHERE dr.created_at > NOW() - INTERVAL '24 hours')
    ),
    'growth_chart', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', to_char(date_trunc('month', d), 'YYYY-MM'),
        'teams', (SELECT COUNT(*) FROM sport.teams t WHERE date_trunc('month', t.created_at) = date_trunc('month', d)),
        'players', (SELECT COUNT(*) FROM sport.players p WHERE date_trunc('month', p.created_at) = date_trunc('month', d))
      ))
      FROM generate_series(
        date_trunc('month', NOW() - INTERVAL '5 months'),
        date_trunc('month', NOW()),
        '1 month'::interval
      ) d
    ),
    'activity_chart', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(d, 'MM-DD'),
        'records', (SELECT COUNT(*) FROM sport.daily_records dr WHERE date_trunc('day', dr.created_at) = date_trunc('day', d))
      ))
      FROM generate_series(
        date_trunc('day', NOW() - INTERVAL '29 days'),
        date_trunc('day', NOW()),
        '1 day'::interval
      ) d
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- 2. Get Admin Team List (With Last Active Date)
-- 修正：Coach Email 必須匹配 varchar(255)，使用 LEFT JOIN
CREATE OR REPLACE FUNCTION sport.get_admin_teams()
RETURNS TABLE(
  team_id uuid,
  name character varying(100),
  slug character varying(50),
  coach_email character varying(255),
  player_count bigint,
  created_at timestamp with time zone,
  last_active_at timestamp with time zone,
  status text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = sport, public AS $$
DECLARE
  v_user_email VARCHAR;
BEGIN
  -- Strict Access Control
  SELECT u.email INTO v_user_email 
  FROM auth.users u 
  WHERE u.id = auth.uid();
  
  IF v_user_email IS NULL OR v_user_email <> 'kome808@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name,
    t.slug,
    c.email AS coach_email,
    (SELECT COUNT(*) FROM sport.players p WHERE p.team_id = t.id)::bigint AS player_count,
    t.created_at,
    MAX(dr.created_at) AS last_active_at,
    CASE 
      WHEN MAX(dr.created_at) > NOW() - INTERVAL '7 days' THEN 'active'::text
      WHEN MAX(dr.created_at) > NOW() - INTERVAL '30 days' THEN 'normal'::text
      ELSE 'idle'::text
    END AS status
  FROM sport.teams t
  LEFT JOIN sport.coaches c ON t.coach_id = c.id
  LEFT JOIN sport.players p ON t.id = p.team_id
  LEFT JOIN sport.daily_records dr ON p.id = dr.player_id
  GROUP BY t.id, t.name, t.slug, c.email, t.created_at
  ORDER BY last_active_at DESC NULLS LAST;
END;
$$;

-- 3. Hard Delete Team (Admin Only)
CREATE OR REPLACE FUNCTION sport.admin_delete_team(p_team_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public
AS $$
DECLARE
  v_user_email VARCHAR;
BEGIN
  -- Strict Access Control
  SELECT u.email INTO v_user_email 
  FROM auth.users u 
  WHERE u.id = auth.uid();
  
  IF v_user_email IS NULL OR v_user_email <> 'kome808@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  -- Cascade delete handles everything due to foreign constraints
  DELETE FROM sport.teams WHERE id = p_team_id;
END;
$$;
