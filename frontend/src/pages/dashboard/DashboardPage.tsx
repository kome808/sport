/**
 * 教練儀表板 - 戰情室
 * 顯示全隊訓練負荷概覽與高風險預警
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Activity,
    Users,
    AlertTriangle,
    TrendingUp,
    Loader2,
    Database,
    Check,
    Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTeam, useTeamStats, useTeamFatigueOverview, usePlayers, useTeamActivePainReports } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Body Part Map
import { BODY_PATHS } from '@/components/player/BodyMapPaths';

// Body Part Map
const BODY_PART_MAP = BODY_PATHS.reduce((acc, part) => {
    acc[part.id] = part.name;
    return acc;
}, {} as Record<string, string>);
BODY_PART_MAP['other'] = '其他部位';

export default function DashboardPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const { isLoading: isAuthLoading, isInitialized, user } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // 重要：確保身份驗證徹底完成 (!isAuthLoading && isInitialized) 後才發起請求
    const isReady = !isAuthLoading && isInitialized && !!user;

    // 取得球隊資料
    const { data: team, isLoading: teamLoading, error: teamError } = useTeam((isReady && teamSlug) ? teamSlug : '');

    const teamId = team?.id;

    // 取得統計資料 (快取 1 分鐘，避免頻繁請求)
    const { data: stats, isLoading: statsLoading } = useTeamStats(isReady ? teamId : undefined);

    // 取得球員詳細資料
    const { data: players } = usePlayers(isReady ? teamId : undefined);

    // 取得全隊疲勞指標
    const { data: fatigueData, isLoading: fatigueLoading } = useTeamFatigueOverview(isReady ? teamId : undefined);

    // 取得現有傷病列表
    const { data: activePainReports } = useTeamActivePainReports(isReady ? teamId : undefined);

    // 狀態：測試數據生成與對話框
    const [isGenerating, setIsGenerating] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);


    // 清除測試數據 (僅限 doraemon-baseball)
    const handleClearData = async () => {
        setIsClearConfirmOpen(false);
        console.log(`handleClearData: Requesting wipe for team: ${teamSlug}`);

        try {
            setIsClearing(true);

            const { data, error: rpcError } = await supabase.rpc('clear_demo_data', {
                p_team_slug: teamSlug
            });

            if (rpcError) {
                console.error('RPC Error details:', rpcError);
                throw rpcError;
            }

            console.log('✅ Server response:', data);

            if (!data) {
                console.log('Backend returned no diagnostic data (old version?). Success assumed.');
                setIsSuccess(true);
                setTimeout(() => window.location.reload(), 1000);
                return;
            }

            if (data.status === 'error') {
                alert(`失敗: ${data.message}`);
            } else {
                console.log(`✓ 刪除筆數: 紀錄(${data.deleted_records || 0}), 疼痛(${data.deleted_pains || 0}), 通知(${data.deleted_notifications || 0})`);
                setIsSuccess(true);
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err) {
            console.error('Clear failed:', err);
            alert(`清除失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
        } finally {
            setIsClearing(false);
        }
    };

    // 處理填補測試數據
    const handleGenerateData = async () => {
        // ... (keep logic but fix RPC)
        setIsConfirmOpen(false);
        console.log('Starting data regeneration...');

        try {
            setIsGenerating(true);

            // 呼叫 RPC 函數重新生成數據
            console.log('Sending RPC request: regenerate_demo_data');
            const { data, error } = await supabase.rpc('regenerate_demo_data', { p_team_slug: teamSlug });

            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }

            console.log('RPC Success:', data);

            setIsSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            console.error('Catch Error:', err);
            // 這裡也可以考慮用 Toast 但先維持簡單
            alert('生成失敗，請檢查控制台或權限');
        } finally {
            setIsGenerating(false);
        }
    };

    // 載入中狀態 (包含身份驗證與資料抓取)
    if (isAuthLoading || (isReady && teamLoading)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-slate-600 font-black text-lg animate-pulse">正在載入戰情室...</p>
                        <div className="flex gap-3 text-[10px] font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                            <span className={cn(isAuthLoading ? "animate-pulse text-amber-500" : "text-emerald-500")}>
                                {isAuthLoading ? "● 驗證身分中..." : "✓ 身分已確認"}
                            </span>
                            <span className="w-[1px] h-3 bg-slate-200" />
                            <span className={cn((isReady && teamLoading) ? "animate-pulse text-amber-500" : (team ? "text-emerald-500" : "text-slate-300"))}>
                                {(isReady && teamLoading) ? `● 獲取球隊 [${teamSlug}]...` : (team ? "✓ 球隊已連接" : "等待連線")}
                            </span>
                        </div>
                    </div>

                    {/* 強制重整按鈕：如果卡住超過 5 秒 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-xs text-slate-400 hover:text-slate-600"
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                    >
                        卡住了？清除快取並重試
                    </Button>
                </div>
            </div>
        );
    }

    // 如果找不到球隊 (只有在身份驗證完成且查詢也完成後才判斷)
    if (isReady && !team) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
                <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">找不到球隊資料</h2>
                <div className="text-slate-500 max-w-md mb-8 space-y-2">
                    <p>網址路徑 <code className="bg-slate-100 px-1 py-0.5 rounded">/{teamSlug}</code> 無法對應到任何現有球隊。</p>
                    {teamError && <p className="text-xs text-red-500 font-mono">錯誤代碼: {(teamError as any)?.message || '連線逾時'}</p>}
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.reload()}>重新整理</Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>返回首頁</Button>
                </div>
            </div>
        );
    }

    // 如果球隊已找到但統計數據還在載入
    if (statsLoading || fatigueLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }


    // 排序數據：按照年齡大到小 (出生日期早到晚)
    const sortedFatigueData = [...(fatigueData || [])].sort((a, b) => {
        // 從 players 資料中查找詳細資訊 (含 birth_date)
        const playerA = players?.find(p => p.id === a.player.id);
        const playerB = players?.find(p => p.id === b.player.id);

        const birthA = playerA?.birth_date ? new Date(playerA.birth_date).getTime() : -1;
        const birthB = playerB?.birth_date ? new Date(playerB.birth_date).getTime() : -1;

        // 有生日的排前面
        if (birthA === -1 && birthB === -1) return 0;
        if (birthA === -1) return 1;
        if (birthB === -1) return -1;

        // 年紀大(出生早) -> 年紀小(出生晚)
        return birthA - birthB;
    });

    return (
        <div className="space-y-8 pb-12">

            {/* Top Action Bar - More subtle for admin actions */}
            {teamSlug === 'doraemon-baseball' && (
                <div className="flex justify-end gap-2 px-2">
                    <div className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isGenerating || isClearing}
                            onClick={() => setIsClearConfirmOpen(true)}
                            className="rounded-xl font-bold text-xs h-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                            {isClearing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                            清除測試數據
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isGenerating || isClearing}
                            onClick={() => setIsConfirmOpen(true)}
                            className={cn(
                                "rounded-xl font-bold text-xs h-9 transition-all",
                                isSuccess ? "text-green-600 bg-green-50" : "text-slate-400 hover:text-primary hover:bg-primary/5"
                            )}
                        >
                            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : isSuccess ? <Check className="h-3 w-3 mr-1" /> : <Database className="h-3 w-3 mr-1" />}
                            {isGenerating ? '生成中...' : isSuccess ? '已更新' : '填補測試數據'}
                        </Button>
                    </div>
                </div>
            )}

            {/* 統計卡片 - 增加間距與陰影 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* 球員總數 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            球隊球員數
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
                        <CardTitle className="text-sm font-bold text-slate-800">
                            今日回報率
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-success" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.reportRate || 0}%</div>
                        <p className="text-xs font-medium text-slate-600 mt-1">
                            {stats?.reportedCount}/{stats?.playerCount} 已回報
                        </p>
                    </CardContent>
                </Card>

                {/* 高風險預警 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            高風險預警
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-danger/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-danger" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(sortedFatigueData.filter(d =>
                            d.metrics.acwr.risk_level === 'red' ||
                            d.metrics.acwr.risk_level === 'black' ||
                            d.metrics.rhr.risk_level === 'red' ||
                            d.metrics.rhr.risk_level === 'black' ||
                            d.metrics.wellness?.risk_level === 'red' ||
                            d.metrics.wellness?.risk_level === 'black' ||
                            d.metrics.srpe?.risk_level === 'red'
                        ).length)}
                        <p className="text-xs font-medium text-slate-600 mt-1">需要關注</p>
                    </CardContent>
                </Card>

                {/* 未解決疼痛 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-800">
                            傷病名單
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.painCount || 0}</div>
                        <p className="text-xs font-medium text-slate-600 mt-1">持續追蹤中</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* 高風險預警列表 - 改為橫向全寬顯示 */}
                <Card className="col-span-full border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">風險名單</h3>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-wrap gap-4">
                            {sortedFatigueData.filter(d =>
                                d.metrics.acwr.risk_level === 'red' ||
                                d.metrics.acwr.risk_level === 'black' ||
                                d.metrics.rhr.risk_level === 'red' ||
                                d.metrics.rhr.risk_level === 'black' ||
                                d.metrics.wellness?.risk_level === 'red' ||
                                d.metrics.wellness?.risk_level === 'black' ||
                                d.metrics.srpe?.risk_level === 'red'
                            ).length > 0 ? (
                                sortedFatigueData
                                    .filter(d =>
                                        d.metrics.acwr.risk_level === 'red' ||
                                        d.metrics.acwr.risk_level === 'black' ||
                                        d.metrics.rhr.risk_level === 'red' ||
                                        d.metrics.rhr.risk_level === 'black' ||
                                        d.metrics.wellness?.risk_level === 'red' ||
                                        d.metrics.wellness?.risk_level === 'black' ||
                                        d.metrics.srpe?.risk_level === 'red'
                                    )
                                    .map((data) => {
                                        // 決定顯示哪個風險標籤
                                        let riskLabel = '';
                                        let riskValue = '';

                                        if (data.metrics.acwr.risk_level === 'red') {
                                            riskLabel = '急慢性負荷比';
                                            riskValue = `${data.metrics.acwr.acwr}`;
                                        } else if (data.metrics.rhr.status === 'red') {
                                            riskLabel = '晨間心跳';
                                            riskValue = `${data.metrics.rhr.current_rhr} bpm`;
                                        } else if (data.metrics.wellness?.status === 'red') {
                                            riskLabel = '身心狀態';
                                            riskValue = `${data.metrics.wellness.total} 分`;
                                        } else if (data.metrics.srpe?.status === 'red') {
                                            riskLabel = '訓練負荷';
                                            riskValue = '過高';
                                        }

                                        return (
                                            <Link
                                                key={data.player.id}
                                                to={`/${teamSlug}/player/${data.player.short_code || data.player.id}`}
                                                className="group block w-32 sm:w-36"
                                            >
                                                <div className={cn(
                                                    "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all shadow-md border border-white/20 relative group-hover:scale-105 group-hover:shadow-lg z-10",
                                                    data.metrics.acwr.risk_level === 'black' || data.metrics.rhr.risk_level === 'black' ? "bg-slate-900" : "bg-red-500"
                                                )}
                                                >
                                                    <div className="text-3xl font-black opacity-10 absolute top-2 right-3 text-white">!</div>

                                                    <span className={cn(
                                                        "font-bold text-center px-1 break-words leading-tight mb-2 text-white",
                                                        data.player.name.length > 3 ? "text-xs" : "text-sm"
                                                    )}>
                                                        {data.player.name}
                                                    </span>

                                                    <div className="flex flex-col items-center w-full px-1">
                                                        <span className="text-xs font-bold uppercase mb-1 tracking-tight text-white/90 text-center leading-none">{riskLabel}</span>
                                                        <span className={cn(
                                                            "font-bold truncate w-full text-center bg-white/20 py-0.5 rounded-full px-1.5 text-white",
                                                            data.player.name.length > 3 ? "text-xs" : "text-sm"
                                                        )}>{riskValue}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                            ) : (
                                <div className="w-full flex flex-col items-center justify-center py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                        <Check className="h-6 w-6 text-green-600" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">全員狀態良好</p>
                                    <p className="text-xs text-slate-500">目前沒有球員處於高風險區域</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 現有傷病名單 */}
                <Card className="col-span-full border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">現有傷病名單</h3>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-6 w-32">報告日期</th>
                                        <th className="py-3 px-6 w-32">球員姓名</th>
                                        <th className="py-3 px-6 w-48">受傷部位/狀況</th>
                                        <th className="py-3 px-6 w-32 whitespace-nowrap">疼痛指數</th>
                                        <th className="py-3 px-6">說明</th>
                                        <th className="py-3 px-6 w-48">醫囑</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activePainReports && activePainReports.length > 0 ? (
                                        Object.values(
                                            activePainReports.reduce((acc: any, report: any) => {
                                                const pid = report.player.id;
                                                if (!acc[pid]) {
                                                    acc[pid] = {
                                                        player: report.player,
                                                        reports: []
                                                    };
                                                }
                                                acc[pid].reports.push(report);
                                                return acc;
                                            }, {})
                                        ).map((group: any) => {
                                            // Get latest date
                                            const latestReport = group.reports.sort((a: any, b: any) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())[0];
                                            const maxPainLevel = Math.max(...group.reports.map((r: any) => r.pain_level || 0));

                                            // Check if all reports in this group are resolved (or maybe just the latest one decides status)
                                            // Ideally if there is ANY unresolved, it's unresolved.
                                            const isAllResolved = group.reports.every((r: any) => r.is_resolved);

                                            // Row styling for resolved
                                            const rowClass = isAllResolved
                                                ? "bg-green-50 hover:bg-green-100/50 transition-colors"
                                                : "hover:bg-slate-50/50 transition-colors";

                                            return (
                                                <tr key={group.player.id} className={rowClass}>
                                                    <td className="py-3 px-6 font-medium text-slate-700 align-top">
                                                        {format(new Date(latestReport.report_date), 'MM/dd')}
                                                        {isAllResolved && (
                                                            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1 py-0 h-5">
                                                                已恢復
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 font-bold text-black align-top">
                                                        <Link to={`/${teamSlug}/player/${group.player.short_code || group.player.id}`} className="hover:text-primary hover:underline">
                                                            {group.player.name}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-6 text-slate-600 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            {Object.values(
                                                                group.reports.reduce((acc: any, report: any) => {
                                                                    const existing = acc[report.body_part];
                                                                    if (!existing || new Date(report.report_date) > new Date(existing.report_date)) {
                                                                        acc[report.body_part] = report;
                                                                    }
                                                                    return acc;
                                                                }, {})
                                                            ).map((r: any) => (
                                                                <span key={r.id} className="inline-flex items-center">
                                                                    {r.type === 'illness' ? (
                                                                        <Badge variant="outline" className="mr-1 py-0 px-1.5 h-5 text-[10px] bg-orange-50 text-orange-600 border-orange-200">生病</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="mr-1 py-0 px-1.5 h-5 text-[10px] bg-red-50 text-red-600 border-red-200">傷痛</Badge>
                                                                    )}
                                                                    {BODY_PART_MAP[r.body_part] || r.body_part}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6 align-top">
                                                        {maxPainLevel > 0 && (
                                                            <Badge className={cn(
                                                                "border-0",
                                                                maxPainLevel >= 7 ? "bg-red-500" :
                                                                    maxPainLevel >= 4 ? "bg-amber-500" : "bg-green-500"
                                                            )}>{maxPainLevel}</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 text-slate-500 max-w-xs align-top">
                                                        <div className="flex flex-col gap-2">
                                                            {Object.values(
                                                                group.reports.reduce((acc: any, report: any) => {
                                                                    const existing = acc[report.body_part];
                                                                    if (!existing || new Date(report.report_date) > new Date(existing.report_date)) {
                                                                        acc[report.body_part] = report;
                                                                    }
                                                                    return acc;
                                                                }, {})
                                                            ).map((r: any) => (
                                                                <div key={r.id} className="text-sm border-l-2 border-slate-200 pl-2">
                                                                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                                                                        {BODY_PART_MAP[r.body_part] || r.body_part}
                                                                    </span>
                                                                    {r.description || '-'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6 text-slate-500 max-w-xs align-top">
                                                        <div className="flex flex-col gap-2">
                                                            {Object.values(
                                                                group.reports.reduce((acc: any, report: any) => {
                                                                    const existing = acc[report.body_part];
                                                                    if (!existing || new Date(report.report_date) > new Date(existing.report_date)) {
                                                                        acc[report.body_part] = report;
                                                                    }
                                                                    return acc;
                                                                }, {})
                                                            ).map((r: any) => (
                                                                r.doctor_note ? (
                                                                    <div key={r.id} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                        <span className="text-xs font-bold text-blue-400 block mb-0.5">
                                                                            {BODY_PART_MAP[r.body_part] || r.body_part}
                                                                        </span>
                                                                        {r.doctor_note}
                                                                    </div>
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">
                                                目前無未解決的傷病回報
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* 全隊訓練負荷熱力圖 */}
                <Card className="col-span-full xl:col-span-4 overflow-hidden border-slate-200 shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">球員總覽</h3>
                            </div>
                            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="bg-white p-1 rounded-xl border border-slate-200/50 shadow-inner">
                                <TabsList className="bg-transparent h-8 border-none gap-1">
                                    <TabsTrigger value="7d" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs font-bold text-slate-500">7 天</TabsTrigger>
                                    <TabsTrigger value="14d" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs font-bold text-slate-500">14 天</TabsTrigger>
                                    <TabsTrigger value="28d" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs font-bold text-slate-500">28 天</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {/* 簡化版熱力圖 - 球員卡片網格 */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                            {sortedFatigueData.map((data) => {
                                // 計算整體風險等級 (取最嚴重的)
                                const getRiskPriority = (level: string | null | undefined) => {
                                    const l = level?.toLowerCase();
                                    if (!l || l === 'gray' || l === 'none') return 0;
                                    if (l === 'red' || l === 'black') return 3;
                                    if (l === 'yellow' || l === 'orange') return 2;
                                    if (l === 'green') return 1;
                                    return 0;
                                };

                                // 同步使用 risk_level (這是 useTeamFatigueOverview 對齊後的欄位)
                                const acwrRisk = getRiskPriority(data.metrics.acwr.risk_level);
                                const rhrRisk = getRiskPriority(data.metrics.rhr.risk_level);
                                const wellnessRisk = getRiskPriority(data.metrics.wellness?.risk_level);
                                const srpeRisk = getRiskPriority(data.metrics.srpe?.risk_level);

                                // 重要判定：如果今天完全沒有回報紀錄，則應該優先視為「無數據」
                                // 檢查指標是否真的有數據，而不只是空物件
                                const hasTodayActivity = !!(
                                    (data.metrics.wellness && data.metrics.wellness.total > 0) ||
                                    (data.metrics.srpe && data.metrics.srpe.score > 0) ||
                                    (data.metrics.rhr && data.metrics.rhr.current_rhr)
                                );
                                let maxRisk = Math.max(acwrRisk, rhrRisk, wellnessRisk, srpeRisk);

                                // 若無今日數據且長期趨勢 (ACWR) 也是灰色，強制為 0 (灰色)
                                if (!hasTodayActivity && data.metrics.acwr.risk_level === 'gray') {
                                    maxRisk = 0;
                                }

                                // 額外判定是否要使用黑色背景 (黑代表極高)
                                const isBlack = data.metrics.acwr.risk_level === 'black' || data.metrics.rhr.risk_level === 'black';

                                return (
                                    <Link
                                        key={data.player.id}
                                        to={`/${teamSlug}/player/${data.player.short_code || data.player.id}`}
                                        className="group"
                                    >
                                        <div
                                            className={cn(
                                                "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm border relative group-hover:scale-105 group-hover:shadow-lg z-10",
                                                maxRisk === 0 && "bg-slate-100 border-slate-200",
                                                isBlack && "bg-slate-950 border-slate-800",
                                                !isBlack && maxRisk === 3 && "bg-red-500 border-red-600",
                                                !isBlack && maxRisk === 2 && "bg-amber-400 border-amber-500",
                                                !isBlack && maxRisk === 1 && "bg-green-400 border-green-500"
                                            )}
                                        >
                                            <span className={cn(
                                                "font-black text-center w-full px-1 truncate leading-none",
                                                data.player.name.length > 3 ? "text-[10px]" : "text-xs",
                                                (maxRisk === 3 || isBlack) ? "text-white" : "text-slate-900"
                                            )}>
                                                {data.player.name}
                                            </span>
                                            {/* 數值已隱藏，僅透過顏色顯示狀態 */}

                                            {/* 未回報標記: wellness 為 null 代表今日未回報 */}
                                            {!data.metrics.wellness && (
                                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-slate-400 border-2 border-white shadow-sm ring-2 ring-slate-100 ring-offset-0 animate-pulse" title="今日未回報" />
                                            )}
                                        </div>
                                        {/* Name label removed as name is now inside the card */}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* 圖例 */}
                        <div className="flex items-center justify-center gap-6 mt-12 py-6 bg-slate-50 rounded-2xl border border-slate-100 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: '#53EF8B' }} />
                                <span className="text-xs font-bold text-slate-800">正常</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: '#EFB954' }} />
                                <span className="text-xs font-bold text-slate-800">注意</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: '#EF4F3B' }} />
                                <span className="text-xs font-bold text-slate-800">高風險</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-lg bg-slate-100 border border-slate-200 shadow-sm" />
                                <span className="text-xs font-bold text-slate-800">無資料</span>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-400 border border-white ring-2 ring-slate-200" />
                                <span className="text-xs font-bold text-slate-800">今日未回報</span>
                            </div>
                        </div>
                    </CardContent>
                </Card >
            </div >
            {/* 清除確認對話框 */}
            <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要清除所有測試數據？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作將會刪除球隊內所有球員的每日訓練與疲勞紀錄。
                            <br />
                            <span className="text-red-600 font-bold">警告：此動作無法復原。</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700 font-bold">
                            確認清除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 確認對話框 (填補) */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要重新填補測試數據？</AlertDialogTitle>
                        <AlertDialogDescription>
                            這將會為所有球員生成過去30天的隨機訓練與疲勞數據。
                            <br />
                            <span className="text-red-500 font-bold">警告：現有的測試數據可能會被覆蓋。</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGenerateData}>
                            確認生成
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
