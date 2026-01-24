-- Migration: 036_make_player_password_optional_for_info_update
-- Purpose: 調整球員資料更新邏輯，僅在變更密碼時才強制需要舊密碼驗證。

-- 1. 更新 SPORT Schema 核心函數
CREATE OR REPLACE FUNCTION sport.fn_update_player_profile(
    p_player_id UUID, p_old_password TEXT, p_name TEXT, p_jersey_number TEXT, 
    "p_position" TEXT, p_height_cm FLOAT, p_weight_kg FLOAT, p_new_password TEXT,
    p_birth_date DATE DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE v_player RECORD;
BEGIN
    SELECT * INTO v_player FROM sport.players WHERE id = p_player_id;
    IF v_player IS NULL THEN RAISE EXCEPTION '找不到球員'; END IF;
    
    -- 邏輯變更：只有在「打算變更密碼」時，才需要驗證舊密碼
    IF (p_new_password IS NOT NULL AND p_new_password <> '') THEN
        IF v_player.password_hash IS NOT NULL AND (p_old_password IS NULL OR v_player.password_hash <> p_old_password) THEN 
            RAISE EXCEPTION '舊密碼錯誤，無法變更密碼'; 
        END IF;
    END IF;

    UPDATE sport.players SET 
        name = COALESCE(p_name, name),
        jersey_number = COALESCE(p_jersey_number, jersey_number),
        position = COALESCE("p_position", position),
        height_cm = COALESCE(p_height_cm, height_cm),
        weight_kg = COALESCE(p_weight_kg, weight_kg),
        birth_date = COALESCE(p_birth_date, birth_date),
        password_hash = CASE 
            WHEN p_new_password IS NOT NULL AND p_new_password <> '' THEN p_new_password 
            ELSE password_hash 
        END,
        is_claimed = true,
        updated_at = NOW()
    WHERE id = p_player_id RETURNING * INTO v_player;

    RETURN to_jsonb(v_player);
END;
$$ LANGUAGE plpgsql;

-- 2. 更新 PUBLIC Schema 代理函數 (確保支援所有參數)
CREATE OR REPLACE FUNCTION public.update_player_profile(
    player_id UUID, old_password TEXT DEFAULT NULL, name TEXT DEFAULT NULL, jersey_number TEXT DEFAULT NULL, 
    "position" TEXT DEFAULT NULL, height_cm FLOAT DEFAULT NULL, weight_kg FLOAT DEFAULT NULL, 
    new_password TEXT DEFAULT NULL, birth_date DATE DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
    RETURN sport.fn_update_player_profile(
        player_id, old_password, name, jersey_number, 
        "position", height_cm, weight_kg, new_password, birth_date
    );
END;
$$ LANGUAGE plpgsql;

-- 3. 重新授權
GRANT EXECUTE ON FUNCTION public.update_player_profile TO anon, authenticated, service_role;
