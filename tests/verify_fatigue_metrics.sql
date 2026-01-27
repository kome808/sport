-- 驗證疲勞指標計算邏輯
-- 請在 Supabase SQL Editor 或透過 psql 執行

BEGIN;

-- 1. 建立測試球員
INSERT INTO players (id, team_id, name, email, height, weight, position)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Test ACWR High', 'test1@example.com', 180, 80, 'P'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Test ACWR Low', 'test2@example.com', 180, 80, 'C'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Test RHR High', 'test3@example.com', 180, 80, 'IF'),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Test Wellness Low', 'test4@example.com', 180, 80, 'OF')
ON CONFLICT (id) DO NOTHING;

-- 2. 模擬數據
-- Test 1: ACWR Purple (>= 2.0)
-- 過去 28 天平均每天 500 (Chronic 500)
-- 過去 7 天平均每天 1200 (Acute 1200) -> 1200/500 = 2.4
-- 插入過去 28 天數據
INSERT INTO daily_records (player_id, record_date, training_load_au, rhr_bpm, sleep_quality, stress_level, fatigue_level, muscle_soreness, mood)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE - (n || ' days')::interval,
    CASE WHEN n < 7 THEN 1200 ELSE 266 END, -- 調整數值以湊出 ACWR
    60, 5, 5, 5, 5, 5
FROM generate_series(0, 30) n
ON CONFLICT (player_id, record_date) DO UPDATE SET training_load_au = EXCLUDED.training_load_au;

-- Test 2: ACWR Low Yellow (< 0.8)
-- Chronic 500, Acute 300 -> 0.6
INSERT INTO daily_records (player_id, record_date, training_load_au, rhr_bpm, sleep_quality, stress_level, fatigue_level, muscle_soreness, mood)
SELECT 
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - (n || ' days')::interval,
    CASE WHEN n < 7 THEN 300 ELSE 500 END,
    60, 5, 5, 5, 5, 5
FROM generate_series(0, 30) n
ON CONFLICT (player_id, record_date) DO UPDATE SET training_load_au = EXCLUDED.training_load_au;

-- Test 3: RHR Red (+10)
-- Baseline 60, Today 70
INSERT INTO daily_records (player_id, record_date, training_load_au, rhr_bpm, sleep_quality, stress_level, fatigue_level, muscle_soreness, mood)
SELECT 
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE - (n || ' days')::interval,
    500,
    CASE WHEN n = 0 THEN 70 ELSE 60 END,
    5, 5, 5, 5, 5
FROM generate_series(0, 10) n
ON CONFLICT (player_id, record_date) DO UPDATE SET rhr_bpm = EXCLUDED.rhr_bpm;

-- Test 4: Wellness Red (Low Score)
-- Avg 20, Today 10 -> Z-score low if SD is small, or by % drop
-- 讓過去都很穩定 20 (每天 4分x5), 今天 10 (2分x5)
INSERT INTO daily_records (player_id, record_date, training_load_au, rhr_bpm, sleep_quality, stress_level, fatigue_level, muscle_soreness, mood)
SELECT 
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE - (n || ' days')::interval,
    500, 60,
    CASE WHEN n = 0 THEN 2 ELSE 4 END,
    CASE WHEN n = 0 THEN 2 ELSE 4 END,
    CASE WHEN n = 0 THEN 2 ELSE 4 END,
    CASE WHEN n = 0 THEN 2 ELSE 4 END,
    CASE WHEN n = 0 THEN 2 ELSE 4 END
FROM generate_series(0, 30) n
ON CONFLICT (player_id, record_date) DO UPDATE SET sleep_quality = EXCLUDED.sleep_quality;

-- 執行查詢
SELECT 
    p.name,
    m.acwr,
    m.acwr_status, -- 舊欄位，現在可能 logic 變了
    (m.acwr ->> 'risk_level') as acwr_risk,
    (m.rhr ->> 'current_rhr') as rhr_curr,
    (m.rhr ->> 'status') as rhr_status,
    (m.wellness ->> 'total') as wellness_total,
    (m.wellness ->> 'status') as wellness_status
FROM get_player_fatigue_snapshot(
    ARRAY['00000000-0000-0000-0000-000000000001', 
          '00000000-0000-0000-0000-000000000002',
          '00000000-0000-0000-0000-000000000003',
          '00000000-0000-0000-0000-000000000004']::uuid[],
    CURRENT_DATE
) m
JOIN players p ON p.id = m.player_id;

ROLLBACK;
