-- ================================================
-- 010 Schema 權限修復
-- 確保 anon 和 authenticated 角色可以存取 sport schema
-- ================================================

-- 授予 schema 使用權限
GRANT USAGE ON SCHEMA sport TO anon, authenticated;

-- 授予所有現有表格的 CRUD 權限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sport TO anon, authenticated;

-- 授予序列權限 (for auto-increment IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA sport TO anon, authenticated;

-- 設定預設權限 (未來新建的物件也會自動繼承這些權限)
ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA sport 
GRANT ALL ON SEQUENCES TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ 010: Schema 權限已授予 anon 和 authenticated 角色';
END $$;
