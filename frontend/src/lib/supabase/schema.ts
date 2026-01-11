/**
 * Supabase Schema 設定
 * 禁止寫死 Schema 名稱，必須透過此變數傳遞
 */

export const SCHEMA_NAME = 'sport' as const;

export type SchemaName = typeof SCHEMA_NAME;
