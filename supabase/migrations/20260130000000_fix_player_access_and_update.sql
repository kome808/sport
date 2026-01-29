-- ================================================
-- Fix Player Portal Access & Update Logic
-- Date: 2026-01-29
-- ================================================

-- 1. Fix get_player_fatigue_metrics Access Denied (P0001)
-- Remove the strict auth.uid() check to allow Player Portal (anonymous) access
CREATE OR REPLACE FUNCTION sport.get_player_fatigue_metrics(
  p_player_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_acwr_data RECORD;
  v_rhr_data RECORD;
  v_wellness_data RECORD;
  v_load_data RECORD;
  v_daily_load INTEGER;
  v_wellness_detail JSONB;
  v_result JSONB;
BEGIN
  -- Removed strict auth.uid() check to allow Player Portal access
  
  SELECT * INTO v_acwr_data FROM sport.calculate_ewma_acwr(p_player_id, p_date);
  SELECT * INTO v_rhr_data FROM sport.calculate_rhr_baseline(p_player_id, p_date);
  SELECT * INTO v_wellness_data FROM sport.calculate_wellness_zscore(p_player_id, p_date);
  
  SELECT jsonb_object_agg(key, value) INTO v_wellness_detail
  FROM (
    SELECT 'sleep' as key, sleep_quality as value FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'stress', stress_level FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'fatigue', fatigue_level FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'soreness', muscle_soreness FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
    UNION ALL SELECT 'mood', mood FROM sport.daily_records WHERE player_id = p_player_id AND record_date = p_date
  ) t;

  SELECT training_load_au INTO v_daily_load
  FROM sport.daily_records
  WHERE player_id = p_player_id AND record_date = p_date;
  
  SELECT * INTO v_load_data FROM sport.calculate_weekly_load_change(p_player_id, p_date);

  v_result := jsonb_build_object(
    'acwr', jsonb_build_object(
      'acwr', v_acwr_data.acwr,
      'chronic_load', v_acwr_data.chronic_load,
      'acute_load', v_acwr_data.acute_load,
      'risk_level', v_acwr_data.risk_level
    ),
    'rhr', jsonb_build_object(
      'current_rhr', v_rhr_data.current_rhr,
      'baseline_rhr', v_rhr_data.baseline_rhr,
      'difference', v_rhr_data.difference,
      'status', v_rhr_data.status
    ),
    'wellness', jsonb_build_object(
      'total', v_wellness_data.total_score,
      'z_score', v_wellness_data.z_score,
      'avg_score', v_wellness_data.avg_score,
      'status', v_wellness_data.status,
      'items', COALESCE(v_wellness_detail, '{}'::jsonb)
    ),
    'srpe', jsonb_build_object(
      'load_au', COALESCE(v_daily_load, 0),
      'weekly_load', v_load_data.current_week_load,
      'pct_change', v_load_data.pct_change,
      'abs_change', v_load_data.abs_change,
      'status', v_load_data.status
    )
  );

  RETURN v_result;
END;
$$;

-- 2. Consolidate and Fix update_player_profile
-- Drop all possible existing variations to clean up conflicts
DROP FUNCTION IF EXISTS public.update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT, FLOAT, FLOAT, TEXT, DATE);
DROP FUNCTION IF EXISTS public.update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, DATE);
DROP FUNCTION IF EXISTS sport.fn_update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT, FLOAT, FLOAT, TEXT, DATE);
DROP FUNCTION IF EXISTS sport.fn_update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, DATE);
DROP FUNCTION IF EXISTS sport.update_player_profile(uuid, text, text, text, text, numeric, numeric, text, date);

-- Recreate sport.update_player_profile with correct Bcrypt logic and optional password
CREATE OR REPLACE FUNCTION sport.update_player_profile(
    p_player_id uuid,
    p_old_password text DEFAULT NULL,
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
    current_password_hash text;
    v_player sport.players%ROWTYPE;
BEGIN
    -- Get current player data
    SELECT * INTO v_player FROM sport.players WHERE id = p_player_id;
    
    IF v_player IS NULL THEN
        RAISE EXCEPTION 'Player not found';
    END IF;

    current_password_hash := v_player.password_hash;

    -- Password Verification Logic
    -- If setting a new password, MUST verify old password (unless old password is NULL? No, enforce security)
    -- Exception: If user is authenticated as Coach/Admin (auth.uid() is not null), maybe allow bypass?
    -- For now, follow the requirement: strict verification if changing password.
    
    IF (p_new_password IS NOT NULL AND length(p_new_password) > 0) THEN
        -- Verify old password
        IF current_password_hash IS NOT NULL AND (p_old_password IS NULL OR current_password_hash != crypt(p_old_password, current_password_hash)) THEN
             RAISE EXCEPTION '舊密碼錯誤';
        END IF;
    END IF;

    -- Update Data
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
        updated_at = now()
    WHERE id = p_player_id
    RETURNING *;
END;
$$;

-- Expose to public (via wrapper or direct grant, wrapper is safer for naming consistency if needed, but direct is fine)
-- Use a public wrapper to match what the frontend might be calling if it relies on public schema search path
CREATE OR REPLACE FUNCTION public.update_player_profile(
    player_id uuid,  -- parameter names match what Supabase Studio/Client might infer if using named params
    old_password text DEFAULT NULL,
    name text DEFAULT NULL,
    jersey_number text DEFAULT NULL,
    "position" text DEFAULT NULL,
    height_cm numeric DEFAULT NULL,
    weight_kg numeric DEFAULT NULL,
    new_password text DEFAULT NULL,
    birth_date date DEFAULT NULL
)
RETURNS SETOF sport.players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM sport.update_player_profile(
        player_id, old_password, name, jersey_number, "position", height_cm, weight_kg, new_password, birth_date
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sport.get_player_fatigue_metrics(UUID, DATE) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION sport.update_player_profile(uuid, text, text, text, text, numeric, numeric, text, date) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.update_player_profile(uuid, text, text, text, text, numeric, numeric, text, date) TO authenticated, service_role, anon;
