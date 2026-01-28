/**
 * Supabase Client - Singleton Pattern
 * 確保全域僅有一個 Client 實例
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 從環境變數或 localStorage 讀取連線資訊
const getSupabaseConfig = () => {
    // 優先從環境變數讀取
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
        return { url: envUrl, key: envKey };
    }

    // 備用：從 localStorage 讀取（預覽環境）
    const localUrl = localStorage.getItem('supabase_url');
    const localKey = localStorage.getItem('supabase_anon_key');

    if (localUrl && localKey) {
        return { url: localUrl, key: localKey };
    }

    // 開發環境預設值（請替換為實際值）
    return {
        url: 'https://your-project.supabase.co',
        key: 'your-anon-key',
    };
};

// Singleton 實例
let supabaseInstance: SupabaseClient | null = null;

/**
 * 取得 Supabase Client 實例
 * 使用 Singleton Pattern 確保全域僅有一個實例
 */
export const getSupabaseClient = (): SupabaseClient => {
    if (!supabaseInstance) {
        const config = getSupabaseConfig();
        // 動態決定 Storage Key，避免 3000 與 3001 互相鎖死 (Lock Contention)
        const storageKey = import.meta.env.VITE_APP_MODE === 'admin' ? 'sb-admin-auth-token' : 'sb-auth-token';

        supabaseInstance = createClient(config.url, config.key, {
            auth: {
                storageKey: storageKey,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                // 重要：在 localhost 多 Port 環境下，禁用 navigatorLock 以防止重整時卡死
                navigatorLock: false,
            } as any,
            global: {
                fetch: (...args) => fetch(...args),
            },
        });
    }
    return supabaseInstance;
};

/**
 * 設定 Supabase 連線資訊（用於預覽環境的 UI 輸入）
 */
export const setSupabaseConfig = (url: string, key: string): void => {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
    // 重置實例，下次取得時會使用新設定
    supabaseInstance = null;
};

/**
 * 檢查是否已設定 Supabase 連線
 */
export const isSupabaseConfigured = (): boolean => {
    const config = getSupabaseConfig();
    return (
        config.url !== 'https://your-project.supabase.co' &&
        config.key !== 'your-anon-key'
    );
};

// 預設匯出 Client 實例
export const supabase = getSupabaseClient();
