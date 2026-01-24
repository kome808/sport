-- ================================================
-- 修復 ID 不一致問題 (ID Mismatch Fix) - 針對 komepanfu@gmail.com
-- 日期: 2026-01-25
-- 說明：遷移假資料 ID (0000...1) 至真實 Google Auth ID
-- ================================================

DO $$
DECLARE
    -- 請在此確認 ID (來自您的錯誤訊息)
    v_new_auth_id UUID := '140aa3fd-ee1e-4c18-9a43-b8285523ee30'; -- Console 中的 authId
    v_old_db_id   UUID := '00000000-0000-0000-0000-000000000001'; -- Console 中的 dbId (種子資料 ID)
    
    v_email       TEXT := 'komepanfu@gmail.com';
    v_name        TEXT;
    v_avatar      TEXT;
BEGIN
    RAISE NOTICE 'Starting migration for % from % to %', v_email, v_old_db_id, v_new_auth_id;

    -- 1. 取得舊資料備份 (如果存在)
    SELECT name, avatar_url INTO v_name, v_avatar 
    FROM sport.coaches WHERE id = v_old_db_id;
    
    IF v_name IS NULL THEN
        RAISE EXCEPTION '找不到舊的教練資料 (ID: %)', v_old_db_id;
    END IF;

    -- 2. 暫時修改舊資料的 Email，避開 Unique Constraint
    -- 因為資料庫已經有 komepanfu@gmail.com (綁定在舊 ID)，不改名無法插入新 ID
    UPDATE sport.coaches 
    SET email = 'migrating_' || v_old_db_id || '_' || email 
    WHERE id = v_old_db_id;

    -- 3. 建立新教練紀錄
    INSERT INTO sport.coaches (id, email, name, avatar_url)
    VALUES (v_new_auth_id, v_email, v_name, v_avatar)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, name = EXCLUDED.name;

    -- 4. 遷移關聯資料 (Teams)
    UPDATE sport.teams 
    SET coach_id = v_new_auth_id 
    WHERE coach_id = v_old_db_id;

    -- 5. 遷移關聯資料 (Team Members)
    BEGIN
        UPDATE sport.team_members 
        SET coach_id = v_new_auth_id 
        WHERE coach_id = v_old_db_id;
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Member conflict detected, deleting old member records...';
        DELETE FROM sport.team_members WHERE coach_id = v_old_db_id;
    END;

    -- 6. 刪除舊教練紀錄
    DELETE FROM sport.coaches WHERE id = v_old_db_id;

    RAISE NOTICE 'Migration successfully completed. You may now login.';
END $$;
