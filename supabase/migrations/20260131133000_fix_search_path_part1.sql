-- Migration: Fix Search Path (Part 1 - System & Auth)
-- Date: 2026-01-31
-- Description: Explicitly set search_path to 'sport, public, extensions, pg_catalog' for system and auth functions.

-- 1. sport.update_updated_at
CREATE OR REPLACE FUNCTION sport.update_updated_at()
RETURNS TRIGGER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. sport.generate_short_code
CREATE OR REPLACE FUNCTION sport.generate_short_code(length INTEGER DEFAULT 3)
RETURNS TEXT 
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  chars TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. sport.auto_generate_short_code
CREATE OR REPLACE FUNCTION sport.auto_generate_short_code()
RETURNS TRIGGER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
  new_code TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  IF NEW.short_code IS NULL THEN
    LOOP
      new_code := sport.generate_short_code(3);
      attempt := attempt + 1;
      
      IF NOT EXISTS (SELECT 1 FROM sport.players WHERE short_code = new_code) THEN
        NEW.short_code := new_code;
        EXIT;
      END IF;
      
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION '無法產生唯一短代碼';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. sport.get_current_coach_id
CREATE OR REPLACE FUNCTION sport.get_current_coach_id()
RETURNS UUID 
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
  RETURN (
    SELECT id FROM sport.coaches 
    WHERE email = auth.jwt() ->> 'email'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 5. sport.get_my_team_ids
CREATE OR REPLACE FUNCTION sport.get_my_team_ids()
RETURNS SETOF UUID 
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT tm.team_id 
  FROM sport.team_members tm
  JOIN sport.coaches c ON tm.coach_id = c.id
  WHERE c.email = auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql;

-- 6. sport.fn_validate_invitation_code (Player)
CREATE OR REPLACE FUNCTION sport.fn_validate_invitation_code(code TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT, sport_type TEXT, is_invitation_enabled BOOLEAN) 
SECURITY DEFINER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name::TEXT, t.slug::TEXT, t.sport_type::TEXT, t.is_invitation_enabled
    FROM sport.teams t WHERE t.invitation_code = code LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. sport.fn_login_player (Legacy? Kept for safety)
CREATE OR REPLACE FUNCTION sport.fn_login_player(player_code TEXT, password TEXT)
RETURNS JSONB SECURITY DEFINER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE v_player RECORD; v_is_short_code BOOLEAN;
BEGIN
    v_is_short_code := length(player_code) <= 10 AND position('-' in player_code) = 0;
    
    SELECT * INTO v_player FROM sport.players 
    WHERE is_active = true 
    AND ((v_is_short_code AND short_code = lower(player_code)) OR (NOT v_is_short_code AND id = player_code::uuid)) 
    LIMIT 1;

    IF v_player IS NULL THEN RAISE EXCEPTION '找不到球員資料'; END IF;
    -- Note: This is the old version with plain text/simple hash comparison. 
    -- If using bcrypy, this logic might fail on new passwords.
    -- But we just add search_path here.
    IF v_player.password_hash IS NULL OR v_player.password_hash <> password THEN RAISE EXCEPTION '密碼錯誤'; END IF;
    RETURN to_jsonb(v_player);
END;
$$ LANGUAGE plpgsql;

-- 8. sport.login_player (Secure version)
CREATE OR REPLACE FUNCTION sport.login_player(player_code text, password text)
RETURNS SETOF sport.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM sport.players
    WHERE (short_code = lower(player_code) OR id::text = player_code)
    AND is_active = true
    AND password_hash = crypt(password, password_hash);
END;
$$;

-- 9. sport.fn_join_team
CREATE OR REPLACE FUNCTION sport.fn_join_team(
    invitation_code TEXT, mode TEXT, p_name TEXT, p_jersey_number TEXT, p_password TEXT, p_player_id UUID DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE v_team_id UUID; v_new_player RECORD;
BEGIN
    SELECT id INTO v_team_id FROM sport.teams WHERE sport.teams.invitation_code = fn_join_team.invitation_code;
    IF v_team_id IS NULL THEN RAISE EXCEPTION '無效的通行碼'; END IF;

    IF mode = 'new' THEN
        INSERT INTO sport.players (team_id, name, jersey_number, password_hash, is_active, is_claimed)
        VALUES (v_team_id, p_name, p_jersey_number, p_password, true, true) RETURNING * INTO v_new_player;
    ELSIF mode = 'claim' THEN
        UPDATE sport.players SET password_hash = p_password, is_claimed = true, updated_at = NOW()
        WHERE id = p_player_id AND team_id = v_team_id RETURNING * INTO v_new_player;
        IF v_new_player IS NULL THEN RAISE EXCEPTION '認領失敗：找不到球員或權限不足'; END IF;
    ELSE RAISE EXCEPTION '無效的操作模式'; END IF;
    RETURN to_jsonb(v_new_player);
END;
$$ LANGUAGE plpgsql;

-- 10. sport.fn_get_team_players_for_claim
CREATE OR REPLACE FUNCTION sport.fn_get_team_players_for_claim(code TEXT)
RETURNS TABLE (id UUID, name TEXT, jersey_number TEXT, "position" TEXT) 
SECURITY DEFINER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE v_team_id UUID;
BEGIN
    SELECT t.id INTO v_team_id FROM sport.teams t WHERE t.invitation_code = code AND t.is_invitation_enabled = true;
    IF v_team_id IS NULL THEN RETURN; END IF;
    RETURN QUERY
    SELECT p.id, p.name::TEXT, p.jersey_number::TEXT, p.position::TEXT
    FROM sport.players p
    WHERE p.team_id = v_team_id AND p.is_active = true AND p.is_claimed = false
    ORDER BY p.jersey_number ASC;
END;
$$ LANGUAGE plpgsql;

-- 11. sport.update_player_profile (Secure Version)
CREATE OR REPLACE FUNCTION sport.update_player_profile(
    p_player_id uuid,
    p_old_password text,
    p_name text,
    p_jersey_number text,
    p_position text,
    p_height_cm numeric,
    p_weight_kg numeric,
    p_new_password text DEFAULT NULL,
    p_birth_date date DEFAULT NULL
)
RETURNS SETOF sport.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
    current_password_hash text;
BEGIN
    -- 1. Verify Old Password
    SELECT password_hash INTO current_password_hash
    FROM sport.players
    WHERE id = p_player_id;

    IF current_password_hash IS NULL OR current_password_hash != crypt(p_old_password, current_password_hash) THEN
        RAISE EXCEPTION '舊密碼不正確';
    END IF;

    -- 2. Update Data
    RETURN QUERY
    UPDATE sport.players
    SET 
        name = COALESCE(p_name, sport.players.name),
        jersey_number = COALESCE(p_jersey_number, sport.players.jersey_number),
        position = COALESCE(p_position, sport.players.position),
        height_cm = COALESCE(p_height_cm, sport.players.height_cm),
        weight_kg = COALESCE(p_weight_kg, sport.players.weight_kg),
        birth_date = COALESCE(p_birth_date, sport.players.birth_date),
        password_hash = CASE 
            WHEN p_new_password IS NOT NULL AND length(p_new_password) > 0 
            THEN crypt(p_new_password, gen_salt('bf')) 
            ELSE password_hash 
        END,
        updated_at = now()
    WHERE id = p_player_id
    RETURNING *;
END;
$$;

-- 12. sport.is_coach_of_player
CREATE OR REPLACE FUNCTION sport.is_coach_of_player(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = sport, public, extensions, pg_catalog
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

-- 13. sport.fn_get_team_coaches
CREATE OR REPLACE FUNCTION sport.fn_get_team_coaches(p_team_id UUID)
RETURNS TABLE (
    coach_id UUID, 
    name TEXT, 
    email TEXT, 
    avatar_url TEXT, 
    role TEXT,
    joined_at TIMESTAMPTZ
) 
SECURITY DEFINER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name::TEXT, c.email::TEXT, c.avatar_url::TEXT, tm.role::TEXT, tm.joined_at
    FROM sport.team_members tm
    JOIN sport.coaches c ON tm.coach_id = c.id
    WHERE tm.team_id = p_team_id
    ORDER BY tm.joined_at;
END;
$$ LANGUAGE plpgsql;

-- 14. sport.fn_remove_team_coach
CREATE OR REPLACE FUNCTION sport.fn_remove_team_coach(p_team_id UUID, p_target_coach_id UUID)
RETURNS BOOLEAN SECURITY DEFINER 
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE 
    v_current_coach_id UUID;
    v_current_role TEXT;
    v_target_role TEXT;
BEGIN
    -- 取得當前操作者
    v_current_coach_id := (SELECT id FROM sport.coaches WHERE email = auth.jwt() ->> 'email' LIMIT 1);
    
    -- 檢查當前操作者權限
    SELECT role INTO v_current_role FROM sport.team_members 
    WHERE team_id = p_team_id AND coach_id = v_current_coach_id;
    
    IF v_current_role IS NULL THEN RAISE EXCEPTION '權限不足'; END IF;

    -- 檢查目標角色
    SELECT role INTO v_target_role FROM sport.team_members
    WHERE team_id = p_team_id AND coach_id = p_target_coach_id;

    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION '無法移除擁有者';
    END IF;

    -- 執行移除
    DELETE FROM sport.team_members
    WHERE team_id = p_team_id AND coach_id = p_target_coach_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Part 1 Migrations Applied (System & Auth)';
END $$;
