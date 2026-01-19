import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { MetricDetail, RiskLevel } from '@/types/fatigue';

interface IndicatorConfig {
    label: string;
    unit: string;
    fullLabel: string;
}

interface IndicatorCardProps {
    metric: MetricDetail;
    config: IndicatorConfig;
    isWorst: boolean; // 是否為造成最高風險的指標
    onClick?: () => void;
}

const LEVEL_STYLES: Record<RiskLevel, string> = {
    0: 'border-slate-200 bg-slate-50 text-slate-400', // Missing
    1: 'border-green-200 bg-green-50/50 text-green-700', // Green
    2: 'border-yellow-200 bg-yellow-50/50 text-yellow-700', // Yellow
    3: 'border-red-200 bg-red-50/50 text-red-700', // Red
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
    0: '未填寫',
    1: '安全區',
    2: '注意',
    3: '高風險',
};

export function IndicatorCard({ metric, config, isWorst, onClick }: IndicatorCardProps) {
    const { value, level } = metric;
    const style = LEVEL_STYLES[level];

    // 如果是最差指標，且風險顯示不為綠色/缺失，則加強樣式
    const isHighlight = isWorst && level > 1;

    return (
        <Card
            className={cn(
                "relative transition-all duration-200 cursor-pointer overflow-hidden",
                style,
                isHighlight ? "border-2 shadow-md ring-2 ring-offset-1 ring-red-100" : "border",
                metric.level === 0 && "opacity-60 grayscale"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4 flex items-center justify-between">
                {/* Left: Label & Status */}
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium opacity-80 flex items-center gap-1">
                        {config.label}
                        {isHighlight && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                        {LEVEL_LABELS[level]}
                    </span>
                    {metric.level === 0 && (
                        <span className="text-[10px] text-slate-400">尚無數據</span>
                    )}
                </div>

                {/* Right: Value */}
                <div className="text-right">
                    {value !== null ? (
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-2xl font-bold tracking-tight">
                                {value}
                            </span>
                            <span className="text-xs font-medium opacity-60">
                                {config.unit}
                            </span>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold opacity-20">--</div>
                    )}
                </div>
            </CardContent>

            {/* Highlight Badge for Worst Case */}
            {isHighlight && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                    主因
                </div>
            )}

            {/* Safe Badge */}
            {level === 1 && (
                <div className="absolute top-2 right-2 opacity-20">
                    <CheckCircle className="w-8 h-8" />
                </div>
            )}
        </Card>
    );
}
