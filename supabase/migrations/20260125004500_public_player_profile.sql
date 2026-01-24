-- ================================================
-- 解決球員端無法讀取資料的問題
-- 日期: 2026-01-25
-- 說明：建立公開的球員資料查詢 RPC，繞過 RLS
-- ================================================

-- 1. 核心查詢函數
CREATE OR REPLACE FUNCTION sport.fn_get_player_public_profile(p_code TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    jersey_number TEXT,
    team_id UUID,
    short_code TEXT,
    position TEXT,
    height_cm FLOAT,
    weight_kg FLOAT,
    birth_date DATE,
    avatar_url TEXT
)
SECURITY DEFINER
SET search_path = public, sport
AS $$
DECLARE 
    v_is_short_code BOOLEAN;
BEGIN
    -- 簡單判斷是否為 Short Code
    v_is_short_code := length(p_code) <= 10 AND position('-' in p_code) = 0;

    RETURN QUERY
    SELECT 
        p.id, 
        p.name::TEXT, 
        p.jersey_number::TEXT, 
        p.team_id, 
        p.short_code::TEXT,
        p.position::TEXT,
        p.height_cm::FLOAT,
        p.weight_kg::FLOAT,
        p.birth_date,
        p.avatar_url::TEXT
    FROM sport.players p
    WHERE p.is_active = true 
      AND (
          (v_is_short_code AND p.short_code = lower(p_code)) 
          OR 
          (NOT v_is_short_code AND p.id = p_code::uuid)
      )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 2. Proxy
CREATE OR REPLACE FUNCTION public.get_player_public_profile(p_code TEXT)
RETURNS TABLE (
    id UUID, name TEXT, jersey_number TEXT, team_id UUID, short_code TEXT, 
    position TEXT, height_cm FLOAT, weight_kg FLOAT, birth_date DATE, avatar_url TEXT
)
AS $$
BEGIN RETURN QUERY SELECT * FROM sport.fn_get_player_public_profile(p_code); END;
$$ LANGUAGE plpgsql;

-- 3. 授權
GRANT EXECUTE ON FUNCTION public.get_player_public_profile(TEXT) TO anon, authenticated, service_role;
