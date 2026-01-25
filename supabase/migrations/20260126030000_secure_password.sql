-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Migrate existing plain-text passwords to Bcrypt hash
-- Only targets passwords that don't look like Bcrypt hashes (start with $2)
UPDATE sport.players 
SET password_hash = crypt(password_hash, gen_salt('bf'))
WHERE password_hash NOT LIKE '$2%';

-- 2. Update Login Function to use Secure Verification
DROP FUNCTION IF EXISTS sport.login_player(text, text);
CREATE OR REPLACE FUNCTION sport.login_player(player_code text, password text)
RETURNS SETOF sport.players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM sport.players
    WHERE (short_code = lower(player_code) OR id::text = player_code)
    AND is_active = true
    AND password_hash = crypt(password, password_hash); -- Bcrypt verification
END;
$$;

-- 3. Update Profile Update Function to support Secure Password Change
-- Function has many parameters, simple DROP might be safer if signature changed or return type changed
DROP FUNCTION IF EXISTS sport.update_player_profile(uuid, text, text, text, text, numeric, numeric, text, date);
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
        -- If new_password is provided, hash it. Otherwise keep existing.
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
