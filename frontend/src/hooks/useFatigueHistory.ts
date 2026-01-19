import { useQuery } from '@tanstack/react-query';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';

export interface FatigueHistoryPoint {
    date: string;
    acwr: number | null;
    acuteLoad: number | null;
    chronicLoad: number | null;
    risk_level: string;
}

export function useFatigueHistory(
    playerId: string | undefined,
    days: number = 14,
    endDate: Date = new Date()
) {
    const endDateStr = endDate.toISOString().split('T')[0];

    return useQuery({
        queryKey: ['fatigueHistory', playerId, days, endDateStr],
        queryFn: async () => {
            if (!playerId) return [];

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .rpc('get_player_fatigue_history', {
                    p_player_id: playerId,
                    p_days: days,
                    p_end_date: endDateStr
                });

            if (error) {
                console.error('Error fetching fatigue history:', error);
                throw error;
            }

            return data as FatigueHistoryPoint[];
        },
        enabled: !!playerId,
        staleTime: 5 * 60 * 1000,
    });
}
