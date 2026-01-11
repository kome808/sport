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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeam, useTeamStats, useHighRiskPlayers, usePlayersWithTodayStatus } from '@/hooks/useTeam';

const riskLevelColors = {
    green: 'bg-risk-green',
    yellow: 'bg-risk-yellow',
    red: 'bg-risk-red',
    black: 'bg-risk-black',
} as const;

export default function DashboardPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    // 取得球隊資料
    const { data: team } = useTeam(teamSlug || '');
    const teamId = team?.id;

    // 取得統計資料
    const { data: stats, isLoading: statsLoading } = useTeamStats(teamId);

    // 取得高風險球員
    const { data: riskPlayers, isLoading: riskLoading } = useHighRiskPlayers(teamId);

    // 取得所有球員狀態 (熱力圖用)
    const { data: players, isLoading: playersLoading } = usePlayersWithTodayStatus(teamId);

    // 載入中狀態
    if (statsLoading || riskLoading || playersLoading || !teamId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 頁面標題 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">戰情室</h2>
                    <p className="text-muted-foreground">
                        全隊訓練狀態概覽與風險監控
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        本週報告
                    </Button>
                </div>
            </div>

            {/* 統計卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                            {(stats?.riskCounts?.red || 0) + (stats?.riskCounts?.black || 0)}
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

            <div className="grid gap-6 lg:grid-cols-3">
                {/* 高風險預警 */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-danger" />
                            高風險預警
                        </CardTitle>
                        <CardDescription>需要立即關注的球員 ({riskPlayers?.length || 0})</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {riskPlayers && riskPlayers.length > 0 ? (
                                    riskPlayers.map((record) => (
                                        <Link
                                            key={record.id}
                                            to={`/${teamSlug}/player/${record.player_id}`}
                                            className="block"
                                        >
                                            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${record.risk_level === 'black' ? 'bg-risk-black' : 'bg-risk-red'
                                                    }`}>
                                                    {record.player?.jersey_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{record.player?.name}</span>
                                                        <Badge variant="destructive">
                                                            ACWR {record.acwr}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                                                        Risk: {record.risk_level}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        目前沒有高風險球員 👍
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* 全隊訓練負荷熱力圖 */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>訓練負荷概覽</CardTitle>
                                <CardDescription>球員風險狀態分布</CardDescription>
                            </div>
                            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <TabsList>
                                    <TabsTrigger value="7d">7 天</TabsTrigger>
                                    <TabsTrigger value="14d">14 天</TabsTrigger>
                                    <TabsTrigger value="28d">28 天</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* 簡化版熱力圖 - 球員卡片網格 */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {players?.map((player) => (
                                <Link
                                    key={player.id}
                                    to={`/${teamSlug}/player/${player.id}`}
                                    className="group"
                                >
                                    <div
                                        className={`aspect-square rounded-lg ${player.riskLevel ? riskLevelColors[player.riskLevel as keyof typeof riskLevelColors] : 'bg-muted'
                                            } flex flex-col items-center justify-center text-white transition-transform group-hover:scale-105 relative`}
                                    >
                                        <span className={`text-lg font-bold ${!player.riskLevel ? 'text-muted-foreground' : ''}`}>
                                            {player.jersey_number}
                                        </span>
                                        {player.todayRecord?.acwr && (
                                            <span className="text-[10px] opacity-80">{player.todayRecord.acwr}</span>
                                        )}

                                        {/* 未回報標記 */}
                                        {!player.hasReportedToday && (
                                            <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gray-400 border border-white" title="今日未回報" />
                                        )}
                                    </div>
                                    <p className="text-xs text-center mt-1 truncate text-muted-foreground group-hover:text-foreground">
                                        {player.name}
                                    </p>
                                </Link>
                            ))}
                        </div>

                        {/* 圖例 */}
                        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-risk-green" />
                                <span className="text-xs text-muted-foreground">正常</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-risk-yellow" />
                                <span className="text-xs text-muted-foreground">注意</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-risk-red" />
                                <span className="text-xs text-muted-foreground">高風險</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-risk-black" />
                                <span className="text-xs text-muted-foreground">極高風險</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-muted" />
                                <span className="text-xs text-muted-foreground">無資料</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gray-400 border border-gray-200" />
                                <span className="text-xs text-muted-foreground">未回報</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
