-- ========================================================
-- 修正步驟 3: 修正 fn_join_team 密碼儲存為 bcrypt 格式
-- ========================================================
-- 優先級: 🔴 嚴重 (安全性問題)
-- 風險: 🟡 中 (需確認無明文密碼)
-- 影響: 新球員註冊與認領功能
-- 可回滾: ✅ 是
-- ========================================================

-- ==================== 第一步：安全檢查 ====================
-- 檢查是否有明文密碼（bcrypt 格式以 $2a$ 或 $2b$ 開頭）
SELECT 
    COUNT(*) as total_players,
    COUNT(CASE WHEN password_hash NOT LIKE '$2%' AND password_hash IS NOT NULL THEN 1 END) as plaintext_passwords
FROM sport.players
WHERE password_hash IS NOT NULL;

-- ⚠️ 若 plaintext_passwords > 0，表示有明文密碼，需先進行資料遷移！

-- ==================== 第二步：檢查 pgcrypto extension ====================
SELECT 
    extname, 
    nspname as schema_name 
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pgcrypto';

-- 若未安裝，請先執行：
-- CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- ==================== 第三步：執行修正 ====================
-- FIX: 保持原始參數名稱以避免 CREATE OR REPLACE 錯誤
CREATE OR REPLACE FUNCTION sport.fn_join_team(
    invitation_code TEXT,
    mode TEXT, 
    name TEXT, 
    jersey_number TEXT, 
    password TEXT, 
    player_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE v_team_id UUID; v_new_player RECORD;
BEGIN
    SELECT id INTO v_team_id FROM sport.teams WHERE sport.teams.invitation_code = fn_join_team.invitation_code;
    IF v_team_id IS NULL THEN RAISE EXCEPTION '無效的通行碼'; END IF;

    IF mode = 'new' THEN
        -- FIX: 使用 bcrypt 加密密碼
        INSERT INTO sport.players (team_id, name, jersey_number, password_hash, is_active, is_claimed)
        VALUES (v_team_id, name, jersey_number, crypt(password, gen_salt('bf')), true, true) 
        RETURNING * INTO v_new_player;
        
    ELSIF mode = 'claim' THEN
        -- FIX: 使用 bcrypt 加密密碼
        UPDATE sport.players 
        SET password_hash = crypt(password, gen_salt('bf')), 
            is_claimed = true, 
            updated_at = NOW()
        WHERE id = player_id AND team_id = v_team_id 
        RETURNING * INTO v_new_player;
        
        IF v_new_player IS NULL THEN RAISE EXCEPTION '認領失敗：找不到球員或權限不足'; END IF;
    ELSE 
        RAISE EXCEPTION '無效的操作模式'; 
    END IF;
    
    RETURN to_jsonb(v_new_player);
END;
$$;

-- ==================== 第四步：驗證修正 ====================
-- 測試函式（不實際執行，只驗證語法）
DO $$
DECLARE
    v_test_team_code TEXT;
BEGIN
    SELECT invitation_code INTO v_test_team_code 
    FROM sport.teams 
    WHERE slug = 'doraemon-baseball' 
    LIMIT 1;
    
    RAISE NOTICE '✅ 函式已更新，測試邀請碼: %', v_test_team_code;
    RAISE NOTICE '⚠️ 請在前端測試新球員註冊，確認密碼正確加密';
END $$;

-- ==================== 資料遷移指令 (如有明文密碼) ====================
/*
-- 若檢查到有明文密碼，請執行以下遷移：
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, password_hash FROM sport.players 
             WHERE password_hash IS NOT NULL 
             AND password_hash NOT LIKE '$2%'
    LOOP
        -- 將明文密碼轉為 bcrypt
        UPDATE sport.players 
        SET password_hash = crypt(r.password_hash, gen_salt('bf'))
        WHERE id = r.id;
        
        RAISE NOTICE '已遷移球員 ID: %', r.id;
    END LOOP;
END $$;
*/

-- ==================== 回滾指令 (如需要) ====================
/*
CREATE OR REPLACE FUNCTION sport.fn_join_team(...)
AS $$
BEGIN
    ...
    IF mode = 'new' THEN
        INSERT INTO sport.players (...)
        VALUES (v_team_id, p_name, p_jersey_number, p_password, true, true)  -- 明文
        RETURNING * INTO v_new_player;
    ...
END;
$$;
*/

DO $$
BEGIN
    RAISE NOTICE '✅ Step 3 完成：已修正 fn_join_team 密碼加密';
    RAISE NOTICE '⚠️ 重要：請在前端測試新球員註冊功能！';
END $$;
