-- restore_shohoku_data.sql
-- 1. 確保球隊存在
INSERT INTO sport.teams (name, slug, sport_type, invitation_code)
VALUES ('湘北籃球隊', 'shohoku-basketball', 'basketball', 'SHOHOKU123')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
    v_team_id UUID;
    v_player_id UUID;
BEGIN
    SELECT id INTO v_team_id FROM sport.teams WHERE slug = 'shohoku-basketball';

    -- 2. 確保球員存在 (使用 bcrypt 密碼 'demo123')
    -- 宮城 (後衛/隊長)
    INSERT INTO sport.players (team_id, name, jersey_number, position, role, password_hash)
    VALUES (v_team_id, '宮城 良田', '7', 'PG', 'player', crypt('demo123', gen_salt('bf')))
    ON CONFLICT (team_id, jersey_number) DO UPDATE SET is_active = true;

    -- 三井 (SG)
    INSERT INTO sport.players (team_id, name, jersey_number, position, role, password_hash)
    VALUES (v_team_id, '三井 壽', '14', 'SG', 'player', crypt('demo123', gen_salt('bf')))
    ON CONFLICT (team_id, jersey_number) DO UPDATE SET is_active = true;

    -- 流川 (SF)
    INSERT INTO sport.players (team_id, name, jersey_number, position, role, password_hash)
    VALUES (v_team_id, '流川 楓', '11', 'SF', 'player', crypt('demo123', gen_salt('bf')))
    ON CONFLICT (team_id, jersey_number) DO UPDATE SET is_active = true;

    -- 櫻木 (PF)
    INSERT INTO sport.players (team_id, name, jersey_number, position, role, password_hash)
    VALUES (v_team_id, '櫻木 花道', '10', 'PF', 'player', crypt('demo123', gen_salt('bf')))
    ON CONFLICT (team_id, jersey_number) DO UPDATE SET is_active = true;

    -- 赤木 (C)
    INSERT INTO sport.players (team_id, name, jersey_number, position, role, password_hash)
    VALUES (v_team_id, '赤木 剛憲', '4', 'C', 'player', crypt('demo123', gen_salt('bf')))
    ON CONFLICT (team_id, jersey_number) DO UPDATE SET is_active = true;

    -- 3. 生成數據 (呼叫已修正 v_date 的函式)
    PERFORM sport.ensure_demo_data('shohoku-basketball', 30);
    
    RAISE NOTICE '✅ 湘北隊資料已修復，並生成 30 天數據';
END $$;
