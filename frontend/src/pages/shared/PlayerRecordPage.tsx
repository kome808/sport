/**
 * 球員紀錄頁面（統一頁面元件）
 * 教練端與球員端共用，透過 mode 控制顯示內容
 */

import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DailyReportForm from '@/components/player/DailyReportForm';
import DailyRecordHistory from '@/components/records/DailyRecordHistory';
import { usePlayer, usePlayerSession } from '@/hooks/usePlayer';
import { useTeam } from '@/hooks/useTeam';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PainReportForm from '@/components/player/PainReportForm';
import PainRecordList from '@/components/records/PainRecordList';

interface PlayerRecordPageProps {
    mode: 'coach' | 'player';
}

export default function PlayerRecordPage({ mode }: PlayerRecordPageProps) {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();
    const navigate = useNavigate();

    // 取得球隊資料
    const { data: team } = useTeam(teamSlug || '');

    // 取得球員資料
    const { data: player, isLoading: playerLoading, error: playerError } = usePlayer(playerId);

    // 球員端 Session 檢查
    const { session, isLoading: sessionLoading, logout } = usePlayerSession();

    // 球員端需要驗證登入狀態
    // 球員端需要驗證登入狀態
    useEffect(() => {
        // if (mode === 'player' && !sessionLoading && player) {
        //     // 比對 session 中的 playerId 是否與當前球員相符
        //     if (!session || session.playerId !== player.id) {
        //         navigate(`/${teamSlug}/p/${playerId}/login`);
        //     }
        // }
    }, [mode, session, sessionLoading, player, playerId, teamSlug, navigate]);

    // 載入中
    if (playerLoading || (mode === 'player' && sessionLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 找不到球員
    if (playerError || !player) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-lg font-medium text-destructive">找不到球員資料</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            請確認連結是否正確
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => navigate('/')}
                        >
                            返回首頁
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 球員端 Layout
    if (mode === 'player') {
        return (
            <div className="min-h-screen bg-muted/30 py-6 px-4">
                <div className="max-w-lg mx-auto space-y-6">
                    {/* 頂部資訊 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {player.jersey_number || '#'}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">{player.name}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {new Date().toLocaleDateString('zh-TW', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'long',
                                    })}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            登出
                        </Button>
                    </div>

                    <Tabs defaultValue="daily" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="daily">每日訓練</TabsTrigger>
                            <TabsTrigger value="pain">傷病回報</TabsTrigger>
                        </TabsList>

                        <TabsContent value="daily" className="space-y-6">
                            {/* 回報表單 */}
                            <DailyReportForm playerId={player.id} />

                            {/* 近期紀錄 */}
                            <DailyRecordHistory playerId={player.id} variant="compact" />
                        </TabsContent>

                        <TabsContent value="pain" className="space-y-6">
                            {/* 疼痛回報 */}
                            <PainReportForm playerId={player.id} />

                            {/* 疼痛紀錄 */}
                            <PainRecordList playerId={player.id} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    // 教練端 Layout
    return (
        <div className="space-y-6">
            {/* 返回按鈕 */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to={`/${teamSlug}/players`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {player.jersey_number || '#'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{player.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {player.position || '未設定位置'} · {team?.name || teamSlug}
                        </p>
                    </div>
                </div>
            </div>

            {/* 球員基本資訊 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        球員資訊
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">背號</p>
                            <p className="font-medium">{player.jersey_number || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">位置</p>
                            <p className="font-medium">{player.position || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">身高</p>
                            <p className="font-medium">
                                {player.height_cm ? `${player.height_cm} cm` : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">體重</p>
                            <p className="font-medium">
                                {player.weight_kg ? `${player.weight_kg} kg` : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="history" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="history">訓練歷史</TabsTrigger>
                        <TabsTrigger value="pain">傷病紀錄</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="history">
                    {/* 歷史紀錄 */}
                    <DailyRecordHistory playerId={player.id} variant="full" />
                </TabsContent>

                <TabsContent value="pain">
                    {/* 傷病紀錄 */}
                    <PainRecordList playerId={player.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
