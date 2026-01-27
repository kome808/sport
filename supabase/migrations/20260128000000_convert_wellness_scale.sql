-- ================================================
-- 轉換 Wellness 數值為 10 分制 (x2)
-- 及更新 Demo 數據生成函數
-- 日期: 2026-01-28
-- ================================================

BEGIN;

-- 1. 更新現有數據 (將 5 分制轉換為 10 分制)
-- 只更新 <= 5 的數據 (避免重複執行)
UPDATE sport.daily_records
SET 
  sleep_quality = CASE WHEN sleep_quality <= 5 THEN sleep_quality * 2 ELSE sleep_quality END,
  fatigue_level = CASE WHEN fatigue_level <= 5 THEN fatigue_level * 2 ELSE fatigue_level END,
  stress_level = CASE WHEN stress_level <= 5 THEN stress_level * 2 ELSE stress_level END,
  muscle_soreness = CASE WHEN muscle_soreness <= 5 THEN muscle_soreness * 2 ELSE muscle_soreness END,
  mood = CASE WHEN mood <= 5 THEN mood * 2 ELSE mood END
WHERE sleep_quality <= 5 OR fatigue_level <= 5; -- 只要有一個欄位還在舊制就更新

-- 2. 更新 regenerate_demo_data 函數以生成 10 分制數據
CREATE OR REPLACE FUNCTION sport.regenerate_demo_data(p_team_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_team_id UUID;
    v_player RECORD;
    v_date DATE;
    v_i INT;
    v_base_rhr INT;
    v_rand_factor DECIMAL;
    v_load INT;
    v_wellness_val INT;
    v_days_to_gen INT := 30; -- 生成 30 天數據
    v_records_count INT := 0;
BEGIN
    -- 取得球隊 ID
    SELECT id INTO v_team_id FROM sport.teams WHERE LOWER(slug) = LOWER(p_team_slug);
    IF v_team_id IS NULL THEN 
        RETURN jsonb_build_object('status', 'error', 'message', '找不到球隊: ' || p_team_slug); 
    END IF;

    -- 先清空全隊舊數據
    DELETE FROM sport.daily_records WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.pain_reports WHERE player_id IN (SELECT id FROM sport.players WHERE team_id = v_team_id);
    DELETE FROM sport.notifications WHERE team_id = v_team_id;

    -- 遍歷所有活躍球員
    FOR v_player IN SELECT id, name FROM sport.players WHERE team_id = v_team_id AND is_active = true LOOP
        -- 為每位球員隨機設定一個基準 RHR (50-65)
        v_base_rhr := 50 + floor(random() * 15);
        
        -- 為球員決定一個「狀態性格」
        v_rand_factor := random();

        -- 生成 30 天數據，直到今日
        FOR v_i IN 0..(v_days_to_gen - 1) LOOP
            v_date := CURRENT_DATE - ((v_days_to_gen - 1) - v_i) * INTERVAL '1 day';
            
            -- 模擬不同的疲勞進程 (更新為 10 分制)
            IF v_rand_factor > 0.85 THEN -- 「高負荷/過度訓練」型 (後期炸裂)
                IF v_i > 20 THEN
                    v_load := 600 + floor(random() * 500); -- 600-1100 AU
                    v_wellness_val := 2 + floor(random() * 3); -- 2-4 分 (原 1-2)
                    v_base_rhr := v_base_rhr + floor(random() * 2); -- RHR 漂移
                ELSE
                    v_load := 200 + floor(random() * 400);
                    v_wellness_val := 6 + floor(random() * 3); -- 6-8 分 (原 3-4)
                END IF;
            ELSIF v_rand_factor > 0.65 THEN -- 「輕度疲勞」型 (中規中矩但有點累)
                v_load := 300 + floor(random() * 400);
                v_wellness_val := 4 + floor(random() * 5); -- 4-8 分 (原 2-4)
            ELSE -- 「健康/穩定」型
                v_load := 100 + floor(random() * 300);
                v_wellness_val := 8 + floor(random() * 3); -- 8-10 分 (原 4-5)
            END IF;

            -- 插入每日紀錄 (觸發器會自動算 wellness_total 和 training_load_au)
            INSERT INTO sport.daily_records (
                player_id, 
                record_date, 
                rhr_bpm, 
                sleep_quality, 
                fatigue_level, 
                mood, 
                stress_level, 
                muscle_soreness, 
                srpe_score, 
                training_minutes
            ) VALUES (
                v_player.id,
                v_date,
                v_base_rhr + floor(random() * 5) - 2,
                v_wellness_val,
                v_wellness_val,
                v_wellness_val,
                v_wellness_val,
                v_wellness_val,
                GREATEST(1, floor(v_load / 90.0 + (random() * 2 - 1))), -- 模擬 srpe 分數
                90
            );
            
            v_records_count := v_records_count + 1;

            -- 隨機生成一些疼痛報告
            IF random() > 0.95 THEN
                INSERT INTO sport.pain_reports (
                    player_id,
                    report_date,
                    body_part,
                    pain_level,
                    pain_type,
                    description,
                    is_resolved
                ) VALUES (
                    v_player.id,
                    v_date,
                    (ARRAY['左膝', '右踝', '腰部', '右肩'])[floor(random()*4)+1],
                    3 + floor(random()*5),
                    'fatigue',
                    '自動生成的模擬疼痛數據',
                    false
                );
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success', 
        'message', '已為全隊球員生成 30 天數據 (累計 ' || v_records_count || ' 筆)',
        'days', v_days_to_gen,
        'records_count', v_records_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
