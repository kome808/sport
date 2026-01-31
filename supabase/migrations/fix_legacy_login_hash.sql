-- fix_legacy_login_hash.sql
CREATE OR REPLACE FUNCTION sport.fn_login_player(player_code TEXT, password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

    -- FIX: 支援 Hash 比對
    IF (v_player.password_hash LIKE '$2%' AND v_player.password_hash = crypt(password, v_player.password_hash)) 
       OR (v_player.password_hash = password) THEN
        -- 驗證成功
        RETURN to_jsonb(v_player);
    ELSE
        RAISE EXCEPTION '密碼錯誤'; 
    END IF;
END;
$$;
