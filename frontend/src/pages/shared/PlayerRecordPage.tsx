import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Settings, LogOut, ChevronLeft, Activity, Calendar, Stethoscope, TrendingUp, LayoutDashboard, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DailyReportForm from '@/components/player/DailyReportForm';
import DailyRecordHistory from '@/components/records/DailyRecordHistory';
import { usePlayer, usePlayerSession } from '@/hooks/usePlayer';
import { useTeam } from '@/hooks/useTeam';
import { ProfileEditDialog } from '@/components/player/ProfileEditDialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PainReportForm from '@/components/player/PainReportForm';
import PainRecordList from '@/components/records/PainRecordList';
import FatigueDashboard from '@/components/fatigue/FatigueDashboard';

interface PlayerRecordPageProps {
    mode: 'coach' | 'player';
}

export default function PlayerRecordPage({ mode }: PlayerRecordPageProps) {
    const { teamSlug, playerId, activeTab } = useParams<{ teamSlug: string; playerId: string; activeTab?: string }>();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // 計算年齡
    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // 根據 mode 決定預設頁籤
    const defaultTab = mode === 'player' ? 'dashboard' : 'fatigue';
    const currentTab = activeTab || defaultTab;

    const handleTabChange = (value: string) => {
        if (mode === 'player') {
            navigate(`/${teamSlug}/p/${playerId}/${value}`);
        } else {
            navigate(`/${teamSlug}/player/${playerId}/${value}`);
        }
    };

    // 取得球隊資料
    const { data: team } = useTeam(teamSlug || '');

    // 取得球員資料
    const { data: player, isLoading: playerLoading, error: playerError } = usePlayer(playerId);

    // 球員端 Session 檢查
    const { session, isLoading: sessionLoading, logout } = usePlayerSession();

    // 球員端需要驗證登入狀態
    useEffect(() => {
        if (mode === 'player' && !sessionLoading) {
            // 如果球員資料載入完成，但 Session 不存在或不匹配
            if (player && (!session || session.playerId !== player.id)) {
                // 如果是用 short_code 進來的，session.playerId 是 UUID，player.id 也是 UUID，應該會匹配
                // 無論如何，如果沒登入，就踢去登入頁
                navigate(`/${teamSlug}/login`);
            } else if (!player && !playerLoading && !session) {
                // 找不到球員且沒 Session
                navigate(`/${teamSlug}/login`);
            }
        }
    }, [mode, session, sessionLoading, player, playerLoading, teamSlug, navigate]);

    const handleLogout = () => {
        logout();
        navigate(`/${teamSlug}/login`);
    };

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
            <div className="min-h-screen bg-[#F4F4F7] py-8 px-4">
                <div className="max-w-xl mx-auto space-y-8 pb-12">
                    {/* 整合型個人資訊區塊 - Unified Premium Header */}
                    <Card className="rounded-[2.5rem] border-slate-200 shadow-xl overflow-hidden bg-white border-2 border-slate-100 relative group">
                        <div className="absolute top-0 right-0 p-4 flex gap-2 z-10">
                            <Button variant="outline" size="icon" onClick={() => setIsProfileOpen(true)} className="rounded-2xl border-slate-200 bg-white/80 backdrop-blur-md hover:bg-slate-50 shadow-sm transition-all h-10 w-10">
                                <Settings className="h-5 w-5 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-2xl text-slate-400 hover:text-destructive hover:bg-red-50 transition-all h-10 w-10">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>

                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                {/* Avatar & Primary Info */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                                            {player.avatar_url ? (
                                                <img src={player.avatar_url} alt={player.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-4xl tracking-tighter">#{player.jersey_number || '00'}</span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{player.name}</h1>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black rounded-lg px-2 py-0">#{player.jersey_number || '00'}</Badge>
                                        </div>
                                        <p className="text-slate-400 font-bold flex items-center gap-2">
                                            <span className="text-primary font-black uppercase text-xs tracking-widest">{team?.name || teamSlug}</span>
                                            <span>·</span>
                                            <span>{player.position || '未設定'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Divider or Spacer */}
                                <div className="hidden md:block h-12 w-px bg-slate-100 mx-4" />

                                {/* Compact Info Grid */}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">身高</p>
                                        <p className="font-black text-slate-800 text-lg">{player.height_cm ? `${player.height_cm} cm` : '-'}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">體重</p>
                                        <p className="font-black text-slate-800 text-lg">{player.weight_kg ? `${player.weight_kg} kg` : '-'}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">年齡</p>
                                        <p className="font-black text-slate-800 text-lg">{calculateAge(player.birth_date)} 歲</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">位置</p>
                                        <p className="font-black text-slate-800 text-lg truncate">{player.position || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <ProfileEditDialog
                        open={isProfileOpen}
                        onOpenChange={setIsProfileOpen}
                        player={player}
                    />

                    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 p-1.5 bg-white/50 backdrop-blur-md rounded-[2rem] border border-slate-200/50 shadow-sm h-auto gap-2">
                            <TabsTrigger value="dashboard" className="rounded-[1.5rem] py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all font-black gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                負荷監測 Fatigue
                            </TabsTrigger>
                            <TabsTrigger value="daily" className="rounded-[1.5rem] py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all font-black gap-2">
                                <Calendar className="h-4 w-4" />
                                訓練歷史 History
                            </TabsTrigger>
                            <TabsTrigger value="pain" className="rounded-[1.5rem] py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all font-black gap-2">
                                <Stethoscope className="h-4 w-4" />
                                傷病紀錄 Pain
                            </TabsTrigger>
                            <TabsTrigger value="growth" className="rounded-[1.5rem] py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all font-black gap-2">
                                <TrendingUp className="h-4 w-4" />
                                成長歷程 Growth
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="space-y-6">
                            <FatigueDashboard playerId={player.id} variant="compact" />
                        </TabsContent>

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

                        <TabsContent value="growth" className="space-y-6">
                            <Card className="rounded-3xl border-slate-200 border-2 border-dashed bg-slate-50/50">
                                <CardContent className="p-12 text-center">
                                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                                        <Settings className="h-10 w-10 animate-spin-slow" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">成長歷程模組開發中</h3>
                                    <p className="text-slate-500 font-bold max-w-sm mx-auto">
                                        這裡將會記錄您的長期成長曲線、里程碑與教練評語。敬請期待！
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    // 教練端 Layout
    return (
        <div className="space-y-6 pb-12">
            {/* 整合型標題與基本資訊 - Unified Coach View Header */}
            <Card className="rounded-[2.5rem] border-slate-200 shadow-xl overflow-hidden bg-white border-2 border-slate-100 relative group">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        {/* Avatar & Action */}
                        <div className="flex items-center gap-6">
                            <Button variant="outline" size="icon" asChild className="rounded-2xl h-12 w-12 border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 transition-all group/btn">
                                <Link to={`/${teamSlug}/players`}>
                                    <ChevronLeft className="h-6 w-6 text-slate-500 group-hover/btn:text-primary group-hover/btn:-translate-x-0.5 transition-all" />
                                </Link>
                            </Button>
                            <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-black text-3xl tracking-tighter shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                {player.jersey_number || '00'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{player.name}</h1>
                                <p className="text-slate-400 font-bold flex items-center gap-2 mt-1">
                                    <span className="text-primary font-black uppercase text-xs tracking-widest">{team?.name || teamSlug}</span>
                                    <span>·</span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-black">#{player.jersey_number || '00'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block h-16 w-px bg-slate-100 mx-2" />

                        {/* Consolidated Data Grid */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-primary/30 pl-2 mb-1">位置</p>
                                <p className="font-black text-slate-800 text-lg">{player.position || '-'}</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-primary/30 pl-2 mb-1">身高</p>
                                <p className="font-black text-slate-800 text-lg">{player.height_cm ? `${player.height_cm} cm` : '-'}</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-primary/30 pl-2 mb-1">體重</p>
                                <p className="font-black text-slate-800 text-lg">{player.weight_kg ? `${player.weight_kg} kg` : '-'}</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-primary/30 pl-2 mb-1">年齡</p>
                                <p className="font-black text-slate-800 text-lg">{calculateAge(player.birth_date)} 歲</p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 md:col-span-1 lg:col-span-1">
                                <Button
                                    variant="outline"
                                    className="w-full h-full rounded-xl font-bold border-slate-200 hover:bg-slate-100 transition-all text-xs flex flex-col justify-center items-center py-1"
                                    onClick={() => setIsProfileOpen(true)}
                                >
                                    <Settings className="h-4 w-4 mb-1" />
                                    編輯資料
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <div className="mb-6">
                    <TabsList className="p-1 bg-slate-100 rounded-2xl h-auto flex flex-wrap gap-1 border border-slate-200/50">
                        <TabsTrigger value="fatigue" className="rounded-xl py-3 px-6 text-base data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black gap-2">
                            <Activity className="h-4 w-4" />
                            負荷監測 Fatigue
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-xl py-3 px-6 text-base data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black gap-2">
                            <History className="h-4 w-4" />
                            訓練歷史 History
                        </TabsTrigger>
                        <TabsTrigger value="pain" className="rounded-xl py-3 px-6 text-base data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black gap-2">
                            <Stethoscope className="h-4 w-4" />
                            傷病紀錄 Pain
                        </TabsTrigger>
                        <TabsTrigger value="growth" className="rounded-xl py-3 px-6 text-base data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black gap-2">
                            <TrendingUp className="h-4 w-4" />
                            成長歷程 Growth
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="fatigue">
                    <FatigueDashboard playerId={player.id} variant="full" />
                </TabsContent>

                <TabsContent value="history">
                    {/* 歷史紀錄 */}
                    <DailyRecordHistory playerId={player.id} variant="full" />
                </TabsContent>

                <TabsContent value="pain">
                    {/* 傷病紀錄 */}
                    <PainRecordList playerId={player.id} />
                </TabsContent>

                <TabsContent value="growth">
                    <Card className="rounded-[2.5rem] border-slate-200 border-2 border-dashed bg-slate-50/50">
                        <CardContent className="p-20 text-center">
                            <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 shadow-xl shadow-primary/5">
                                <Settings className="h-12 w-12 animate-spin-slow" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">成長歷程數據模組 (Beta)</h3>
                            <p className="text-slate-500 font-bold max-w-lg mx-auto text-lg leading-relaxed">
                                正在為您構建球員的長期數據追蹤系統，包含能力值演進、技術成長曲線與教練指導評語。
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
