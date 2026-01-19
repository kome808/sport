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
    Loader2,
    Database,
    Check,
    Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useTeam, useTeamStats, useTeamFatigueOverview, usePlayers } from '@/hooks/useTeam';
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

    // 取得球員詳細資料 (為了排序用，含生日)
    const { data: players } = usePlayers(teamId);

    // 取得全隊疲勞指標
    const { data: fatigueData, isLoading: fatigueLoading } = useTeamFatigueOverview(teamId);

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

    // 載入中狀態
    if (statsLoading || fatigueLoading || !teamId) {
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

            {/* Top Action Bar */}
            <div className="flex items-center justify-end gap-3 mb-6">
                {/* 測試用按鈕 - 僅在 doraemon-baseball 顯示 */}
                {teamSlug === 'doraemon-baseball' && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isGenerating || isClearing}
                            onClick={() => setIsClearConfirmOpen(true)}
                            className={cn(
                                "rounded-lg font-bold transition-all shadow-sm border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800",
                                isClearing && "opacity-80"
                            )}
                        >
                            {isClearing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {isClearing ? '清除中...' : '清除測試數據'}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isGenerating || isClearing}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsConfirmOpen(true);
                            }}
                            className={cn(
                                "rounded-lg font-bold transition-all shadow-sm border-slate-200 text-slate-700",
                                isSuccess ? "border-green-500 text-green-600 bg-green-50" : "hover:bg-slate-50"
                            )}
                        >
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isSuccess ? (
                                <Check className="mr-2 h-4 w-4" />
                            ) : (
                                <Database className="mr-2 h-4 w-4" />
                            )}
                            {isGenerating ? '生成中...' : isSuccess ? '已更新' : '填補測試數據'}
                        </Button>
                    </div>
                )}
            </div>

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
                            d.metrics.rhr.status === 'red' ||
                            d.metrics.wellness?.status === 'red' ||
                            d.metrics.srpe?.status === 'red'
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
                                d.metrics.rhr.status === 'red' ||
                                d.metrics.wellness?.status === 'red' ||
                                d.metrics.srpe?.status === 'red'
                            ).length > 0 ? (
                                sortedFatigueData
                                    .filter(d =>
                                        d.metrics.acwr.risk_level === 'red' ||
                                        d.metrics.rhr.status === 'red' ||
                                        d.metrics.wellness?.status === 'red' ||
                                        d.metrics.srpe?.status === 'red'
                                    )
                                    .map((data) => {
                                        // 決定顯示哪個風險標籤
                                        let riskLabel = '';
                                        let riskValue = '';

                                        if (data.metrics.acwr.risk_level === 'red') {
                                            riskLabel = 'ACWR';
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
                                                    "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm border border-white/20 relative group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-lg z-10"
                                                )}
                                                    style={{ backgroundColor: '#EF4F3B', boxShadow: '0 10px 15px -3px rgba(239, 79, 59, 0.4)' }}
                                                >
                                                    <div className="text-3xl font-black opacity-10 absolute top-2 right-3 text-white">!</div>

                                                    <span className={cn(
                                                        "font-bold text-center px-1 break-words leading-tight mb-2 text-white",
                                                        data.player.name.length > 3 ? "text-xs" : "text-sm"
                                                    )}>
                                                        {data.player.name}
                                                    </span>

                                                    <div className="flex flex-col items-center w-full px-1">
                                                        <span className="text-[9px] font-bold uppercase mb-0.5 tracking-tight text-white/90">{riskLabel}</span>
                                                        <span className="text-[10px] font-bold truncate w-full text-center bg-white/20 py-0.5 rounded-full px-1.5 text-white">{riskValue}</span>
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

                                return (
                                    <Link
                                        key={data.player.id}
                                        to={`/${teamSlug}/player/${data.player.short_code || data.player.id}`}
                                        className="group"
                                    >
                                        <div
                                            className={cn(
                                                "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm border border-black/5 relative group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-lg z-10",
                                                maxRisk === 0 ? "bg-slate-100 border-slate-200" : ""
                                            )}
                                            style={{
                                                backgroundColor: maxRisk === 3 ? '#EF4F3B' :
                                                    maxRisk === 2 ? '#EFB954' :
                                                        maxRisk === 1 ? '#53EF8B' : undefined,
                                                color: maxRisk === 3 ? '#FFFFFF' : '#1a1a1a'
                                            }}
                                        >
                                            <span className={cn(
                                                "font-bold text-center px-1 break-words leading-tight",
                                                data.player.name.length > 3 ? "text-xs" : "text-sm",
                                                maxRisk === 3 ? "text-white" :
                                                    (maxRisk === 0) ? "text-slate-500" : "text-slate-900"
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
