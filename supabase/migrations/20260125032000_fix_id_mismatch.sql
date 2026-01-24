-- ================================================
-- 修復 ID 不一致問題 (ID Mismatch Fix) - V2
-- 日期: 2026-01-25
-- 修正：解決 Unique Email Constraint 衝突問題
-- ================================================

DO $$
DECLARE
    -- 請在此確認 ID
    v_new_auth_id UUID := '50270752-06a3-4afb-b60e-9420bc6d62ea'; -- Console 中的 authId (新)
    v_old_db_id   UUID := '831cf840-be78-44d9-a0d6-36cffb7059c6'; -- Console 中的 dbId (舊)
    
    v_email       TEXT := 'zaissaki3@gmail.com';
    v_name        TEXT;
    v_avatar      TEXT;
BEGIN
    RAISE NOTICE 'Starting migration for % from % to %', v_email, v_old_db_id, v_new_auth_id;

    -- 1. 取得舊資料備份
    SELECT name, avatar_url INTO v_name, v_avatar 
    FROM sport.coaches WHERE id = v_old_db_id;
    
    IF v_name IS NULL THEN
        RAISE EXCEPTION '找不到舊的教練資料 (ID: %)', v_old_db_id;
    END IF;

    -- 2. 【關鍵步驟】暫時修改舊資料的 Email，避開 Unique Constraint
    UPDATE sport.coaches 
    SET email = 'migrating_' || v_old_db_id || '_' || email 
    WHERE id = v_old_db_id;

    -- 3. 建立新教練紀錄
    -- 現在 Email 已經空出來了，可以插入新 ID
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_new_auth_id, v_email, v_name, v_avatar)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, name = EXCLUDED.name;

    -- 4. 遷移關聯資料 (Teams)
    -- 將原本屬於舊 ID 的球隊，轉移給新 ID
    UPDATE sport.teams 
    SET coach_id = v_new_auth_id 
    WHERE coach_id = v_old_db_id;

    -- 5. 遷移關聯資料 (Team Members)
    -- 將原本屬於舊 ID 的成員資格，轉移給新 ID
    -- 處理潛在的主鍵衝突：如果新 ID 已經被加進過，就先刪除舊 ID 的成員紀錄，否則更新它
    BEGIN
        UPDATE sport.team_members 
        SET coach_id = v_new_auth_id 
        WHERE coach_id = v_old_db_id;
    EXCEPTION WHEN unique_violation THEN
        -- 如果衝突，代表新 ID 已經在這個 team 了，那就刪除舊的
        RAISE NOTICE 'Member conflict detected, deleting old member records...';
        DELETE FROM sport.team_members WHERE coach_id = v_old_db_id;
    END;

    -- 6. 刪除舊教練紀錄
    DELETE FROM sport.coaches WHERE id = v_old_db_id;

    RAISE NOTICE 'Migration successfully completed.';
END $$;
