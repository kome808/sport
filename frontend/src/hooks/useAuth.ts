/**
 * 認證相關 Hook
 * 穩定版本：平衡快取、超時與正確的初始化順序
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { Coach } from '@/types';

// 判斷當前環境的 Storage Key
const STORAGE_KEY = window.location.port === '3001' ? 'sb-admin-auth-token' : 'sb-auth-token';

interface AuthState {
    user: User | null;
    coach: Coach | null;
    isLoading: boolean;
    error: AuthError | null;
    isInitialized: boolean; // 新增：標記是否已經完成初始嘗試
}

export function useAuth() {
    const [state, setState] = useState<AuthState>(() => {
        // 同步嘗試讀取快取，減少重整時的閃爍與誤判
        let initialUser = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.user) initialUser = parsed.user;
            }
        } catch (e) { }

        return {
            user: initialUser,
            coach: null,
            isLoading: true,
            error: null,
            isInitialized: false
        };
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
                // 給予 4 秒超時保險
                const authPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AuthTimeout')), 4000)
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
                        isInitialized: true
                    });
                } else {
                    setState(prev => ({ ...prev, user: null, coach: null, isLoading: false, isInitialized: true }));
                }
            } catch (e: any) {
                console.warn('[useAuth] Init failed or timed out:', e.message);
                if (!cancelled) {
                    // 如果超時，我們依賴初始化的快取或是結束 loading
                    setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (cancelled) return;
                console.log('[useAuth] Auth Event:', event);

                if (session?.user) {
                    // 為了效能，如果 user id 沒變且已有 coach，就不重複 fetch
                    if (state.user?.id === session.user.id && state.coach) {
                        setState(prev => ({ ...prev, user: session.user, isLoading: false, isInitialized: true }));
                        return;
                    }
                    const coachData = await fetchCoach(session.user.id);
                    if (cancelled) return;
                    setState({
                        user: session.user,
                        coach: coachData,
                        isLoading: false,
                        error: null,
                        isInitialized: true
                    });
                } else if (event === 'SIGNED_OUT') {
                    setState({ user: null, coach: null, isLoading: false, error: null, isInitialized: true });
                }
            }
        );

        init();

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error };
            return { success: true, user: data.user };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

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
