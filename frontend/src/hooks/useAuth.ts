/**
 * 認證相關 Hook
 * 極速版本：優先信任 LocalStorage 快取，背景驗證 Session
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
    isInitialized: boolean;
}

export function useAuth() {
    // 1. 初始化狀態：同步讀取 LocalStorage，如果存在則視為已登入 (Optimistic UI)
    const [state, setState] = useState<AuthState>(() => {
        let initialUser = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.user) {
                    initialUser = parsed.user;
                }
            }
        } catch (e) { }

        // 如果有緩存使用者，立即設為 isLoading: false，讓 UI 先渲染
        return {
            user: initialUser,
            coach: null,
            isLoading: !initialUser, // 如果有快取就不轉圈
            error: null,
            isInitialized: !!initialUser
        };
    });

    const mountedRef = useRef(true);

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

    // 背景驗證與資料補全
    useEffect(() => {
        mountedRef.current = true;
        let isValidationDone = false;

        const validateSession = async () => {
            try {
                // 即使 UI 已經渲染，仍需驗證 Session 有效性
                // 加入 5 秒超時避免背景驗證卡住導致狀態不一致
                const authPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AuthTimeout')), 5000)
                );

                const result = await Promise.race([authPromise, timeoutPromise]) as any;
                const session = result?.data?.session;

                if (!mountedRef.current) return;

                if (session?.user) {
                    // Session 有效
                    // 如果原本沒 User 或 User 不同，更新狀態
                    const shouldFetchCoach = !state.coach || state.user?.id !== session.user.id;

                    if (shouldFetchCoach) {
                        const coachData = await fetchCoach(session.user.id);
                        if (mountedRef.current) {
                            setState({
                                user: session.user,
                                coach: coachData,
                                isLoading: false,
                                error: null,
                                isInitialized: true
                            });
                        }
                    } else if (state.isLoading) {
                        // 如果只是單純 loading 狀態沒解掉
                        setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
                    }
                } else {
                    // Session 無效 (Cookie 過期或被登出)
                    // 如果原本以為有 User (Optimistic)，現在發現沒有 -> 需要踢出
                    if (state.user) {
                        console.warn('[useAuth] Cached session invalid, logging out...');
                        setState({
                            user: null,
                            coach: null,
                            isLoading: false,
                            error: { message: 'Session expired' } as AuthError,
                            isInitialized: true
                        });
                    } else {
                        setState(prev => ({ ...prev, isLoading: false, isInitialized: true, user: null }));
                    }
                }
            } catch (e: any) {
                console.warn('[useAuth] Background validation warning:', e.message);
                // 超時或錯誤：保持現狀。如果原本是 Optimistic User，就讓他繼續用（假設離線）
                if (mountedRef.current) {
                    setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
                }
            } finally {
                isValidationDone = true;
            }
        };

        validateSession();

        // 監聽 Auth 變化 (Sign Out, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mountedRef.current) return;
                console.log('[useAuth] Event:', event);

                if (event === 'SIGNED_OUT') {
                    setState({ user: null, coach: null, isLoading: false, error: null, isInitialized: true });
                } else if (session?.user && isValidationDone) {
                    // 只有在初始化驗證完成後，才處理更新，避免 Race Condition
                    if (state.user?.id !== session.user.id) {
                        const coachData = await fetchCoach(session.user.id);
                        if (mountedRef.current) {
                            setState({
                                user: session.user,
                                coach: coachData,
                                isLoading: false,
                                error: null,
                                isInitialized: true
                            });
                        }
                    }
                }
            }
        );

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
        };
    }, []); // 移除依賴，確保只執行一次

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
        // 先清空狀態讓 UI 反應
        setState({ user: null, coach: null, isLoading: false, error: null, isInitialized: true });
        // 清除 LocalStorage
        localStorage.removeItem(STORAGE_KEY);
        // 背景執行
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
