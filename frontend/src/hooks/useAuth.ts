/**
 * 認證相關 Hook
 * 強化版本：包含超時保護與 LocalStorage 低延遲快取
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { Coach } from '@/types';

const PORT_STORAGE_KEY = window.location.port === '3001' ? 'sb-admin-auth-token' : 'sb-auth-token';

interface AuthState {
    user: User | null;
    coach: Coach | null;
    isLoading: boolean;
    error: AuthError | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>(() => {
        // [進階] 初始化時預先偵測快取，實現「瞬開」
        try {
            const rawData = localStorage.getItem(PORT_STORAGE_KEY);
            if (rawData) {
                const parsed = JSON.parse(rawData);
                if (parsed?.user) {
                    return { user: parsed.user, coach: null, isLoading: true, error: null };
                }
            }
        } catch (e) { }
        return { user: null, coach: null, isLoading: true, error: null };
    });

    const fetchCoach = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('coaches')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            return error ? null : data;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                // [方案 1] 使用 Promise.race 防止 getSession 卡死
                const authPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AuthTimeout')), 2500)
                );

                const result = await Promise.race([authPromise, timeoutPromise]) as any;
                const session = result?.data?.session;

                if (cancelled) return;

                if (session?.user) {
                    const coachData = await fetchCoach(session.user.id);
                    if (cancelled) return;

                    setState({
                        user: session.user,
                        coach: coachData,
                        isLoading: false,
                        error: null,
                    });
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (e: any) {
                console.warn('[useAuth] Auth check timed out or failed:', e.message);
                if (!cancelled) {
                    // [方案 2] 超時或失敗，嘗試最後一次手動恢復，否則結束 Loading
                    const rawData = localStorage.getItem(PORT_STORAGE_KEY);
                    if (rawData) {
                        try {
                            const parsed = JSON.parse(rawData);
                            if (parsed?.user) {
                                console.log('[useAuth] Recovered from cache after timeout');
                                setState(prev => ({ ...prev, user: parsed.user, isLoading: false }));
                                return;
                            }
                        } catch (err) { }
                    }
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (cancelled) return;
                if (session?.user) {
                    const coachData = await fetchCoach(session.user.id);
                    if (cancelled) return;
                    setState({
                        user: session.user,
                        coach: coachData,
                        isLoading: false,
                        error: null,
                    });
                } else if (event === 'SIGNED_OUT') {
                    setState({ user: null, coach: null, isLoading: false, error: null });
                }
            }
        );

        init();

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    // 登入
    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error };
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
                options: { data: { name } },
            });
            if (authError) return { success: false, error: authError };
            if (authData.user) {
                await supabase.schema(SCHEMA_NAME).from('coaches').upsert({
                    id: authData.user.id,
                    email: authData.user.email,
                    name
                }, { onConflict: 'id' });
            }
            return { success: true, user: authData.user };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        return { success: !error, error };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` }
            });
            return { success: !error, error };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

    const signInAnonymously = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) return { success: false, error };
            return { success: true, user: data.user };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

    return {
        ...state,
        isAuthenticated: !!state.user,
        isAnonymous: state.user?.is_anonymous ?? false,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInAnonymously,
    };
}
