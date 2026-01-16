/**
 * 教練儀表板 - 戰情室
 * 顯示全隊訓練負荷概覽與高風險預警
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    Activity,
    Users,
    AlertTriangle,
    TrendingUp,
    Calendar,
    ChevronRight,
    Loader2,
    Database,
    Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeam, useTeamStats, useTeamFatigueOverview } from '@/hooks/useTeam';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    // 取得球隊資料
    const { data: team } = useTeam(teamSlug || '');
    const teamId = team?.id;

    // 取得統計資料
    const { data: stats, isLoading: statsLoading } = useTeamStats(teamId);

    // 取得全隊疲勞指標 (取代舊的 usePlayersWithTodayStatus 用於風險監控)
    const { data: fatigueData, isLoading: fatigueLoading } = useTeamFatigueOverview(teamId);

    // 狀態：測試數據生成
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // 處理填補測試數據
    const handleRegenerateData = async () => {
        if (!window.confirm('確定要重置並填補測試數據嗎？舊的測試數據將被清除。')) return;

        try {
            setIsGenerating(true);

            // 呼叫 RPC 函數重新生成數據
            const { error } = await supabase.rpc('regenerate_demo_data');

            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }

            setIsSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            console.error(err);
            alert('生成失敗，請檢查控制台或權限');
        } finally {
            setIsGenerating(false);
        }
    };

    // 載入中狀態
    if (statsLoading || fatigueLoading || !teamId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 排序數據：風險高的在前
    const sortedFatigueData = [...(fatigueData || [])].sort((a, b) => {
        const riskOrder = { red: 3, yellow: 2, green: 1, gray: 0 };
        const riskA = riskOrder[a.metrics.acwr.risk_level as keyof typeof riskOrder] || 0;
        const riskB = riskOrder[b.metrics.acwr.risk_level as keyof typeof riskOrder] || 0;
        return riskB - riskA;
    });

    return (
        <div className="space-y-8 pb-12">
            {/* 頁面標題 - Premium Style */}
            <div className="relative group overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm ring-8 ring-slate-100/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Activity className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">隊伍戰情室</h2>
                        </div>
                        <p className="text-slate-500 font-medium max-w-md">
                            即時監控全隊訓練負荷趨勢，透過科學數據預防運動傷害與過度疲勞。
                        </p>
                    </div>
                    <div className="flex items-center gap-3 relative z-20">
                        {/* 測試數據生成按鈕 (僅限測試球隊) */}
                        {teamSlug === 'doraemon-baseball' && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRegenerateData();
                                }}
                                disabled={isGenerating || isSuccess}
                                className={cn(
                                    "rounded-xl font-bold transition-all shadow-sm",
                                    isSuccess ? "border-green-500 text-green-600 bg-green-50" : "hover:bg-primary/5 border-slate-200"
                                )}
                            >
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : isSuccess ? (
                                    <Check className="mr-2 h-5 w-5" />
                                ) : (
                                    <Database className="mr-2 h-5 w-5" />
                                )}
                                {isGenerating ? '模擬數據生成中...' : isSuccess ? '數據已更新' : '填補測試數據'}
                            </Button>
                        )}
                        <Button variant="default" size="lg" className="rounded-xl font-bold shadow-md shadow-primary/20 bg-primary hover:bg-primary-hover">
                            <Calendar className="mr-2 h-5 w-5" />
                            本週報告
                        </Button>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-info/5 rounded-full blur-3xl" />
            </div>

            {/* 統計卡片 - 增加間距與陰影 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* 球員總數 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            在隊球員
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.playerCount || 0}</div>
                    </CardContent>
                </Card>

                {/* 今日回報率 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            今日回報率
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-success" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.reportRate || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.reportedCount}/{stats?.playerCount} 已回報
                        </p>
                    </CardContent>
                </Card>

                {/* 高風險預警 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            高風險預警
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-danger/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-danger" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(sortedFatigueData.filter(d => ['red'].includes(d.metrics.acwr.risk_level)).length)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">需要關注</p>
                    </CardContent>
                </Card>

                {/* 未解決疼痛 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            未解決疼痛
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.painCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">持續追蹤中</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* 高風險預警列表 */}
                <Card className="lg:col-span-1 border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50/80 border-b border-slate-200/50 p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">風險名單</CardTitle>
                                <CardDescription className="text-xs font-medium">需要立即關注的球員</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {sortedFatigueData.filter(d => ['red'].includes(d.metrics.acwr.risk_level)).length > 0 ? (
                                    sortedFatigueData
                                        .filter(d => ['red'].includes(d.metrics.acwr.risk_level))
                                        .map((data) => (
                                            <Link
                                                key={data.player.id}
                                                to={`/${teamSlug}/player/${data.player.id}`}
                                                className="block"
                                            >
                                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:shadow-md hover:shadow-red-500/5 transition-all group">
                                                    <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg bg-gradient-to-br from-risk-red/80 to-risk-red shadow-sm group-hover:scale-110 transition-transform">
                                                        {data.player.jersey_number}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-slate-800 group-hover:text-primary transition-colors">{data.player.name}</span>
                                                            <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100 font-bold">
                                                                ACWR {data.metrics.acwr.acwr || '-'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-wider">
                                                            High Risk Alert
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </Link>
                                        ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                            <Check className="h-8 w-8 text-green-500" />
                                        </div>
                                        <h4 className="font-bold text-slate-800">全員狀態良好</h4>
                                        <p className="text-xs text-slate-400 mt-1">目前沒有球員處於高風險區域 👍</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* 全隊訓練負荷熱力圖 */}
                <Card className="lg:col-span-2 border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50/80 border-b border-slate-200/50 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-info/10 rounded-xl flex items-center justify-center">
                                    <Users className="h-5 w-5 text-info" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">球員狀態分佈</CardTitle>
                                    <CardDescription className="text-xs font-medium">全隊負荷視覺化概覽</CardDescription>
                                </div>
                            </div>
                            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="bg-white p-1 rounded-xl border border-slate-200/50 shadow-inner">
                                <TabsList className="bg-transparent h-8 border-none gap-1">
                                    <TabsTrigger value="7d" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-xs font-bold">7 天</TabsTrigger>
                                    <TabsTrigger value="14d" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-xs font-bold">14 天</TabsTrigger>
                                    <TabsTrigger value="28d" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-xs font-bold">28 天</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {/* 簡化版熱力圖 - 球員卡片網格 */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                            {sortedFatigueData.map((data) => (
                                <Link
                                    key={data.player.id}
                                    to={`/${teamSlug}/player/${data.player.id}`}
                                    className="group"
                                >
                                    <div
                                        className={cn(
                                            "aspect-square rounded-2xl flex flex-col items-center justify-center text-white transition-all shadow-sm border border-white/20 relative group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-lg z-10",
                                            data.metrics.acwr.risk_level === 'red' ? 'bg-gradient-to-br from-risk-red to-red-600 shadow-red-200' :
                                                data.metrics.acwr.risk_level === 'yellow' ? 'bg-gradient-to-br from-risk-yellow to-yellow-600 shadow-yellow-200' :
                                                    data.metrics.acwr.risk_level === 'green' ? 'bg-gradient-to-br from-risk-green to-green-600 shadow-green-200' :
                                                        'bg-slate-100 border-slate-200'
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xl font-black tracking-tighter",
                                            data.metrics.acwr.risk_level === 'gray' ? 'text-slate-400' : 'text-white'
                                        )}>
                                            {data.player.jersey_number}
                                        </span>
                                        {data.metrics.acwr.acwr && (
                                            <span className="text-[9px] font-bold opacity-80 mt-0.5 tracking-tight uppercase">
                                                ACWR {data.metrics.acwr.acwr}
                                            </span>
                                        )}

                                        {/* 未回報標記: wellness 為 null 代表今日未回報 */}
                                        {!data.metrics.wellness && (
                                            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-slate-400 border-2 border-white shadow-sm ring-2 ring-slate-100 ring-offset-0 animate-pulse" title="今日未回報" />
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-center mt-2 truncate text-slate-500 group-hover:text-primary transition-colors">
                                        {data.player.name}
                                    </p>
                                </Link>
                            ))}
                        </div>

                        {/* 圖例 */}
                        <div className="flex items-center justify-center gap-6 mt-12 py-6 bg-slate-50 rounded-2xl border border-slate-100 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg bg-gradient-to-br from-risk-green to-green-600 shadow-sm shadow-green-200" />
                                <span className="text-xs font-bold text-slate-600">正常</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg bg-gradient-to-br from-risk-yellow to-yellow-600 shadow-sm shadow-yellow-200" />
                                <span className="text-xs font-bold text-slate-600">注意</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg bg-gradient-to-br from-risk-red to-red-600 shadow-sm shadow-red-200" />
                                <span className="text-xs font-bold text-slate-600">高風險</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg bg-slate-100 border border-slate-200 shadow-sm" />
                                <span className="text-xs font-bold text-slate-600">無資料</span>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-400 border border-white ring-2 ring-slate-200" />
                                <span className="text-xs font-bold text-slate-600">今日未回報</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
