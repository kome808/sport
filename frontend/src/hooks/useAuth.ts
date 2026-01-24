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
        const { data, error } = await supabase
            .schema(SCHEMA_NAME)
            .from('coaches')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Fetch coach error:', error);
            return null;
        }
        return data;
    };

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (cancelled) return;
                if (sessionError) throw sessionError;

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
                    setState({
                        user: null,
                        coach: null,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (e: any) {
                console.error('Auth init error:', e);
                if (!cancelled) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (cancelled) return;

                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                    const coachData = await fetchCoach(session.user.id);
                    if (cancelled) return;

                    setState({
                        user: session.user,
                        coach: coachData,
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
                options: {
                    data: { name },
                },
            });

            if (authError) return { success: false, error: authError };

            if (authData.user) {
                await supabase
                    .schema(SCHEMA_NAME)
                    .from('coaches')
                    .upsert({
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
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            return { success: !error, error };
        } catch (e: any) {
            return { success: false, error: { message: e.message } as AuthError };
        }
    }, []);

    return {
        ...state,
        isAuthenticated: !!state.user,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
    };
}
