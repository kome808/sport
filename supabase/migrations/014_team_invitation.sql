-- Migration: 014_team_invitation_and_security
-- Purpose: 整合所有代碼，修復所有語法錯誤與權限遺失問題
-- Last Updated: 2026-01-14 (FINAL CONSOLIDATED VERSION)

-- ========================================================
-- 1. 結構變更與欄位確保
-- ========================================================
ALTER TABLE sport.teams ADD COLUMN IF NOT EXISTS invitation_code VARCHAR(20);
ALTER TABLE sport.teams ADD COLUMN IF NOT EXISTS is_invitation_enabled BOOLEAN DEFAULT true;
UPDATE sport.teams SET is_invitation_enabled = true WHERE is_invitation_enabled IS NULL;

ALTER TABLE sport.players ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE sport.players ADD COLUMN IF NOT EXISTS "position" TEXT; -- Quote it just in case
ALTER TABLE sport.players ADD COLUMN IF NOT EXISTS height_cm FLOAT;
ALTER TABLE sport.players ADD COLUMN IF NOT EXISTS weight_kg FLOAT;
ALTER TABLE sport.players ALTER COLUMN password_hash DROP NOT NULL;

-- ========================================================
-- 2. 資料修復
-- ========================================================
-- 清除 Placeholder 密碼，讓球員回歸「可認領」狀態
UPDATE sport.players 
SET password_hash = NULL, is_claimed = false 
WHERE password_hash = '$2a$10$abcdefghijklmnopqrstuv' OR password_hash = '';

-- 真正有密碼的標記為「已認領」
UPDATE sport.players SET is_claimed = true WHERE password_hash IS NOT NULL AND password_hash <> '';
UPDATE sport.players SET is_claimed = false WHERE password_hash IS NULL;

-- ========================================================
-- 3. 清理所有舊版函數 (避免參數型別或名稱衝突)
-- ========================================================
DROP FUNCTION IF EXISTS public.validate_invitation_code(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.login_player(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.join_team(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_players_for_claim(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_roster_public(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT, FLOAT, FLOAT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;

DROP FUNCTION IF EXISTS sport.fn_validate_invitation_code(TEXT) CASCADE;
DROP FUNCTION IF EXISTS sport.fn_login_player(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS sport.fn_join_team(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS sport.fn_get_team_players_for_claim(TEXT) CASCADE;
DROP FUNCTION IF EXISTS sport.fn_get_team_roster_public(TEXT) CASCADE;
DROP FUNCTION IF EXISTS sport.fn_update_player_profile(UUID, TEXT, TEXT, TEXT, TEXT, FLOAT, FLOAT, TEXT) CASCADE;

-- ========================================================
-- 4. [SPORT Schema] 核心邏輯
-- ========================================================

-- A. 驗證通行碼
CREATE OR REPLACE FUNCTION sport.fn_validate_invitation_code(code TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT, sport_type TEXT, is_invitation_enabled BOOLEAN) 
SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name::TEXT, t.slug::TEXT, t.sport_type::TEXT, t.is_invitation_enabled
    FROM sport.teams t WHERE t.invitation_code = code LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- B. 球員登入
CREATE OR REPLACE FUNCTION sport.fn_login_player(player_code TEXT, password TEXT)
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE v_player RECORD; v_is_short_code BOOLEAN;
BEGIN
    -- 注意：這裡的 position 是 SQL 函數，不加引號
    v_is_short_code := length(player_code) <= 10 AND position('-' in player_code) = 0;
    
    SELECT * INTO v_player FROM sport.players 
    WHERE is_active = true 
      AND ((v_is_short_code AND short_code = lower(player_code)) OR (NOT v_is_short_code AND id = player_code::uuid)) 
    LIMIT 1;

    IF v_player IS NULL THEN RAISE EXCEPTION '找不到球員資料'; END IF;
    IF v_player.password_hash IS NULL OR v_player.password_hash <> password THEN RAISE EXCEPTION '密碼錯誤'; END IF;
    RETURN to_jsonb(v_player);
END;
$$ LANGUAGE plpgsql;

-- C. 加入球隊 (認領或新建)
CREATE OR REPLACE FUNCTION sport.fn_join_team(
    invitation_code TEXT, mode TEXT, p_name TEXT, p_jersey_number TEXT, p_password TEXT, p_player_id UUID DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER AS $$
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

-- D. 取得待認領名單
CREATE OR REPLACE FUNCTION sport.fn_get_team_players_for_claim(code TEXT)
RETURNS TABLE (id UUID, name TEXT, jersey_number TEXT, "position" TEXT) 
SECURITY DEFINER AS $$
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

-- E. 取得登入大廳名單
CREATE OR REPLACE FUNCTION sport.fn_get_team_roster_public(p_slug TEXT)
RETURNS TABLE (id UUID, name TEXT, jersey_number TEXT, short_code TEXT, avatar_url TEXT, "position" TEXT, is_claimed BOOLEAN) 
SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name::TEXT, p.jersey_number::TEXT, p.short_code::TEXT, p.avatar_url::TEXT, p.position::TEXT, p.is_claimed
    FROM sport.players p
    JOIN sport.teams t ON p.team_id = t.id
    WHERE t.slug = p_slug AND p.is_active = true AND p.is_claimed = true
    ORDER BY p.jersey_number ASC;
END;
$$ LANGUAGE plpgsql;

-- F. 更新球員個人資料
CREATE OR REPLACE FUNCTION sport.fn_update_player_profile(
    p_player_id UUID, p_old_password TEXT, p_name TEXT, p_jersey_number TEXT, 
    "p_position" TEXT, p_height_cm FLOAT, p_weight_kg FLOAT, p_new_password TEXT
)
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE v_player RECORD;
BEGIN
    SELECT * INTO v_player FROM sport.players WHERE id = p_player_id;
    IF v_player IS NULL THEN RAISE EXCEPTION '找不到球員'; END IF;
    -- 若已有密碼，則需驗證舊密碼
    IF v_player.password_hash IS NOT NULL AND v_player.password_hash <> p_old_password THEN 
        RAISE EXCEPTION '舊密碼錯誤'; 
    END IF;

    UPDATE sport.players SET 
        name = COALESCE(p_name, name),
        jersey_number = COALESCE(p_jersey_number, jersey_number),
        position = COALESCE("p_position", position),
        height_cm = COALESCE(p_height_cm, height_cm),
        weight_kg = COALESCE(p_weight_kg, weight_kg),
        password_hash = CASE WHEN p_new_password IS NOT NULL AND p_new_password <> '' THEN p_new_password ELSE password_hash END,
        is_claimed = true,
        updated_at = NOW()
    WHERE id = p_player_id RETURNING * INTO v_player;

    RETURN to_jsonb(v_player);
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- 5. [PUBLIC Schema] 代理函數 (供前端呼叫)
-- ========================================================

CREATE OR REPLACE FUNCTION public.validate_invitation_code(code TEXT) 
RETURNS TABLE (team_id UUID, team_name TEXT, team_slug TEXT, sport_type TEXT, is_invitation_enabled BOOLEAN) AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_validate_invitation_code(code); END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.login_player(player_code TEXT, password TEXT) 
RETURNS JSONB AS $$
BEGIN RETURN sport.fn_login_player(player_code, password); END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.join_team(
    invitation_code TEXT, mode TEXT, name TEXT, jersey_number TEXT, password TEXT, player_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN RETURN sport.fn_join_team(invitation_code, mode, name, jersey_number, password, player_id); END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_team_players_for_claim(code TEXT)
RETURNS TABLE (id UUID, name TEXT, jersey_number TEXT, "position" TEXT) AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_get_team_players_for_claim(code); END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_team_roster_public(slug TEXT)
RETURNS TABLE (id UUID, name TEXT, jersey_number TEXT, short_code TEXT, avatar_url TEXT, "position" TEXT, is_claimed BOOLEAN) AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_get_team_roster_public(slug); END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_player_profile(
    player_id UUID, old_password TEXT, name TEXT, jersey_number TEXT, 
    "position" TEXT DEFAULT NULL, height_cm FLOAT DEFAULT NULL, weight_kg FLOAT DEFAULT NULL, new_password TEXT DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
    RETURN sport.fn_update_player_profile(player_id, old_password, name, jersey_number, "position", height_cm, weight_kg, new_password);
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- 6. 權限授權
-- ========================================================
GRANT EXECUTE ON FUNCTION public.validate_invitation_code(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.login_player(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_team TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_players_for_claim(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_roster_public(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_player_profile TO anon, authenticated, service_role;
