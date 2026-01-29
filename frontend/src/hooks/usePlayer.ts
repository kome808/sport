/**
 * 球員端認證與資料存取 Hook
 * 處理球員登入驗證與 Session 管理
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { Player, DailyRecord, DailyRecordInput, PainReportInput } from '@/types';

// ================================================
// 型別定義
// ================================================

interface PlayerSession {
    playerId: string;
    teamSlug: string;
    playerName: string;
    jerseyNumber?: string;
    expiresAt: number;
}

const SESSION_KEY = 'player_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 小時

// ================================================
// Session 管理
// ================================================

export function usePlayerSession() {
    const [session, setSession] = useState<PlayerSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化時從 localStorage 讀取
    useEffect(() => {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            try {
                const parsed: PlayerSession = JSON.parse(stored);
                if (parsed.expiresAt > Date.now()) {
                    setSession(parsed);
                } else {
                    localStorage.removeItem(SESSION_KEY);
                }
            } catch {
                localStorage.removeItem(SESSION_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    // 登入 - 儲存 Session
    const login = useCallback((player: Player, teamSlug: string) => {
        const newSession: PlayerSession = {
            playerId: player.id,
            teamSlug,
            playerName: player.name,
            jerseyNumber: player.jersey_number,
            expiresAt: Date.now() + SESSION_DURATION,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
    }, []);

    // 登出 - 清除 Session
    const logout = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
    }, []);

    return {
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        logout,
    };
}

// ================================================
// 球員登入驗證（支援 short_code 或 UUID）
// ================================================

export function usePlayerLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            playerCode,
            password,
        }: {
            playerCode: string;
            password: string;
        }) => {
            const { data, error } = await supabase
                .rpc('login_player', {
                    player_code: playerCode,
                    password: password
                });

            if (error) {
                console.error('Login error:', error);
                throw new Error(error.message || '登入失敗');
            }

            // RPC returns JSONB, cast to Player
            return data as Player;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['player'] });
        },
    });
}

// ================================================
// 取得球員資料（支援 short_code 或 UUID）
// ================================================

export function usePlayer(playerCode: string | undefined) {
    return useQuery({
        queryKey: ['player', playerCode],
        queryFn: async () => {
            if (!playerCode) return null;

            // 判斷是 short_code（3 碼）還是 UUID
            const isShortCode = playerCode.length <= 10 && !playerCode.includes('-');

            let query = supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .select('id, team_id, name, jersey_number, position, short_code, avatar_url, status, is_active, is_claimed, height_cm, weight_kg, birth_date, created_at, updated_at')
                .eq('is_active', true);

            if (isShortCode) {
                query = query.eq('short_code', playerCode.toLowerCase());
            } else {
                query = query.eq('id', playerCode);
            }

            const { data, error } = await query.limit(1);

            if (error) throw error;
            return (data?.[0] as Player) || null;
        },
        enabled: !!playerCode,
    });
}

// ================================================
// 更新球員資料 (個人設定)
// ================================================

export function useUpdatePlayerProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playerId, oldPassword, name, jerseyNumber, position, height_cm, weight_kg, newPassword, birth_date }: any) => {
            const { data, error } = await supabase.rpc('update_player_profile', {
                player_id: playerId,
                old_password: oldPassword,
                name,
                jersey_number: jerseyNumber,
                position,
                height_cm: height_cm || null,
                weight_kg: weight_kg || null,
                new_password: newPassword || null,
                birth_date: birth_date || null
            });

            if (error) throw error;

            // RPC returns SETOF (array), extract first item
            return Array.isArray(data) ? data[0] : data;
        },
        onSuccess: (data) => {
            if (!data) return;

            // 更新 Session 儲存
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                const session = JSON.parse(stored);
                if (session.playerId === data.id) {
                    session.playerName = data.name;
                    session.jerseyNumber = data.jersey_number;
                    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
                }
            }

            // 強制刷新快取，讓頁面資料即時更新
            queryClient.invalidateQueries({ queryKey: ['player'] });

            // 如果是在球員個人首頁，通常也會用到這些 key
            queryClient.invalidateQueries({ queryKey: ['playerRecord'] });
        }
    });
}


export function usePlayerTodayRecord(playerId: string | undefined) {
    const today = format(new Date(), 'yyyy-MM-dd');

    return useQuery({
        queryKey: ['playerRecord', playerId, today],
        queryFn: async () => {
            if (!playerId) return null;

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('*')
                .eq('player_id', playerId)
                .eq('record_date', today)
                .limit(1);

            if (error) throw error;
            return (data?.[0] as DailyRecord) || null;
        },
        enabled: !!playerId,
    });
}

// ... (existing usePlayerTodayRecord)

export function usePlayerRecordByDate(playerId: string | undefined, date: Date) {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : null;

    return useQuery({
        queryKey: ['playerRecord', playerId, dateStr],
        queryFn: async () => {
            if (!playerId || !dateStr) return null;

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('*')
                .eq('player_id', playerId)
                .eq('record_date', dateStr)
                .limit(1);

            if (error) throw error;
            return (data?.[0] as DailyRecord) || null;
        },
        enabled: !!playerId && !!dateStr,
    });
}

// ================================================
// 取得球員歷史紀錄
// ================================================

// ================================================
// 取得球員歷史紀錄
// ================================================

interface DateRangeParams {
    days?: number;
    from?: Date;
    to?: Date;
}

export function usePlayerRecords(
    playerId: string | undefined,
    { days, from, to }: DateRangeParams = { days: 7 }
) {
    // 產生查詢 key (確保 dates 改變時 key 也改變)
    const startDateStr = from ? format(from, 'yyyy-MM-dd') : null;
    const endDateStr = to ? format(to, 'yyyy-MM-dd') : null;

    return useQuery({
        queryKey: ['playerRecords', playerId, days, startDateStr, endDateStr],
        queryFn: async () => {
            if (!playerId) return [];

            let query = supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('*')
                .eq('player_id', playerId)
                .order('record_date', { ascending: false });

            // 日期範圍篩選
            if (from && to) {
                // 自訂範圍
                query = query
                    .gte('record_date', format(from, 'yyyy-MM-dd'))
                    .lte('record_date', format(to, 'yyyy-MM-dd'));
            } else if (days) {
                // 固定天數 (預設)
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                const queryProto = format(startDate, 'yyyy-MM-dd');
                query = query.gte('record_date', queryProto);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data || []) as DailyRecord[];
        },
        enabled: !!playerId && ((!!days) || (!!from && !!to)),
    });
}

// ================================================
// 提交每日紀錄 (Upsert)
// ================================================


export function useSubmitDailyRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (record: DailyRecordInput) => {
            // 使用 upsert - 若當日已有紀錄則更新
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .upsert(record, {
                    onConflict: 'player_id,record_date',
                })
                .select()
                .limit(1);

            if (error) throw error;
            return data?.[0] as DailyRecord;
        },
        onSuccess: (_, variables) => {
            // 更新快取
            // 使用 invalidateQueries 預設的 exact: false，這樣可以匹配到 ['playerRecord', id, date] 的 key
            queryClient.invalidateQueries({
                queryKey: ['playerRecord', variables.player_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['playerRecords', variables.player_id],
            });
            queryClient.invalidateQueries({ queryKey: ['dailyRecords'] });
            queryClient.invalidateQueries({ queryKey: ['teamStats'] });
        },
    });
}

// ================================================
// 疼痛回報相關 Hooks
// ================================================

export function usePlayerPainReports(playerId: string | undefined) {
    return useQuery({
        queryKey: ['painReports', playerId],
        queryFn: async () => {
            if (!playerId) return [];

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('pain_reports')
                .select('*')
                .eq('player_id', playerId)
                .order('report_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as import('@/types').PainReport[];
        },
        enabled: !!playerId,
    });
}


export function useSubmitPainReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (report: PainReportInput) => {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('pain_reports')
                .insert(report)
                .select()
                .limit(1);

            if (error) throw error;
            return data?.[0] as import('@/types').PainReport;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['painReports', variables.player_id],
            });
        },
    });
}

export function useResolvePainReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reportId }: { reportId: string }) => {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('pain_reports')
                .update({
                    is_resolved: true,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', reportId)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate all pain reports queries
            queryClient.invalidateQueries({ queryKey: ['painReports'] });
            // Also invalidate team pain reports for dashboard
            queryClient.invalidateQueries({ queryKey: ['teamActivePainReports'] });
        },
    });
}
