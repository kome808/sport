-- ========================================================
-- 修正步驟 2: 規範 calculate_acwr_decoupled 的 RETURN 語法
-- ========================================================
-- 優先級: 🟢 低 (語法規範化)
-- 風險: 🟢 極低 (不影響功能)
-- 影響: ACWR 計算函式
-- 可回滾: ✅ 是
-- ========================================================

-- ==================== 第一步：備份檢查 ====================
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as current_definition
FROM pg_proc 
WHERE proname = 'calculate_acwr_decoupled' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sport');

-- ==================== 第二步：執行修正 ====================
CREATE OR REPLACE FUNCTION sport.calculate_acwr_decoupled(
    p_player_id UUID,
    p_date DATE
)
RETURNS TABLE (
    acute_load NUMERIC,
    chronic_load NUMERIC,
    acwr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sport, public, extensions, pg_catalog
AS $$
DECLARE
    v_acute NUMERIC := 0;
    v_chronic NUMERIC := 0;
    c_lambda_acute NUMERIC := 0.25;
    c_lambda_chronic NUMERIC := 0.07;
    r RECORD;
    v_ewma NUMERIC;
BEGIN
    -- Acute
    v_ewma := 0;
    FOR r IN SELECT d::DATE as date, COALESCE(dr.srpe_score * dr.training_minutes, 0) as load
             FROM generate_series(p_date - 6, p_date, '1 day'::interval) d
             LEFT JOIN sport.daily_records dr ON dr.record_date = d::DATE AND dr.player_id = p_player_id
             ORDER BY d::DATE ASC
    LOOP
        IF v_ewma = 0 AND r.load > 0 THEN v_ewma := r.load;
        ELSE v_ewma := (r.load * c_lambda_acute) + (v_ewma * (1 - c_lambda_acute)); END IF;
    END LOOP;
    v_acute := v_ewma;

    -- Chronic
    v_ewma := 0;
    FOR r IN SELECT d::DATE as date, COALESCE(dr.srpe_score * dr.training_minutes, 0) as load
             FROM generate_series(p_date - 27, p_date - 7, '1 day'::interval) d
             LEFT JOIN sport.daily_records dr ON dr.record_date = d::DATE AND dr.player_id = p_player_id
             ORDER BY d::DATE ASC
    LOOP
        IF v_ewma = 0 AND r.load > 0 THEN v_ewma := r.load;
        ELSE v_ewma := (r.load * c_lambda_chronic) + (v_ewma * (1 - c_lambda_chronic)); END IF;
    END LOOP;
    v_chronic := v_ewma;

    IF v_chronic = 0 THEN acwr := NULL;
    ELSE acwr := ROUND((v_acute / v_chronic)::NUMERIC, 2); END IF;

    acute_load := ROUND(v_acute, 1);
    chronic_load := ROUND(v_chronic, 1);
    
    -- FIX: 加上明確的 RETURN; 結束流程
    RETURN NEXT;
    RETURN;  -- ← 新增：明確結束函式
END;
$$;

-- ==================== 第三步：驗證修正 ====================
-- 測試函式是否可正常執行
DO $$
DECLARE
    v_test_player_id UUID;
    v_result RECORD;
BEGIN
    SELECT id INTO v_test_player_id 
    FROM sport.players 
    WHERE team_id IN (SELECT id FROM sport.teams WHERE slug = 'doraemon-baseball')
    LIMIT 1;
    
    IF v_test_player_id IS NOT NULL THEN
        SELECT * INTO v_result FROM sport.calculate_acwr_decoupled(v_test_player_id, CURRENT_DATE);
        RAISE NOTICE '✅ 測試成功，ACWR: %, Acute: %, Chronic: %', 
            v_result.acwr, v_result.acute_load, v_result.chronic_load;
    ELSE
        RAISE NOTICE '⚠️ 找不到測試球員';
    END IF;
END $$;

-- ==================== 回滾指令 (如需要) ====================
-- 若要回滾此變更，執行：
/*
CREATE OR REPLACE FUNCTION sport.calculate_acwr_decoupled(...)
...
    acute_load := ROUND(v_acute, 1);
    chronic_load := ROUND(v_chronic, 1);
    RETURN NEXT;  -- 只有 RETURN NEXT，沒有 RETURN
END;
$$;
*/

DO $$
BEGIN
    RAISE NOTICE '✅ Step 2 完成：已規範 calculate_acwr_decoupled 的 RETURN 語法';
END $$;
