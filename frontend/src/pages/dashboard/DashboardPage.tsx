/**
 * 教練儀表板 - 戰情室
 * 顯示全隊訓練負荷概覽與高風險預警
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, addDays, subDays, isToday } from 'date-fns';
import {
    Activity,
    Users,
    AlertTriangle,
    TrendingUp,
    Loader2,
    Database,
    Check,
    Trash2,
    Info,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    useTeam,
    useTeamStats,
    useTeamFatigueOverview,
    usePlayers,
    useTeamActivePainReports,
    useTeamDailyRecords
} from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Body Part Map
import { BODY_PATHS } from '@/components/player/BodyMapPaths';

const BODY_PART_MAP: Record<string, string> = {
    ...BODY_PATHS.reduce((acc, part) => {
        acc[part.id] = part.name;
        return acc;
    }, {} as Record<string, string>),
    // 增加手動映射以處理可能的英文資料
    'Ankle (R)': '右腳踝',
    'Ankle (L)': '左腳踝',
    'Knee (R)': '右膝蓋',
    'Knee (L)': '左膝蓋',
    'Shoulder (R)': '右肩膀',
    'Shoulder (L)': '左肩膀',
    'Wrist (R)': '右手腕',
    'Wrist (L)': '左手腕',
    'Elbow (R)': '右肘',
    'Elbow (L)': '左肘',
    'Hip (R)': '右髖部',
    'Hip (L)': '左髖部',
    'Foot (R)': '右腳掌',
    'Foot (L)': '左腳掌',
    'Lower Back': '下背部',
    'Upper Back': '上背部',
    'Neck': '頸部',
    'Head': '頭部',
};
BODY_PART_MAP['other'] = '其他部位';

export default function DashboardPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const { isLoading: isAuthLoading, isInitialized, user } = useAuth();

    const isReady = !isAuthLoading && isInitialized && !!user;

    // 取得球隊資料
    const { data: team, isLoading: teamLoading, error: teamError } = useTeam((isReady && teamSlug) ? teamSlug : '');

    const teamId = team?.id;

    // const FIXED_DEMO_DATE = '2026-01-27'; // Removed
    // const isDemo = team?.is_demo || teamSlug === 'shohoku-basketball'; // Removed unused variable

    // 日期狀態 (預設今天，湘北 Demo 隊預設 2026-01-27)
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        if (teamSlug === 'shohoku-basketball') {
            return new Date('2026-01-27T00:00:00');
        }
        return new Date();
    });
    const todayStr = format(selectedDate, 'yyyy-MM-dd');

    // 切換日期
    const handleDateChange = (days: number) => {
        setSelectedDate(prev => {
            const newDate = days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days));
            return newDate;
        });
    };

    // 取得統計資料 (快取 1 分鐘，避免頻繁請求)
    const { data: stats, isLoading: statsLoading } = useTeamStats(isReady ? teamId : undefined, todayStr);

    // 取得球員詳細資料
    const { data: players } = usePlayers(isReady ? teamId : undefined);

    // 取得全隊疲勞指標
    const { data: fatigueData, isLoading: fatigueLoading } = useTeamFatigueOverview(isReady ? teamId : undefined, todayStr);

    // 取得現有傷病列表
    const { data: activePainReports } = useTeamActivePainReports(isReady ? teamId : undefined);

    // 取得今日細節紀錄 (心得、各個指標)
    const { data: todayRecords } = useTeamDailyRecords(isReady ? teamId : undefined, todayStr);


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

    // 從疲勞快照中篩選出高風險名單 (比照儀表板頂部的統計邏輯)
    const highRiskList = sortedFatigueData.filter(d =>
        d.metrics.acwr.risk_level === 'purple' || // 新增紫燈
        d.metrics.acwr.risk_level === 'red' ||
        d.metrics.acwr.risk_level === 'black' ||
        d.metrics.rhr.status === 'red' ||
        d.metrics.rhr.status === 'black' ||
        d.metrics.wellness?.status === 'red' ||
        d.metrics.wellness?.status === 'black' ||
        d.metrics.srpe?.status === 'red' ||
        d.metrics.srpe?.status === 'black'
    );

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
                            d.metrics.acwr.risk_level === 'purple' ||
                            d.metrics.acwr.risk_level === 'red' ||
                            d.metrics.acwr.risk_level === 'black' ||
                            d.metrics.rhr.status === 'red' ||
                            d.metrics.rhr.status === 'black' ||
                            d.metrics.wellness?.status === 'red' ||
                            d.metrics.wellness?.status === 'black' ||
                            d.metrics.srpe?.status === 'red' ||
                            d.metrics.srpe?.status === 'black'
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
                {/* 高風險預警列表 */}
                {highRiskList && (
                    <Card className="col-span-full border-red-200 shadow-md bg-white rounded-3xl overflow-hidden border-2 animate-in fade-in slide-in-from-top-4 duration-700">
                        <CardHeader className="border-b border-red-100 bg-red-50/50 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                                        高風險預警名單
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
                                                    <Info className="h-4 w-4 text-red-400 cursor-pointer hover:text-red-600 transition-colors" />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-8 bg-white/95 backdrop-blur-xl outline-none">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-black text-black mb-2">預警名單計算說明</DialogTitle>
                                                    <DialogDescription className="text-black font-bold leading-relaxed">
                                                        系統自動偵測指出「晨間心跳 RHR」、「身心狀態 WELLNESS」、「今日訓練負荷 sRPE」或「急慢性負荷比 ACWR」中<span className="text-red-600 underline underline-offset-4">任一指標</span>異常的球員：
                                                        <ul className="mt-4 space-y-4 list-none text-black">
                                                            <li className="flex gap-2">
                                                                <Badge className="bg-red-500 h-fit">ACWR</Badge>
                                                                <div className="text-sm">
                                                                    <span className="font-black">急慢性負荷比 ≥ 1.5</span>
                                                                    <p className="font-medium text-slate-500">受傷風險顯著提高。若 ≥ 2.0 為極高風險 (purple)。</p>
                                                                </div>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <Badge className="bg-blue-500 h-fit">sRPE</Badge>
                                                                <div className="text-sm">
                                                                    <span className="font-black">週負荷變化率 &gt; 15%</span>
                                                                    <p className="font-medium text-slate-500">短期增量過快。或單週負荷增加 &gt; 1000 AU。</p>
                                                                </div>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <Badge className="bg-orange-500 h-fit">Wellness</Badge>
                                                                <div className="text-sm">
                                                                    <span className="font-black">Z-score &lt; -2</span>
                                                                    <p className="font-medium text-slate-500">身心狀態顯著低於個人平均 (或總分大幅下滑)。</p>
                                                                </div>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <Badge className="bg-amber-500 h-fit">RHR</Badge>
                                                                <div className="text-sm">
                                                                    <span className="font-black">晨間心跳 RHR (Δ ≥ 10)</span>
                                                                    <p className="font-medium text-slate-500">生理疲勞嚴重，可能是過度訓練或生病前兆。</p>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    </DialogDescription>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>
                                    </h3>
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-0.5">需要立即安排人員面談或調整訓練量</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-red-50/30 text-red-700 font-bold border-b border-red-100">
                                        <tr>
                                            <th className="py-3 px-6">球員</th>
                                            <th className="py-3 px-6">風險等級</th>
                                            <th className="py-3 px-6">異常內容 (數值 / 指標)</th>
                                            <th className="py-3 px-6">動作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-50">
                                        {highRiskList.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                                                    目前無需要立即關注的高風險球員
                                                    <p className="text-xs text-slate-300 mt-1">請持續追蹤球員每日回報狀態</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            highRiskList.map((item) => {
                                                // 找出導致進榜的指標與其數值
                                                const details = [];
                                                if (item.metrics.acwr.risk_level === 'red' || item.metrics.acwr.risk_level === 'purple') {
                                                    details.push({ name: '急慢性負荷比 ACWR', val: item.metrics.acwr.acwr?.toFixed(2), level: item.metrics.acwr.risk_level });
                                                }
                                                if (item.metrics.wellness?.status === 'red' || item.metrics.wellness?.status === 'black') {
                                                    details.push({ name: '身心狀態 WELLNESS', val: `${item.metrics.wellness.total}/50`, level: item.metrics.wellness.status });
                                                }
                                                if (item.metrics.rhr.status === 'red' || item.metrics.rhr.status === 'black') {
                                                    const diff = item.metrics.rhr.difference;
                                                    details.push({ name: '晨間心跳 RHR', val: diff && diff > 0 ? `+${diff}` : (diff || 0), level: item.metrics.rhr.status });
                                                }
                                                if (item.metrics.srpe?.status === 'red' || item.metrics.srpe?.status === 'black') {
                                                    details.push({ name: '今日訓練負荷 sRPE', val: item.metrics.srpe.load_au || item.metrics.srpe.score, level: item.metrics.srpe.status });
                                                }

                                                // 風險等級以最嚴重者為準
                                                const highestRisk = details.some(d => d.level === 'black') ? 'black' : 'red';

                                                return (
                                                    <tr key={item.player.id} className="hover:bg-red-50/20 transition-colors">
                                                        <td className="py-3 px-6 font-bold text-black border-l-4 border-red-500">
                                                            <Link to={`/${teamSlug}/player/${item.player.short_code || item.player.id}`} className="hover:text-primary hover:underline">
                                                                {item.player.name}
                                                            </Link>
                                                        </td>
                                                        <td className="py-3 px-6">
                                                            <Badge className={cn(
                                                                "font-black uppercase tracking-tighter shadow-sm",
                                                                highestRisk === 'black' ? "bg-slate-900 text-white" : "bg-red-500 text-white"
                                                            )}>
                                                                {highestRisk === 'black' ? '危險 CRITICAL' : '高風險 HIGH'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 px-6">
                                                            <div className="flex flex-wrap gap-2">
                                                                {details.map((d, idx) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 bg-white border border-red-100 rounded-lg px-2 py-1 shadow-sm">
                                                                        <span className="text-xs font-black text-red-600">{d.name}</span>
                                                                        <span className="w-[1px] h-3 bg-red-100" />
                                                                        <span className="text-sm font-black text-black">{d.val}</span>
                                                                        {d.level === 'black' && <Badge className="h-4 px-1 text-[8px] bg-slate-900 border-0">CRITICAL</Badge>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-6">
                                                            <Button variant="ghost" size="sm" asChild className="h-8 rounded-xl font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3">
                                                                <Link to={`/${teamSlug}/player/${item.player.short_code || item.player.id}`}>
                                                                    細節
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 現有傷病名單 */}
                <Card className="col-span-full border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    現有傷病名單
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
                                                <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl p-8 bg-white/95 backdrop-blur-xl outline-none">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-black text-black mb-2">傷病名單說明</DialogTitle>
                                                <DialogDescription className="text-black font-bold leading-relaxed">
                                                    詳細記錄選手的傷病與康復進度：
                                                    <ul className="mt-4 space-y-2 list-disc list-inside text-sm text-black font-medium">
                                                        <li>顯示所有未標記為「已恢復」的傷病回報</li>
                                                        <li>標記恢復後，系統會自動在名單中保留 48 小時 (兩天)，以便教練觀察回場初期的反應</li>
                                                        <li>整合每日回報中的生病或異常狀態</li>
                                                    </ul>
                                                </DialogDescription>
                                            </DialogHeader>
                                        </DialogContent>
                                    </Dialog>
                                </h3>
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

                <Card className="col-span-full border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-base font-bold text-slate-900">球員回饋總覽</h3>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDateChange(-1)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                className="h-8 w-[140px] px-2 text-sm"
                                                value={todayStr}
                                                onChange={(e) => {
                                                    if (e.target.value) setSelectedDate(new Date(e.target.value));
                                                }}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDateChange(1)}
                                            disabled={isToday(selectedDate)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-black border-collapse">
                                <thead className="bg-slate-100 text-black font-black border-b-2 border-slate-200">
                                    <tr>
                                        <th className="py-4 px-6 whitespace-nowrap min-w-[120px]">球員姓名</th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap w-[60px]">狀態</th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap w-[10%]">
                                            <div className="flex items-center justify-center gap-1">
                                                晨間心跳
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                                                <Activity className="h-5 w-5 text-red-500" />
                                                                身體內部的氣象台 (RHR)
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <p className="font-bold text-slate-700 leading-relaxed text-sm">
                                                                靜止心率 (Resting Heart Rate) 是反映自律神經系統與恢復狀態最直接的生理指標。
                                                                我們建議您每天早上起床、下床前測量 1 分鐘心跳。
                                                            </p>

                                                            <div className="space-y-3">
                                                                <h4 className="font-black text-slate-900 border-b pb-1">🚦 如何解讀？</h4>
                                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                                                                    <div className="flex gap-3">
                                                                        <span className="w-3 h-3 mt-1.5 rounded-full bg-green-500 shrink-0" />
                                                                        <div>
                                                                            <span className="text-sm font-black text-slate-800 block">綠燈 (恢復良好)</span>
                                                                            <span className="text-xs text-slate-600">與過去 7 天平均值持平或更低。</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <span className="w-3 h-3 mt-1.5 rounded-full bg-yellow-400 shrink-0" />
                                                                        <div>
                                                                            <span className="text-sm font-black text-slate-800 block">黃燈 (承受壓力)</span>
                                                                            <span className="text-xs text-slate-600">比平均值高出 <span className="font-bold text-slate-900">5-9 下</span>，身體正在承受壓力。</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <span className="w-3 h-3 mt-1.5 rounded-full bg-red-500 shrink-0" />
                                                                        <div>
                                                                            <span className="text-sm font-black text-slate-800 block">紅燈 (建議休息)</span>
                                                                            <span className="text-xs text-slate-600">比平均值高出 <span className="font-bold text-slate-900">10 下以上</span>，強烈建議當日休息或就醫。</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap w-[15%]">
                                            <div className="flex items-center justify-center gap-1">
                                                身心狀態
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                                                <Database className="h-5 w-5 text-blue-500" />
                                                                聽見身體的聲音 (Wellness)
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <p className="font-bold text-slate-700 leading-relaxed text-sm">
                                                                透過簡單問卷，紀錄選手對「疲勞感」、「睡眠品質」、「肌肉痠痛」與「壓力」的主觀感受。
                                                                這聽起來很簡單，但科學證明它比你想像的更準確。
                                                            </p>

                                                            <div className="space-y-3">
                                                                <h4 className="font-black text-slate-900 border-b pb-1">🚦 如何解讀？</h4>
                                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                                                                    <div className="flex gap-3">
                                                                        <span className="w-3 h-3 mt-1.5 rounded-full bg-green-500 shrink-0" />
                                                                        <div>
                                                                            <span className="text-sm font-black text-slate-800 block">綠燈 (身心平衡)</span>
                                                                            <span className="text-xs text-slate-600">分數平穩，身心處於理想狀態。</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <span className="w-3 h-3 mt-1.5 rounded-full bg-red-500 shrink-0" />
                                                                        <div>
                                                                            <span className="text-sm font-black text-slate-800 block">紅燈 (狀態低落)</span>
                                                                            <span className="text-xs text-slate-600">總分顯著低於個人平常水準，需注意是否有生活壓力過大或睡眠不足。</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap w-[10%]">
                                            <div className="flex items-center justify-center gap-1">
                                                訓練負荷
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                                                <TrendingUp className="h-5 w-5 text-amber-500" />
                                                                量化你的努力 (sRPE)
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <p className="font-bold text-slate-700 leading-relaxed text-sm">
                                                                將選手感覺到的「訓練辛苦程度 (0-10分)」乘以「訓練時間」所計算出的數值。
                                                                這是國際通用的黃金標準，用來量化身體實際承受了多少壓力。
                                                            </p>

                                                            <div className="space-y-3">
                                                                <h4 className="font-black text-slate-900 border-b pb-1">🚦 如何解讀？</h4>
                                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                                        我們主要觀察<span className="font-black text-slate-800">「波動」</span>。訓練量應該像階梯一樣循序漸進，而不是像雲霄飛車忽高忽低。
                                                                    </p>
                                                                    <div className="bg-white p-2 rounded border border-slate-200 mt-2">
                                                                        <div className="flex items-center gap-2 text-red-600">
                                                                            <AlertTriangle className="h-4 w-4" />
                                                                            <span className="text-xs font-black">高風險訊號</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-700 mt-1 pl-6">
                                                                            若本週訓練總量比上週暴增 <span className="font-black">超過 15%</span>。
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 whitespace-nowrap w-[25%]">心得回饋</th>
                                        <th className="py-4 px-6 whitespace-nowrap w-[20%]">傷病/生病回報</th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap w-[5%]">動作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedFatigueData.length > 0 ? (
                                        sortedFatigueData.map((data) => {
                                            const record = todayRecords?.find(r => r.player_id === data.player.id);
                                            const activePain = activePainReports?.find(p => p.player.id === data.player.id && !p.is_resolved);

                                            // 顏色狀態
                                            const getRiskBg = (level: string | undefined) => {
                                                switch (level) {
                                                    case 'black': return 'bg-slate-900';
                                                    case 'purple': return 'bg-purple-500';
                                                    case 'red': return 'bg-red-500';
                                                    case 'yellow': return 'bg-amber-400';
                                                    case 'green': return 'bg-green-400';
                                                    default: return 'bg-slate-200';
                                                }
                                            };

                                            return (
                                                <tr key={data.player.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <Link
                                                            to={`/${teamSlug}/player/${data.player.id}/fatigue`}
                                                            className="font-bold text-black text-sm hover:text-primary hover:underline transition-all"
                                                        >
                                                            {data.player.name}
                                                        </Link>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex justify-center">
                                                            <div className={cn(
                                                                "h-3 w-3 rounded-full shadow-inner",
                                                                getRiskBg(
                                                                    (data.metrics.acwr.risk_level === 'purple' || data.metrics.acwr.risk_level === 'black' || data.metrics.wellness?.status === 'black') ? 'purple' :
                                                                        (data.metrics.acwr.risk_level === 'red' || data.metrics.wellness?.status === 'red') ? 'red' :
                                                                            (data.metrics.acwr.risk_level === 'yellow' || data.metrics.wellness?.status === 'yellow') ? 'yellow' : 'green'
                                                                )
                                                            )} />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        {record?.rhr_bpm ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-black text-black">{record.rhr_bpm}</span>
                                                                <span className="text-sm font-bold text-slate-500">BPM</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {record?.wellness_total ? (
                                                            <div className="flex flex-col items-center gap-1.5 min-w-[140px]">
                                                                <div className="flex gap-1">
                                                                    {[
                                                                        { v: record.sleep_quality, label: '睡' },
                                                                        { v: record.fatigue_level, label: '疲' },
                                                                        { v: record.mood, label: '心' },
                                                                        { v: record.stress_level, label: '壓' },
                                                                        { v: record.muscle_soreness, label: '痠' }
                                                                    ].map((item, i) => (
                                                                        <div key={i} className="flex flex-col items-center gap-0.5">
                                                                            <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                                                                            <div className={cn(
                                                                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-black border",
                                                                                item.v! >= 8 ? "bg-green-100 text-green-800 border-green-200" : (item.v! >= 5 ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-red-100 text-red-800 border-red-200")
                                                                            )}>
                                                                                {item.v}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                                                                    總分: {record.wellness_total}/50
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-slate-400 text-sm">未回報</div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        {record?.training_load_au ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-black text-black">{record.training_load_au}</span>
                                                                <span className="text-sm font-bold text-slate-500">AU</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {record?.feedback ? (
                                                            <p className="text-sm text-black font-bold leading-relaxed">
                                                                「{record.feedback}」
                                                            </p>
                                                        ) : (
                                                            <span className="text-slate-400 text-sm">尚無留言</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {activePain ? (
                                                            <div className="flex flex-col gap-1">
                                                                <Badge variant="outline" className={cn(
                                                                    "px-2 py-0.5 text-sm font-black w-fit border-2",
                                                                    activePain.type === 'illness'
                                                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                                                        : "bg-red-50 text-red-700 border-red-200"
                                                                )}>
                                                                    {activePain.type === 'illness' ? '生病' : '傷痛'}：{BODY_PART_MAP[activePain.body_part] || activePain.body_part}
                                                                </Badge>
                                                                {activePain.description && (
                                                                    <span className="text-sm text-black font-bold truncate max-w-[150px]">
                                                                        {activePain.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <Button variant="outline" size="sm" asChild className="rounded-xl font-bold h-8 text-sm hover:bg-slate-100 border-slate-200">
                                                            <Link to={`/${teamSlug}/player/${data.player.short_code || data.player.id}`}>
                                                                查看
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                                尚未有球員資料
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
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
