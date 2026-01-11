/**
 * 認證相關 Hook - 簡化版
 * 處理教練登入、登出、註冊等功能
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { Coach } from '@/types';

interface AuthState {
    user: User | null;
    coach: Coach | null;
    isLoading: boolean;
    error: AuthError | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        coach: null,
        isLoading: true,
        error: null,
    });

    // 初始化：檢查現有的 session
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const { data } = await supabase.auth.getSession();

                if (cancelled) return;

                if (data.session?.user) {
                    setState({
                        user: data.session.user,
                        coach: null, // 暫時不查詢 coach，避免問題
                        isLoading: false,
                        error: null,
                    });
                } else {
                    setState({
                        user: null,
                        coach: null,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (e) {
                console.error('Auth init error:', e);
                if (!cancelled) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            }
        };

        init();

        // 監聽認證狀態變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (cancelled) return;

                if (event === 'SIGNED_IN' && session?.user) {
                    setState({
                        user: session.user,
                        coach: null,
                        isLoading: false,
                        error: null,
                    });
                } else if (event === 'SIGNED_OUT') {
                    setState({
                        user: null,
                        coach: null,
                        isLoading: false,
                        error: null,
                    });
                }
            }
        );

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    // 登入
    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error };
            }

            return { success: true, user: data.user };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

    // 註冊
    const signUp = useCallback(async (email: string, password: string, name: string) => {
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name },
                },
            });

            if (authError) {
                return { success: false, error: authError };
            }

            // 嘗試建立 coach 資料 (忽略錯誤)
            if (authData.user) {
                try {
                    await supabase
                        .schema(SCHEMA_NAME)
                        .from('coaches')
                        .upsert({ email: authData.user.email, name }, { onConflict: 'email' });
                } catch {
                    // Ignore
                }
            }

            return { success: true, user: authData.user };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

    // 登出
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        return { success: !error, error };
    }, []);

    return {
        ...state,
        isAuthenticated: !!state.user,
        signIn,
        signUp,
        signOut,
    };
}
