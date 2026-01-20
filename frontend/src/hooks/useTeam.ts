/**
 * 球隊資料 Hook
 * 處理球隊相關的資料存取
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { Team, Player, FatigueMetrics } from '@/types';

// ================================================
// Query Keys
// ================================================

export const teamKeys = {
    all: ['teams'] as const,
    bySlug: (slug: string) => [...teamKeys.all, slug] as const,
    players: (teamId: string) => ['players', teamId] as const,
    dailyRecords: (teamId: string, date?: string) => ['dailyRecords', teamId, date] as const,
    painReports: (teamId: string) => ['painReports', teamId] as const,
    notifications: (teamId: string) => ['notifications', teamId] as const,
};

// ================================================
// 取得球隊資料
// ================================================

export function useTeam(slug: string) {
    return useQuery({
        queryKey: teamKeys.bySlug(slug),
        queryFn: async () => {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('teams')
                .select('*')
                .eq('slug', slug)
                .limit(1);

            if (error) throw error;
            return data?.[0] as Team | null;
        },
        enabled: !!slug,
    });
}

// ================================================
// 取得球隊球員列表
// ================================================

export function usePlayers(teamId: string | undefined, status: 'active' | 'graduated' = 'active') {
    return useQuery({
        queryKey: [...teamKeys.players(teamId || ''), status],
        queryFn: async () => {
            if (!teamId) return [];

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .eq('is_active', true)
                .eq('status', status)
                .order('jersey_number', { ascending: true });

            if (error) throw error;
            return (data || []) as Player[];
        },
        enabled: !!teamId,
    });
}

// ================================================
// 取得球員每日紀錄 (含今日狀態)
// ================================================

export function usePlayersWithTodayStatus(teamId: string | undefined, status: 'active' | 'graduated' | 'all' = 'active') {
    return useQuery({
        queryKey: [...teamKeys.players(teamId || ''), 'withStatus', status],
        queryFn: async () => {
            if (!teamId) return [];

            const today = new Date().toISOString().split('T')[0];

            // 取得球員
            let query = supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .eq('is_active', true);

            if (status !== 'all') {
                query = query.eq('status', status);
            }

            const { data: players, error: playersError } = await query.order('jersey_number', { ascending: true });

            if (playersError) throw playersError;

            // 取得今日紀錄
            const { data: records, error: recordsError } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('*')
                .eq('record_date', today)
                .in('player_id', (players || []).map(p => p.id));

            if (recordsError) throw recordsError;

            // 取得未解決的疼痛回報
            const { data: pains, error: painsError } = await supabase
                .schema(SCHEMA_NAME)
                .from('pain_reports')
                .select('*')
                .eq('is_resolved', false)
                .in('player_id', (players || []).map(p => p.id));

            if (painsError) throw painsError;

            // 組合資料
            return (players || []).map(player => {
                const todayRecord = records?.find(r => r.player_id === player.id);
                const activePains = pains?.filter(p => p.player_id === player.id) || [];

                return {
                    ...player,
                    todayRecord,
                    activePains,
                    hasReportedToday: !!todayRecord,
                    riskLevel: todayRecord?.risk_level || null,
                };
            });
        },
        enabled: !!teamId,
    });
}

// ================================================
// 取得球隊統計資料 (儀表板用)
// ================================================

export function useTeamStats(teamId: string | undefined) {
    return useQuery({
        queryKey: ['teamStats', teamId],
        queryFn: async () => {
            if (!teamId) return null;

            const today = new Date().toISOString().split('T')[0];

            // 取得球員數
            const { count: playerCount } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)
                .eq('is_active', true);

            // 取得今日回報數
            const { data: players } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .select('id')
                .eq('team_id', teamId)
                .eq('is_active', true);

            const playerIds = (players || []).map(p => p.id);

            const { count: reportedCount } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('*', { count: 'exact', head: true })
                .eq('record_date', today)
                .in('player_id', playerIds);

            // 取得各風險等級分佈
            const { data: riskData } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('risk_level')
                .eq('record_date', today)
                .in('player_id', playerIds);

            const riskCounts = {
                green: 0,
                yellow: 0,
                red: 0,
                black: 0,
            };

            (riskData || []).forEach(r => {
                if (r.risk_level && r.risk_level in riskCounts) {
                    riskCounts[r.risk_level as keyof typeof riskCounts]++;
                }
            });

            // 取得未解決疼痛數
            const { count: painCount } = await supabase
                .schema(SCHEMA_NAME)
                .from('pain_reports')
                .select('*', { count: 'exact', head: true })
                .eq('is_resolved', false)
                .in('player_id', playerIds);

            // 未讀通知數
            const { count: notificationCount } = await supabase
                .schema(SCHEMA_NAME)
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)
                .eq('is_read', false);

            return {
                playerCount: playerCount || 0,
                reportedCount: reportedCount || 0,
                unreportedCount: (playerCount || 0) - (reportedCount || 0),
                reportRate: playerCount ? Math.round(((reportedCount || 0) / playerCount) * 100) : 0,
                riskCounts,
                painCount: painCount || 0,
                notificationCount: notificationCount || 0,
            };
        },
        enabled: !!teamId,
        refetchInterval: 30000, // 每 30 秒更新
    });
}

// ================================================
// 取得高風險球員列表
// ================================================

export function useHighRiskPlayers(teamId: string | undefined) {
    return useQuery({
        queryKey: ['highRiskPlayers', teamId],
        queryFn: async () => {
            if (!teamId) return [];

            const today = new Date().toISOString().split('T')[0];

            // 取得球員
            const { data: players } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .eq('is_active', true);

            const playerIds = (players || []).map(p => p.id);

            // 取得今日紀錄中的紅色和黑色風險
            const { data: records } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('*')
                .eq('record_date', today)
                .in('player_id', playerIds)
                .in('risk_level', ['red', 'black']);

            // 組合資料
            return (records || []).map(record => {
                const player = players?.find(p => p.id === record.player_id);
                return {
                    ...record,
                    player,
                };
            }).sort((a, b) => {
                // 黑色排前面，然後按 ACWR 排序
                if (a.risk_level === 'black' && b.risk_level !== 'black') return -1;
                if (a.risk_level !== 'black' && b.risk_level === 'black') return 1;
                return (b.acwr || 0) - (a.acwr || 0);
            });
        },
        enabled: !!teamId,
    });
}

// ================================================
// 取得通知列表
// ================================================

export function useNotifications(teamId: string | undefined) {
    return useQuery({
        queryKey: teamKeys.notifications(teamId || ''),
        queryFn: async () => {
            if (!teamId) return [];

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('notifications')
                .select('*, player:player_id(id, name, jersey_number)')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data || [];
        },
        enabled: !!teamId,
    });
}

// ================================================
// 標記通知為已讀
// ================================================

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['teamStats'] });
        },
    });
}

// ================================================
// 新增球員
// ================================================

export function useAddPlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (player: Partial<Player> & { team_id: string }) => {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .insert(player)
                .select()
                .limit(1);

            if (error) throw error;
            return data?.[0];
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: teamKeys.players(variables.team_id) });
            queryClient.invalidateQueries({ queryKey: ['teamStats'] });
        },
    });
}

// ================================================
// 更新球員
// ================================================

export function useUpdatePlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Player> & { id: string }) => {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .update(updates)
                .eq('id', id)
                .select()
                .limit(1);

            if (error) throw error;
            return data?.[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['players'] });
        },
    });
}

// ================================================
// 刪除球員 (軟刪除)
// ================================================

export function useDeletePlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playerId: string) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .update({ is_active: false })
                .eq('id', playerId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['players'] });
            queryClient.invalidateQueries({ queryKey: ['teamStats'] });
        },
    });
}

// ================================================
// 批次新增球員
// ================================================

export function useBatchAddPlayers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ team_id, players }: { team_id: string; players: Partial<Player>[] }) => {
            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .insert(players.map(p => ({ ...p, team_id })))
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: teamKeys.players(variables.team_id) });
            queryClient.invalidateQueries({ queryKey: ['teamStats'] });
        },
    });
}

// ================================================
// 批次更新球員狀態
// ================================================

export function useBatchUpdatePlayersStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playerIds, status }: { playerIds: string[]; status: 'active' | 'graduated' }) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .update({ status })
                .in('id', playerIds);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['players'] });
        },
    });
}

// ================================================
// 批次刪除球員 (軟刪除)
// ================================================

export function useBatchDeletePlayers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playerIds: string[]) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('players')
                .update({ is_active: false })
                .in('id', playerIds);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['players'] });
            queryClient.invalidateQueries({ queryKey: ['teamStats'] });
        },
    });
}

// ================================================
// 更新球隊邀請設定
// ================================================

export function useUpdateTeamInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ teamId, code, enabled }: { teamId: string; code: string | null; enabled: boolean }) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('teams')
                .update({
                    invitation_code: code,
                    is_invitation_enabled: enabled,
                })
                .eq('id', teamId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
        },
    });
}

// ================================================
// 更新球隊基本資料
// ================================================

export function useUpdateTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ teamId, updates }: { teamId: string; updates: Partial<Team> }) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('teams')
                .update(updates)
                .eq('id', teamId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
        },
    });
}

// ================================================
// 取得全隊疲勞指標 (Dashboard 用)
// ================================================

export interface TeamFatigueData {
    player: {
        id: string;
        name: string;
        jersey_number: number;
        avatar_url: string | null;
        position: string | null;
        short_code: string; // 新增短代碼
    };
    metrics: FatigueMetrics;
}

export function useTeamFatigueOverview(teamId: string | undefined) {
    return useQuery({
        queryKey: ['teamFatigue', teamId],
        queryFn: async () => {
            if (!teamId) return [];

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .rpc('get_team_fatigue_overview', {
                    p_team_id: teamId,
                    p_date: new Date().toISOString().split('T')[0]
                });

            if (error) throw error;

            // 轉換後端回傳的數字 Level 為前端使用的字串
            const rawData = data || [];
            return rawData.map((item: any) => {
                // 確保 metrics 存在且結構正確
                const metrics = item.metrics || {};

                // 後端現在直接回傳 'red'|'yellow'|'green'|'gray' 字串，無需再做數字轉換
                // 但為了安全起見，我們還是給個預設值
                return {
                    ...item,
                    metrics: {
                        acwr: {
                            ...metrics.acwr,
                            risk_level: metrics.acwr?.risk_level || 'gray'
                        },
                        rhr: {
                            ...metrics.rhr,
                            risk_level: metrics.rhr?.status || 'gray' // 注意：Player Metrics 那邊是用 status 欄位
                        },
                        wellness: {
                            ...metrics.wellness,
                            risk_level: metrics.wellness?.status || 'gray'
                        },
                        srpe: {
                            ...metrics.srpe,
                            risk_level: metrics.srpe?.status || 'gray'
                        },
                    }
                };
            }) as TeamFatigueData[];
        },
        enabled: !!teamId,
        refetchInterval: 60000, // 每分鐘更新
    });
}

// ================================================
// 取得球隊未解決傷病列表 (Dashboard 用)
// ================================================

export function useTeamActivePainReports(teamId: string | undefined) {
    return useQuery({
        queryKey: teamKeys.painReports(teamId || ''),
        queryFn: async () => {
            if (!teamId) return [];

            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

            const twoDaysAgo = new Date(today.getTime() - 48 * 60 * 60 * 1000).toISOString();

            // 1. Fetch Active Pain Reports OR Recently Resolved (48h)
            const { data: painData, error: painError } = await supabase
                .schema(SCHEMA_NAME)
                .from('pain_reports')
                .select('*, player:players!inner(id, name, jersey_number, short_code)')
                .eq('player.team_id', teamId)
                .or(`is_resolved.eq.false,resolved_at.gt.${twoDaysAgo}`)
                .order('report_date', { ascending: false });

            if (painError) throw painError;

            // 2. Fetch Recent Illness from Daily Records (last 7 days)
            // Note: Currently we assume illness is temporary and show records from last 7 days.
            // Ideally we should have is_resolved flag for illness too.
            const { data: illnessData, error: illnessError } = await supabase
                .schema(SCHEMA_NAME)
                .from('daily_records')
                .select('id, record_date, feedback, player:players!inner(id, name, jersey_number, short_code)')
                .eq('player.team_id', teamId)
                .gte('record_date', sevenDaysAgoStr) // Last 7 days
                .not('feedback', 'is', null)
                .order('record_date', { ascending: false });

            if (illnessError) throw illnessError;

            // Filter daily records that actually have illness tag or doctor note
            const illnessReports = (illnessData || []).reduce((acc: any[], r) => {
                if (!r.feedback) return acc;

                const illMatch = r.feedback.match(/\[生病: (.*?)\] (.*?)(?=\n\n|$)/s);
                const docMatch = r.feedback.match(/\[醫囑\] (.*?)(?=\n\n|$)/s);

                if (illMatch) {
                    acc.push({
                        id: `ill-${r.id}`, // Virtual ID
                        report_date: r.record_date,
                        player: r.player,
                        body_part: illMatch[1], // e.g. "感冒" - direct Use Chinese label
                        pain_level: 0,
                        description: illMatch[2], // e.g. "流鼻水" - description only
                        doctor_note: docMatch ? docMatch[1] : null,
                        type: 'illness',
                        is_resolved: false,
                    });
                } else if (docMatch) {
                    // Case: Doctor note only (no illness tag)
                    acc.push({
                        id: `doc-${r.id}`,
                        report_date: r.record_date,
                        player: r.player,
                        body_part: '醫囑',
                        pain_level: 0,
                        description: '',
                        doctor_note: docMatch[1],
                        type: 'illness', // Treat as illness/medical type
                        is_resolved: false,
                    });
                }

                return acc;
            }, []);

            // Merge and sort
            const combined = [...(painData || []), ...illnessReports].sort((a, b) => {
                return new Date(b.report_date).getTime() - new Date(a.report_date).getTime();
            });

            return combined;
        },
        enabled: !!teamId,
    });
}

