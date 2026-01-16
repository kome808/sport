import { useQuery } from '@tanstack/react-query';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { FatigueMetrics } from '@/types';

export function useFatigueMetrics(
    playerId: string | undefined,
    targetDate: Date = new Date()
) {
    // 轉為 YYYY-MM-DD
    const dateStr = targetDate.toISOString().split('T')[0];

    // 使用 RPC 呼叫
    return useQuery({
        queryKey: ['fatigueMetrics', playerId, dateStr],
        queryFn: async () => {
            if (!playerId) return null;

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .rpc('get_player_fatigue_metrics', {
                    p_player_id: playerId,
                    p_date: dateStr
                });

            if (error) {
                console.error('Error fetching fatigue metrics:', error);
                throw error;
            }

            return data as FatigueMetrics;
        },
        enabled: !!playerId,
        staleTime: 5 * 60 * 1000, // 5 分鐘快取
    });
}
