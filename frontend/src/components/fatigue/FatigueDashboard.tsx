import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import MetricCard from "./MetricCard";
import MetricDetailDialog from "./MetricDetailDialog";
import { useFatigueMetrics } from "@/hooks/useFatigueMetrics";
import { useFatigueHistory } from "@/hooks/useFatigueHistory";
import { usePlayerRecords } from "@/hooks/usePlayer";
import { TrendingUp, Heart, Activity, Brain, Loader2, MessageSquare } from "lucide-react";
import { FatigueRadarChart } from "./charts/FatigueRadarChart";
import { ACWRTrendChart } from "./charts/ACWRTrendChart";
import { Skeleton } from '@/components/ui/skeleton';

interface FatigueDashboardProps {
    playerId: string;
    variant?: 'full' | 'compact';
    className?: string;
    todayDate?: string; // 加入固定日期支持
    hideFeedback?: boolean; // 新增：隱藏心得回饋
}

export default function FatigueDashboard({
    playerId,
    variant = 'compact',
    className,
    todayDate,
    hideFeedback = false
}: FatigueDashboardProps) {
    // 基準日期處理
    const baseDate = todayDate ? new Date(todayDate) : new Date();

    const { data: metrics, isLoading, error } = useFatigueMetrics(playerId, baseDate);
    const { data: historyData, isLoading: isHistoryLoading } = useFatigueHistory(playerId, 14, baseDate);

    // Get recent records for yesterday's comparison
    const threeDaysAgo = new Date(baseDate);
    threeDaysAgo.setDate(baseDate.getDate() - 3);
    const { data: recentRecords } = usePlayerRecords(playerId, {
        from: threeDaysAgo,
        to: baseDate
    });

    // Find latest feedback from recent records (sort descending by date)
    const latestFeedbackRecord = recentRecords
        ? [...recentRecords]
            .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
            .find(r => r.feedback && r.feedback.trim().length > 0)
        : null;

    const [selectedMetric, setSelectedMetric] = useState<'acwr' | 'rhr' | 'wellness' | 'srpe' | 'honesty' | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleMetricClick = (type: 'acwr' | 'rhr' | 'wellness' | 'srpe' | 'honesty') => {
        setSelectedMetric(type);
        setDialogOpen(true);
    };

    if (isLoading) {
        return <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        </div>;
    }

    if (error || !metrics) {
        return <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm font-bold">無法載入數據，請稍後再試。</div>;
    }


    // 計算 RHR 進度 (max 15 bpm)
    const rhrDiff = metrics.rhr.difference || 0;
    const rhrPercent = Math.min(100, Math.max(0, (rhrDiff + 4) * 10)); // Shift for visual

    // sRPE 週變化率進度 (max 20%)
    const loadPct = metrics.srpe?.pct_change || 0;
    const srpePercent = Math.min(100, Math.max(0, (loadPct / 20) * 100));

    // ACWR 進度 (max 2.5)
    // 0.8 is green start, 1.3 yellow, 1.5 red, 2.0 purple
    const acwrVal = metrics.acwr.acwr || 0;
    const acwrPercent = Math.min(100, (acwrVal / 2.5) * 100);

    return (
        <div className={className}>
            {/* Metrics 2x2 Grid */}
            <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                {/* 1. RHR */}
                <MetricCard
                    title="晨間心跳 RHR"
                    value={metrics.rhr.current_rhr ? `${metrics.rhr.current_rhr}` : '-'}
                    status={metrics.rhr.status === 'gray' ? 'gray' : metrics.rhr.status as any}
                    description={metrics.rhr.difference ?
                        `較基準線 ${metrics.rhr.difference > 0 ? '🔺 增加' : '🔻 減少'} ${Math.abs(metrics.rhr.difference)} bpm` :
                        '尚無基準數據'}
                    icon={<Heart className="h-4 w-4" />}
                    onInfoClick={() => handleMetricClick('rhr')}
                    centerValue={true}
                    className="h-full"
                >
                    <div className="w-full mt-4">
                        <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-200 relative">
                            {metrics.rhr.status !== 'gray' && (
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-700 shadow-sm",
                                        metrics.rhr.status === 'green' ? 'bg-[#53EF8B]' :
                                            metrics.rhr.status === 'red' ? 'bg-[#EF4F3B]' : 'bg-[#EFB954]'
                                    )}
                                    style={{ width: `${rhrPercent}%` }}
                                />
                            )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-black mt-1 px-0.5 uppercase tracking-tighter">
                            <span>+4bpm</span>
                            <span>良好</span>
                            <span>+9bpm</span>
                            <span>疲勞</span>
                            <span>+10bpm</span>
                        </div>
                    </div>
                </MetricCard>

                {/* 2. Wellness */}
                <MetricCard
                    title="身心狀態 WELLNESS"
                    value="" // Empty value to let radar take center
                    status={metrics.wellness?.status || 'gray'}
                    icon={<Brain className="h-4 w-4" />}
                    onInfoClick={() => handleMetricClick('wellness')}
                    centerValue={true}
                    className="h-full"
                >
                    <div className="relative w-full h-full flex items-center justify-center min-h-[260px] max-h-[300px] py-1">
                        {metrics.wellness && metrics.wellness.items ? (
                            <div className="relative w-full h-full max-w-[320px] max-h-[320px] flex items-center justify-center">
                                {/* Score Overlay in Middle of Radar */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center pointer-events-none w-14 h-14 rounded-full bg-white/60 backdrop-blur-md shadow-lg border-2 border-white/80">
                                    <span className={cn(
                                        "text-2xl font-black tracking-tighter leading-none",
                                        metrics.wellness.status === 'gray' ? "text-slate-400" :
                                            metrics.wellness.status === 'black' ? "text-white" :
                                                (metrics.wellness.z_score !== null && metrics.wellness.z_score < -2) ? "text-status-high-dark" :
                                                    (metrics.wellness.z_score !== null && metrics.wellness.z_score < -1) ? "text-status-med-dark" : "text-status-low-dark"
                                    )}>
                                        {metrics.wellness.total}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase mt-0.5">/ 50</span>
                                </div>
                                <div className="w-full h-full">
                                    <FatigueRadarChart data={metrics.wellness.items} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-300 font-black text-xs">暫無數據</div>
                        )}
                    </div>
                </MetricCard>

                {/* 3. sRPE */}
                <MetricCard
                    title="今日訓練負荷 sRPE"
                    value={metrics.srpe ? `${metrics.srpe.load_au}` : '-'}
                    status={metrics.srpe?.status || 'gray'}
                    description={
                        metrics.srpe?.status === 'gray' || metrics.srpe?.pct_change === null
                            ? '尚無基準數據'
                            : `週變化率 ${metrics.srpe.pct_change > 0 ? '+' : ''}${metrics.srpe.pct_change}%`
                    }
                    icon={<TrendingUp className="h-4 w-4" />}
                    onInfoClick={() => handleMetricClick('srpe')}
                    centerValue={true}
                    className="h-full"
                >
                    <div className="w-full mt-4">
                        <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-200 relative">
                            {metrics.srpe?.status !== 'gray' && (
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-700 shadow-sm",
                                        metrics.srpe?.status === 'green' ? 'bg-[#53EF8B]' :
                                            metrics.srpe?.status === 'red' ? 'bg-[#EF4F3B]' : 'bg-[#EFB954]'
                                    )}
                                    style={{ width: `${srpePercent}%` }}
                                />
                            )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-black mt-1 px-0.5 uppercase tracking-tighter">
                            <span>0%</span>
                            <span>穩定</span>
                            <span>10%</span>
                            <span>偏高</span>
                            <span>15%+</span>
                        </div>
                    </div>
                </MetricCard>

                {/* 4. ACWR */}
                <MetricCard
                    title="急慢性負荷比 ACWR"
                    value={metrics.acwr.acwr ?? 'N/A'}
                    status={metrics.acwr.risk_level === 'purple' ? 'black' : metrics.acwr.risk_level === 'gray' ? 'gray' : metrics.acwr.risk_level}
                    description={
                        metrics.acwr.risk_level === 'gray' || metrics.acwr.acwr === null ? '尚無基準數據' :
                            metrics.acwr.risk_level === 'purple' ? '🟣 極高風險 (≥ 2.0)' :
                                metrics.acwr.risk_level === 'red' ? '🔴 高風險區 (> 1.5)' :
                                    metrics.acwr.risk_level === 'yellow' ? '🟡 需注意 / 低負荷' :
                                        '🟢 狀態穩定 (Sweet Spot)'
                    }
                    icon={<Activity className="h-4 w-4" />}
                    onInfoClick={() => handleMetricClick('acwr')}
                    centerValue={true}
                    className="h-full"
                >
                    <div className="w-full mt-4">
                        <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-200 relative">
                            {metrics.acwr.risk_level !== 'gray' && metrics.acwr.acwr !== null && (
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-700 shadow-sm",
                                        metrics.acwr.risk_level === 'green' ? 'bg-[#53EF8B]' :
                                            metrics.acwr.risk_level === 'red' ? 'bg-[#EF4F3B]' :
                                                metrics.acwr.risk_level === 'purple' ? 'bg-purple-500' : 'bg-[#EFB954]'
                                    )}
                                    style={{ width: `${acwrPercent}%` }}
                                />
                            )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-black mt-1 px-0.5 uppercase tracking-tighter">
                            <span>0.8</span>
                            <span>安全</span>
                            <span>1.3</span>
                            <span>1.5</span>
                            <span>2.0+</span>
                        </div>
                    </div>
                </MetricCard>
            </div>

            {/* 3. History Trend (Title Styled to match others) */}
            {variant === 'full' && (
                <div className="mt-12">
                    <Card className="border-2 border-slate-100 overflow-hidden shadow-none">
                        <CardHeader className="bg-slate-50/10 p-5 border-b border-slate-100/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black text-slate-800 tracking-tight uppercase">負荷趨勢分析 (近 14 天)</CardTitle>
                                        <CardDescription className="text-[10px] font-bold text-slate-400 mt-0.5">顯示 ACWR 與歷史負荷變化軌跡</CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold h-5">
                                    {historyData?.length || 0} 天數據
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[340px] p-6 pt-2 flex items-center justify-center relative">
                            {isHistoryLoading ? (
                                <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
                            ) : historyData && historyData.length > 0 ? (
                                <ACWRTrendChart historyData={historyData as any} />
                            ) : (
                                <p className="text-sm font-bold text-slate-300">目前尚無足夠的歷史趨勢數據</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Latest Feedback Section */}
            {latestFeedbackRecord && !hideFeedback && (
                <div className="mt-6 mb-8">
                    <Card className="border-2 border-primary/20 bg-primary/5 overflow-hidden shadow-none">
                        <CardHeader className="bg-white/50 p-5 border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-primary text-white rounded-lg shadow-sm shadow-primary/30">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-slate-800 tracking-tight uppercase">回饋內容</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-primary/70 mt-0.5">
                                        {new Date(latestFeedbackRecord.record_date).toLocaleDateString('zh-TW')} 的留言
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                {latestFeedbackRecord.feedback}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <MetricDetailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                metricType={selectedMetric}
                data={metrics}
            />
        </div>
    );
}
