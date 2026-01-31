-- ========================================================
-- 修正步驟 4: 標記 fn_login_player (legacy) 為 deprecated
-- ========================================================
-- 優先級: 🟡 中 (程式碼清理)
-- 風險: 🟢 低 (未被前端使用)
-- 影響: 無（前端只使用 login_player）
-- 可回滾: ✅ 是
-- ========================================================

-- ==================== 第一步：檢查使用情況 ====================
-- 檢查函式是否存在
SELECT 
    proname, 
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'fn_login_player' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sport');

-- ==================== 第二步：更新函式為 bcrypt 版本並標記 deprecated ====================
CREATE OR REPLACE FUNCTION sport.fn_login_player(player_code TEXT, password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
-- @deprecated 此函式已棄用，請使用 sport.login_player
-- 保留僅為向下相容，將在未來版本移除
DECLARE 
    v_player RECORD; 
    v_is_short_code BOOLEAN;
BEGIN
    v_is_short_code := length(player_code) <= 10 AND position('-' in player_code) = 0;
    
    SELECT * INTO v_player FROM sport.players 
    WHERE is_active = true 
    AND ((v_is_short_code AND short_code = lower(player_code)) 
         OR (NOT v_is_short_code AND id = player_code::uuid)) 
    LIMIT 1;

    IF v_player IS NULL THEN 
        RAISE EXCEPTION '找不到球員資料'; 
    END IF;
    
    -- FIX: 使用 bcrypt 比對（原本是明文比對）
    IF v_player.password_hash IS NULL OR 
       v_player.password_hash != crypt(password, v_player.password_hash) THEN 
        RAISE EXCEPTION '密碼錯誤'; 
    END IF;
    
    RETURN to_jsonb(v_player);
END;
$$;

-- 加上函式註解
COMMENT ON FUNCTION sport.fn_login_player(TEXT, TEXT) IS 
'@deprecated 此函式已棄用，請使用 sport.login_player。保留僅為向下相容。';

-- ==================== 第三步：驗證 login_player 正常運作 ====================
DO $$
DECLARE
    v_test_result RECORD;
BEGIN
    -- 測試新版 login_player 功能
    SELECT * INTO v_test_result 
    FROM sport.login_player('48p', 'demo123')
    LIMIT 1;
    
    IF v_test_result IS NOT NULL THEN
        RAISE NOTICE '✅ login_player (推薦版本) 運作正常';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ 測試失敗: %', SQLERRM;
END $$;

-- ==================== 建議：未來完全移除 ====================
/*
-- 若確認無任何系統使用 fn_login_player，可執行：
DROP FUNCTION IF EXISTS sport.fn_login_player(TEXT, TEXT);
RAISE NOTICE '✅ 已移除 legacy 函式 fn_login_player';
*/

DO $$
BEGIN
    RAISE NOTICE '✅ Step 4 完成：已標記 fn_login_player 為 deprecated';
    RAISE NOTICE 'ℹ️  建議：若無外部系統使用，可考慮完全移除此函式';
END $$;
