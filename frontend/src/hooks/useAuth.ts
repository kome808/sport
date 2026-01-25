/**
 * 認證相關 Hook
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

    const fetchCoach = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('coaches')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.warn('[useAuth] Fetch coach error:', error);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        let cancelled = false;

        // 1. 極致保險：如果 getSession 真的掛了，手動從 LocalStorage 撈
        // 這能解決 localhost 上極度頑固的 navigator.locks 問題
        const tryManualSyncAuth = () => {
            try {
                const port = window.location.port;
                const storageKey = port === '3001' ? 'sb-admin-auth-token' : 'sb-auth-token';
                const rawData = localStorage.getItem(storageKey);

                if (rawData) {
                    const parsed = JSON.parse(rawData);
                    if (parsed?.user) {
                        console.log('[useAuth] Emergency manual auth detection success:', parsed.user.email);
                        // 先設為 User，isLoading 設為 false，讓畫面先出來
                        setState(prev => ({
                            ...prev,
                            user: parsed.user,
                            isLoading: false
                        }));
                        return true;
                    }
                }
            } catch (e) {
                console.warn('[useAuth] Manual auth detection failed:', e);
            }
            return false;
        };

        // Safety Timeout: 
        const safetyTimeout = setTimeout(() => {
            if (!cancelled && state.isLoading) {
                console.warn('[useAuth] Safety timeout triggered');
                // 最後手段：嘗試手動偵測
                const recovered = tryManualSyncAuth();
                if (!recovered) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            }
        }, 3000); // 縮短到 3 秒

        const init = async () => {
            try {
                // 優先使用 getSession
                const { data: { session } } = await supabase.auth.getSession();

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
                    return;
                }

                // fallback to getUser with race
                const timeoutPromise = new Promise<{ data: { user: null } }>((_, reject) =>
                    setTimeout(() => reject(new Error('AuthTimeout')), 1500)
                );

                const { data: { user } } = await Promise.race([
                    supabase.auth.getUser(),
                    timeoutPromise
                ]) as any;

                if (user && !cancelled) {
                    const coachData = await fetchCoach(user.id);
                    setState({
                        user: user,
                        coach: coachData,
                        isLoading: false,
                        error: null,
                    });
                } else if (!cancelled) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (e) {
                if (!cancelled) {
                    // 如果掛了，最後一搏：手動偵測
                    if (!tryManualSyncAuth()) {
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                }
            }
        };

        // 先嘗試同步偵測，如果有的話，畫面會瞬間變更
        tryManualSyncAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (cancelled) return;
                console.log('[useAuth] State change:', event, session?.user?.email);

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
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    // 登入功能保持不變
    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            return { success: !error, error, user: data.user };
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

    return {
        ...state,
        isAuthenticated: !!state.user,
        isAnonymous: state.user?.is_anonymous ?? false,
        signIn,
        signOut,
        signInWithGoogle,
    };
}
