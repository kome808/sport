-- ================================================
-- 1. 確保 daily_records 有 feedback 欄位
-- ================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'sport' 
        AND table_name = 'daily_records' 
        AND column_name = 'feedback'
    ) THEN
        ALTER TABLE sport.daily_records ADD COLUMN feedback TEXT;
    END IF;
END $$;

-- ================================================
-- 2. 更新測試數據生成函數
-- Updates:
--  - 隨機生成 training_minutes (30-180) 和 srpe_score (1-10)
--  - 確保 training_load_au 自動計算 (由 Trigger 處理)
--  - 增加 feedback 隨機文字
--  - 優化傷病回報生成 (pain_level, body_part, description)
-- ================================================

CREATE OR REPLACE FUNCTION sport.regenerate_demo_data(p_team_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_team_id UUID;
    v_player RECORD;
    v_date DATE;
    v_i INT;
    v_base_rhr INT;
    v_rand_factor DECIMAL;
    v_wellness_val INT;
    v_days_to_gen INT := 30; -- 生成 30 天數據
    v_records_count INT := 0;
    
    -- 訓練變數
    v_intensity INT; -- 1-10
    v_minutes INT;   -- 30-180
    v_is_rest_day BOOLEAN;

    -- 文字庫
    v_feedback_opts TEXT[] := ARRAY[
        '今天感覺不錯，狀況很好', 
        '有點累，但還可以堅持', 
        '膝蓋有點緊繃，需要注意', 
        '昨晚沒睡好，精神不濟', 
        '訓練強度很高，肌肉很酸', 
        '狀況普通', 
        '感覺充滿活力！',
        '需要物理治療介入',  
        NULL, NULL, NULL, NULL -- 增加空值的機率
    ];
    v_feedback_txt TEXT;

    -- 傷病變數
    v_pain_parts TEXT[] := ARRAY['左膝', '右膝', '左踝', '右踝', '腰部', '右肩', '左肩', '右肘', '大腿後肌'];
    v_pain_desc TEXT[] := ARRAY['隱隱作痛', '刺痛感', '酸軟無力', '腫脹', '活動受限'];
    
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
            
            -- 決定是否為休息日 (每週約 1 天休息)
            IF EXTRACT(DOW FROM v_date) = 0 THEN -- 週日休息
                 v_is_rest_day := (random() > 0.2); -- 80% 機率休息
            ELSE
                 v_is_rest_day := (random() > 0.95); -- 平日 5% 機率休息
            END IF;

            -- 模擬不同的疲勞數據
            IF v_rand_factor > 0.85 THEN -- 「高負荷/過度訓練」型
                IF v_i > 20 THEN
                    -- 後期累積疲勞
                    v_intensity := 7 + floor(random() * 4); -- 7-10
                    v_minutes := 90 + floor(random() * 90); -- 90-180
                    v_wellness_val := 1 + floor(random() * 2); -- 1-2 (差)
                    v_base_rhr := v_base_rhr + floor(random() * 2); -- RHR 漂移
                ELSE
                    v_intensity := 5 + floor(random() * 4); -- 5-8
                    v_minutes := 60 + floor(random() * 60); -- 60-120
                    v_wellness_val := 3 + floor(random() * 2); -- 3-4 (普通)
                END IF;
            ELSIF v_rand_factor > 0.65 THEN -- 「一般選手」型
                v_intensity := 4 + floor(random() * 5); -- 4-8
                v_minutes := 60 + floor(random() * 60); -- 60-120
                v_wellness_val := 2 + floor(random() * 3); -- 2-4
            ELSE -- 「健康/穩定」型
                v_intensity := 3 + floor(random() * 4); -- 3-6
                v_minutes := 45 + floor(random() * 45); -- 45-90
                v_wellness_val := 4 + floor(random() * 2); -- 4-5
            END IF;

            -- 確保數值邊界
            IF v_intensity > 10 THEN v_intensity := 10; END IF;
            IF v_wellness_val > 5 THEN v_wellness_val := 5; END IF;

            -- 如果是休息日，強度與時間歸零，或很低
            IF v_is_rest_day THEN
                v_intensity := 0;
                v_minutes := 0;
                v_wellness_val := LEAST(5, v_wellness_val + 1); -- 休息日恢復一點
            END IF;

            -- 隨機選擇回饋
            v_feedback_txt := v_feedback_opts[floor(random() * array_length(v_feedback_opts, 1)) + 1];
            -- 如果是休息日，且沒有特定feedback，就給個 '休息日'
            IF v_is_rest_day AND v_feedback_txt IS NULL AND random() > 0.5 THEN
               v_feedback_txt := '休息日';
            END IF;

            -- 插入每日紀錄
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
                training_minutes,
                feedback
            ) VALUES (
                v_player.id,
                v_date,
                v_base_rhr + floor(random() * 5) - 2,
                v_wellness_val,
                v_wellness_val,
                v_wellness_val,
                v_wellness_val,
                v_wellness_val,
                v_intensity,
                v_minutes,
                v_feedback_txt
            );
            
            v_records_count := v_records_count + 1;

            -- 傷病報告生成邏輯
            -- 設定 5% 機率發生新傷病，或者如果是「高負荷」球員在後期機率更高
            IF (random() > 0.95) OR (v_rand_factor > 0.85 AND v_i > 25 AND random() > 0.7) THEN
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
                    v_pain_parts[floor(random() * array_length(v_pain_parts, 1)) + 1],
                    3 + floor(random()*5), -- 3-7 分
                    'fatigue',
                    v_pain_desc[floor(random() * array_length(v_pain_desc, 1)) + 1],
                    false
                );
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success', 
        'message', '已為全隊球員生成 30 天數據 (累計 ' || v_records_count || ' 筆)，包含回饋與詳細 sRPE',
        'days', v_days_to_gen,
        'records_count', v_records_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
