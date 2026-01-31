-- add_admin_team_viewer_rpcs.sql

-- Drop existing sport schema functions to avoid confusion
DROP FUNCTION IF EXISTS sport.get_admin_team_details(UUID);
DROP FUNCTION IF EXISTS sport.get_admin_team_players(UUID);

-- 1. 獲取單一球隊詳情 (Move to public schema for RPC access)
CREATE OR REPLACE FUNCTION public.get_admin_team_details(p_team_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, 
        t.name::TEXT, 
        t.slug::TEXT
    FROM sport.teams t
    WHERE t.id = p_team_id;
END;
$$;

-- 2. 獲取球隊球員列表 (Move to public schema for RPC access)
CREATE OR REPLACE FUNCTION public.get_admin_team_players(p_team_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    jersey_number TEXT,
    player_position TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    short_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name::TEXT, 
        p.jersey_number::TEXT, 
        p.position::TEXT AS player_position, 
        p.height_cm, 
        p.weight_kg, 
        p.is_active, 
        p.created_at,
        p.short_code::TEXT
    FROM sport.players p
    WHERE p.team_id = p_team_id
    ORDER BY 
        -- 嘗試轉成數字排序，非數字放最後
        CASE WHEN p.jersey_number ~ '^[0-9]+$' THEN p.jersey_number::INTEGER ELSE 9999 END ASC,
        p.created_at DESC;
END;
$$;
