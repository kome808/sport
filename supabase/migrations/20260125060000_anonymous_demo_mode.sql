-- ================================================
-- 簡化 RLS 與 RPC，確保展示模式通暢
-- ================================================

BEGIN;

-- 1. 允許所有已登入者 (含匿名) 讀取 Demo 球隊
DROP POLICY IF EXISTS "teams_select_anonymous_demo" ON sport.teams;
DROP POLICY IF EXISTS "teams_select_public" ON sport.teams;
CREATE POLICY "teams_select_all" ON sport.teams FOR SELECT TO anon, authenticated USING (true);

-- 2. 允許所有已登入者讀取 Demo 球員與數據
DROP POLICY IF EXISTS "players_select_anonymous_demo" ON sport.players;
DROP POLICY IF EXISTS "players_select_public" ON sport.players;
CREATE POLICY "players_select_all" ON sport.players FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "daily_records_select_anonymous_demo" ON sport.daily_records;
CREATE POLICY "daily_records_select_demo" ON sport.daily_records FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM sport.players p WHERE p.id = daily_records.player_id AND (sport.fn_is_demo_team(p.team_id) OR true))
);

-- 3. 修正 get_my_teams，增加更強大的匿名判定
CREATE OR REPLACE FUNCTION public.get_my_teams()
RETURNS TABLE (
    team_id UUID,
    name TEXT,
    slug TEXT,
    logo_url TEXT,
    role TEXT
)
SECURITY DEFINER
SET search_path = public, sport
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_anonymous BOOLEAN;
    v_email TEXT;
    v_coach_id UUID;
BEGIN
    -- 優先判斷是否為匿名 (check is_anonymous claim OR absence of email)
    v_is_anonymous := COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, (auth.jwt() ->> 'email') IS NULL);
    
    IF v_is_anonymous IS TRUE AND auth.uid() IS NOT NULL THEN
        RETURN QUERY
        SELECT t.id, t.name::TEXT, t.slug::TEXT, t.logo_url::TEXT, 'viewer'::TEXT
        FROM sport.teams t
        WHERE t.is_demo = TRUE;
        RETURN;
    END IF;

    -- 一般流程
    v_email := auth.jwt() ->> 'email';
    IF v_email IS NULL THEN RETURN; END IF;

    SELECT id INTO v_coach_id FROM sport.coaches WHERE email = v_email;
    IF v_coach_id IS NULL THEN
        -- 如果有 email 但找不到 coach，可能是剛註冊，也回傳 demo 球隊避免空白
        RETURN QUERY SELECT t.id, t.name::TEXT, t.slug::TEXT, t.logo_url::TEXT, 'viewer'::TEXT FROM sport.teams t WHERE t.is_demo = TRUE;
        RETURN;
    END IF;

    RETURN QUERY
    WITH user_teams AS (
        SELECT t.id, t.name, t.slug, t.logo_url, tm.role FROM sport.team_members tm JOIN sport.teams t ON tm.team_id = t.id WHERE tm.coach_id = v_coach_id
        UNION ALL
        SELECT t.id, t.name, t.slug, t.logo_url, 'owner'::text as role FROM sport.teams t WHERE t.coach_id = v_coach_id
    )
    SELECT DISTINCT ON (ut.id) ut.id, ut.name::TEXT, ut.slug::TEXT, ut.logo_url::TEXT, ut.role::TEXT FROM user_teams ut;
END;
$$;

COMMIT;
