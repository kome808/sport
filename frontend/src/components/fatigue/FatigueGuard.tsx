import { usePlayerFatigue } from '@/hooks/useFatigue';
import { IndicatorCard } from './IndicatorCard';
import { DataCompletenessBar } from './DataCompletenessBar';
import { INDICATOR_CONFIG } from '@/types/fatigue';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FatigueGuardProps {
    playerId: string;
    date: string; // YYYY-MM-DD
    className?: string;
}

const OVERALL_RISK_CONFIG: Record<number, { label: string, color: string, bg: string, icon: string }> = {
    0: { label: '資料不足', color: 'text-slate-500', bg: 'bg-slate-100', icon: '⚪' },
    1: { label: '狀態良好', color: 'text-green-600', bg: 'bg-green-100', icon: '🟢' },
    2: { label: '需注意', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '🟡' },
    3: { label: '高風險', color: 'text-red-600', bg: 'bg-red-100', icon: '🔴' },
};

export function FatigueGuard({ playerId, date, className }: FatigueGuardProps) {
    const { data, isLoading, error, refetch, isRefetching } = usePlayerFatigue(playerId, date);

    if (isLoading) {
        return <FatigueGuardSkeleton />;
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive space-y-2">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <h5 className="font-medium leading-none tracking-tight">載入失敗</h5>
                </div>
                <div className="text-sm opacity-90">
                    無法載入疲勞監測數據。
                    <Button variant="link" onClick={() => refetch()} className="px-0 ml-2 h-auto text-destructive underline font-bold">
                        重試
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { overall_level, cause, is_rest_day, completeness, metrics } = data;

    // 休息日特殊處理
    if (is_rest_day) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="p-6 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-center">
                    <h3 className="text-xl font-bold mb-2">🔵 今日為休息日</h3>
                    <p className="opacity-80">無須進行高強度訓練，建議進行伸展或放鬆。</p>

                    {/* 依舊顯示完整度，因為可能需要填 RHR/Wellness */}
                    <div className="mt-4 max-w-sm mx-auto">
                        <DataCompletenessBar completeness={completeness} className="bg-white/50 border-blue-100" />
                    </div>
                </div>
            </div>
        );
    }

    const riskConfig = OVERALL_RISK_CONFIG[overall_level] || OVERALL_RISK_CONFIG[0];

    return (
        <div className={cn("space-y-6", className)}>
            {/* 1. Header: Overall Status */}
            <div className={cn(
                "rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors border",
                riskConfig.bg,
                overall_level === 3 ? "border-red-300 ring-4 ring-red-50" : "border-slate-100"
            )}>
                <div className="mb-2 text-4xl animate-bounce-slow">
                    {riskConfig.icon}
                </div>
                <h2 className={cn("text-2xl font-bold mb-1", riskConfig.color)}>
                    {riskConfig.label}
                </h2>

                {cause && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 text-sm font-semibold text-slate-700 shadow-sm mt-2">
                        ⚠️ 主因：{INDICATOR_CONFIG[cause.toLowerCase() as keyof typeof INDICATOR_CONFIG]?.fullLabel || cause}
                    </div>
                )}

                <div className="absolute top-4 right-4">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="h-8 w-8 opacity-50 hover:opacity-100"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* 2. Metrics Grid (2x2) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <IndicatorCard
                    metric={metrics.acwr}
                    config={INDICATOR_CONFIG.acwr}
                    isWorst={cause === 'ACWR'}
                />
                <IndicatorCard
                    metric={metrics.rhr}
                    config={INDICATOR_CONFIG.rhr}
                    isWorst={cause === 'RHR'}
                />
                <IndicatorCard
                    metric={metrics.wellness}
                    config={INDICATOR_CONFIG.wellness}
                    isWorst={cause === 'Wellness'}
                />
                <IndicatorCard
                    metric={metrics.srpe}
                    config={INDICATOR_CONFIG.srpe}
                    isWorst={cause === 'sRPE'}
                />
            </div>

            {/* 3. Completeness */}
            <DataCompletenessBar completeness={completeness} />
        </div>
    );
}

function FatigueGuardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
        </div>
    );
}
