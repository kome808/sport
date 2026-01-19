import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PlayerFatigueStatus } from '@/types/fatigue';

/**
 * 取得球員疲勞監測狀態 (FatigueGuard 2.0)
 * @param playerId 球員 ID
 * @param date 日期字串 (YYYY-MM-DD)
 */
export function usePlayerFatigue(playerId: string | undefined, date: string) {
    return useQuery({
        queryKey: ['fatigueStatus', playerId, date],
        queryFn: async () => {
            if (!playerId || !date) return null;

            // 呼叫後端 RPC 函數
            // 注意: 型別尚未自動產生，這裡使用 unknown 強制轉型
            const { data, error } = await supabase
                .rpc('get_player_fatigue_status', {
                    p_player_id: playerId,
                    p_date: date
                });

            if (error) {
                console.error('Fatigue fetch error:', error);
                throw error;
            }

            // 強制轉型為我們手動定義的介面
            // 轉換後端回傳的數字 Level 為前端使用的字串
            const mapLevel = (level: number) => {
                if (level === 3) return 'red';
                if (level === 2) return 'yellow';
                if (level === 1) return 'green';
                return 'gray';
            };

            const rawData: any = data;
            const metrics = rawData?.metrics || {};

            const transformedData: PlayerFatigueStatus = {
                ...rawData,
                metrics: {
                    acwr: { ...metrics.acwr, risk_level: mapLevel(metrics.acwr?.level || 0) },
                    rhr: { ...metrics.rhr, risk_level: mapLevel(metrics.rhr?.level || 0) },
                    wellness: { ...metrics.wellness, risk_level: mapLevel(metrics.wellness?.level || 0) },
                    srpe: { ...metrics.srpe, risk_level: mapLevel(metrics.srpe?.level || 0) },
                }
            };

            return transformedData;
        },
        enabled: !!playerId && !!date,
        staleTime: 5 * 60 * 1000, // 5 分鐘快取
    });
}
