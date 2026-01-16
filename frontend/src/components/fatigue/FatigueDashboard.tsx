import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MetricGauge from "./MetricGauge";
import MetricCard from "./MetricCard";
import MetricDetailDialog from "./MetricDetailDialog";
import { useFatigueMetrics } from "@/hooks/useFatigueMetrics";
import { AlertTriangle, TrendingUp, Heart, Activity, Brain, Battery, ShieldCheck } from "lucide-react";
import { FatigueRadarChart } from "./charts/FatigueRadarChart";
import { ACWRTrendChart } from "./charts/ACWRTrendChart";
import { Skeleton } from '@/components/ui/skeleton';

interface FatigueDashboardProps {
    playerId: string;
    variant?: 'full' | 'compact';
    className?: string;
}

export default function FatigueDashboard({
    playerId,
    variant = 'compact',
    className
}: FatigueDashboardProps) {
    const { data: metrics, isLoading, error } = useFatigueMetrics(playerId);
    const [selectedMetric, setSelectedMetric] = useState<'acwr' | 'psi' | 'rhr' | 'wellness' | 'srpe' | 'honesty' | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleMetricClick = (type: 'acwr' | 'psi' | 'rhr' | 'wellness' | 'srpe' | 'honesty') => {
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
        return (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div>
                    <h4 className="font-semibold">無法載入數據</h4>
                    <p className="text-sm opacity-90">請稍後再試，或聯絡管理員。</p>
                </div>
            </div>
        );
    }

    // ACWR 狀態條設定
    const acwrZones = [
        { max: 0.8, color: '#22c55e', label: 'Low' },
        { max: 1.3, color: '#22c55e', label: 'Safe' },
        { max: 1.5, color: '#eab308', label: 'Warning' },
        { max: 2.0, color: '#ef4444', label: 'High' }
    ];



    return (
        <div className={className}>
            {/* 1. Main Metrics Group (ACWR & PSI Parallel) */}
            <div className="mb-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ACWR Section */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/60 ring-2 ring-slate-50">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h2 className="text-base font-bold tracking-tight text-slate-800">負荷預警</h2>
                    </div>
                    <MetricCard
                        title="急慢性訓練負荷比 ACWR"
                        value={metrics.acwr.acwr ?? 'N/A'}
                        status={metrics.acwr.risk_level === 'gray' ? 'gray' : metrics.acwr.risk_level}
                        description={
                            metrics.acwr.risk_level === 'red' ? '⚠️ 高風險！建議立即降量' :
                                metrics.acwr.risk_level === 'yellow' ? '⚠️ 注意負荷增加速度' :
                                    metrics.acwr.risk_level === 'green' ? '✅ 負荷在安全範圍內' : '資料收集不足 (需7天)'
                        }
                        icon={<Activity className="h-5 w-5" />}
                        onInfoClick={() => handleMetricClick('acwr')}
                        className="border-2 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="mt-4">
                            <MetricGauge
                                value={metrics.acwr.acwr ?? 0}
                                min={0}
                                max={2.0}
                                zones={acwrZones}
                                showValue={false}
                            />
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 uppercase">
                                <span>短期負荷: {metrics.acwr.short_term_load}</span>
                                <span>長期趨勢: {metrics.acwr.long_term_load}</span>
                            </div>
                        </div>
                    </MetricCard>
                </div>

                {/* PSI Section */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/60 ring-2 ring-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-primary rounded-full" />
                            <h2 className="text-base font-bold tracking-tight text-slate-800">整體狀態分析</h2>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg"
                            onClick={() => handleMetricClick('psi')}
                        >
                            指標說明
                        </Button>
                    </div>

                    <div className="group bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 shadow-sm transition-all h-[130px] flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Battery className="h-4 w-4 text-primary" />
                                整體狀態指數 PSI
                            </h3>
                            {metrics.honesty.conflict_type !== 'none' && (
                                <Badge variant="destructive" className="animate-pulse gap-1 scale-75 origin-right">
                                    <AlertTriangle className="h-3 w-3" />
                                    異常
                                </Badge>
                            )}
                        </div>
                        <div className="relative">
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.psi.psi_score}</span>
                                <Badge variant="outline" className={cn(
                                    "px-2 py-0.5 text-[10px] font-black shadow-sm",
                                    metrics.psi.status === 'green' ? 'text-green-700 border-green-200 bg-green-50' :
                                        metrics.psi.status === 'yellow' ? 'text-yellow-700 border-yellow-200 bg-yellow-50' :
                                            'text-red-700 border-red-200 bg-red-50'
                                )}>
                                    {metrics.psi.status === 'green' ? '優秀' :
                                        metrics.psi.status === 'yellow' ? '中等' : '需休息'}
                                </Badge>
                            </div>
                            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-in-out",
                                        metrics.psi.psi_score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                            metrics.psi.psi_score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                                'bg-gradient-to-r from-red-400 to-red-600'
                                    )}
                                    style={{ width: `${metrics.psi.psi_score}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Honesty Alert (Compact) */}
            {metrics.honesty.conflict_type !== 'none' && (
                <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 shadow-sm">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-red-600 mt-1" />
                        <div>
                            <h4 className="text-sm font-black text-red-800">數據誠實度警示 Honesty</h4>
                            <p className="text-[11px] text-red-700 font-bold mt-1">
                                {metrics.honesty.message}。分數 {metrics.honesty.honesty_score}/100。
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-black text-red-700 border-red-200 hover:bg-red-100/50 hover:border-red-300 rounded-lg shrink-0"
                        onClick={() => handleMetricClick('honesty')}
                    >
                        指標說明
                    </Button>
                </div>
            )}

            {/* 3. Sub Metrics Grid (RHR, Wellness, sRPE) - Evenly Distributed */}
            <div className="my-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-200/60 ring-2 ring-slate-50">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-6 w-1 bg-info rounded-full" />
                    <h2 className="text-base font-bold tracking-tight text-slate-800">細節指標分析</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* RHR */}
                    <MetricCard
                        title="晨間心跳 RHR"
                        value={metrics.rhr.current_rhr ? `${metrics.rhr.current_rhr}` : '-'}
                        status={metrics.rhr.status === 'gray' ? 'gray' :
                            metrics.rhr.status === 'orange' ? 'orange' :
                                metrics.rhr.status as any}
                        description={metrics.rhr.difference ?
                            `${metrics.rhr.difference > 0 ? '+' : ''}${metrics.rhr.difference} bpm (較昨日)` :
                            '尚無基準數據'}
                        icon={<Heart className="h-4 w-4" />}
                        onInfoClick={() => handleMetricClick('rhr')}
                        centerValue={true}
                        className="shadow-sm border-slate-100"
                    />

                    {/* Wellness */}
                    <Card className="col-span-1 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl relative group">
                        <CardHeader className="p-4 pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black text-slate-800 flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-info" />
                                    身心狀態 Wellness
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-1.5 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg"
                                    onClick={() => handleMetricClick('wellness')}
                                >
                                    指標說明
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 pr-2 flex justify-center items-center h-[180px]">
                            {metrics.wellness && metrics.wellness.items ? (
                                <div className="flex items-center w-full px-4 gap-2">
                                    <div className="flex flex-col items-center justify-center shrink-0 border-r border-slate-100 pr-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">總分</span>
                                        <span className={cn(
                                            "text-3xl font-black tracking-tighter",
                                            metrics.wellness.total >= 20 ? "text-green-500" :
                                                metrics.wellness.total >= 15 ? "text-yellow-500" : "text-red-500"
                                        )}>
                                            {metrics.wellness.total}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">/ 25</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <FatigueRadarChart
                                            data={metrics.wellness.items}
                                            variant="compact"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-xs font-bold">無詳細數據</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* sRPE */}
                    <MetricCard
                        title="今日訓練負荷 sRPE"
                        value={metrics.srpe ? `${metrics.srpe.load_au}` : '-'}
                        status={metrics.srpe?.status || 'gray'}
                        description={metrics.srpe?.status === 'red' ? '⚠️ 今日負荷極高' : '負荷強度適中 AU'}
                        icon={<TrendingUp className="h-4 w-4" />}
                        onInfoClick={() => handleMetricClick('srpe')}
                        centerValue={true}
                        className="shadow-sm border-slate-100"
                    />
                </div>
            </div>

            {/* 4. Honesty Alert (Bottom) */}
            {metrics.honesty.conflict_type !== 'none' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 shadow-sm">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-red-600 mt-1" />
                        <div>
                            <h4 className="text-sm font-black text-red-800">數據誠實度警示 Honesty</h4>
                            <p className="text-xs text-red-700 font-bold mt-1 leading-relaxed">
                                {metrics.honesty.message}。除此之外，誠實度分數為 {metrics.honesty.honesty_score}/100。
                                請教練確認今日回報是否準確，或與球員面談。
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-black text-red-700 border-red-200 hover:bg-red-100/50 hover:border-red-300 rounded-lg shrink-0"
                        onClick={() => handleMetricClick('honesty')}
                    >
                        指標說明
                    </Button>
                </div>
            )}

            {/* 5. Historical Trend (Full Mode Only) */}
            {variant === 'full' && (
                <div className="mt-6">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                負荷趨勢分析 (近 14 天)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                顯示 ACWR 與訓練負荷的歷史變化
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px]">
                            {/* DEMO DATA: 由於後端尚未支援歷史數據，此處使用模擬數據展示 */}
                            <ACWRTrendChart historyData={Array.from({ length: 14 }).map((_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (13 - i));
                                const dateStr = d.toISOString().split('T')[0];
                                return {
                                    date: dateStr,
                                    acwr: 0.8 + Math.random() * 1.0, // 0.8 - 1.8
                                    chronicLoad: 300 + Math.random() * 100,
                                    acuteLoad: 300 + Math.random() * 300
                                };
                            })} />
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
