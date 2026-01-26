/**
 * 球員登入頁面
 * 簡易密碼驗證
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer, usePlayerLogin, usePlayerSession } from '@/hooks/usePlayer';
import { useTeam } from '@/hooks/useTeam';

export default function PlayerLoginPage() {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Demo Mode Auto-fill
    // 判斷是否為展示球隊
    const isDemo = teamSlug === 'doraemon-baseball' || teamSlug === 'shohoku-basketball';

    // Auth for Anonymous
    const { signInAnonymously } = useAuth();
    const [isDemoLoading, setIsDemoLoading] = useState(false);

    useEffect(() => {
        if (isDemo && !password) {
            setPassword('demo123');
        }
    }, [isDemo]);

    // 取得球隊資料
    const { data: team } = useTeam(teamSlug || '');

    // 取得球員資料
    const { data: player, isLoading: playerLoading } = usePlayer(playerId);

    // Session 管理
    const { session, login, isLoading: sessionLoading } = usePlayerSession();

    // 登入 mutation
    const loginMutation = usePlayerLogin();

    // 如果已登入，直接跳轉
    useEffect(() => {
        // 嚴格檢查：只有當 Session 中的 Player ID 與目前讀取到的 Player ID (解析後) 一致時才跳轉
        // 這避免了 short_code 與 uuid 不匹配，或是登入 A 球員卻在看 B 球員登入頁的情況
        if (!sessionLoading && session && player && session.playerId === player.id) {
            navigate(`/${teamSlug}/p/${playerId}`); // 這裡保留 URL 上的 ID (可能是 short_code)
        }
    }, [session, sessionLoading, player, playerId, teamSlug, navigate]);

    const handleDemoLogin = async () => {
        setIsDemoLoading(true);
        try {
            // 1. 確保匿名身份 (權限用)
            const { error: authError } = await (signInAnonymously as any)();
            if (authError) throw authError;

            // 2. 執行球員登入 (取得 Token/Session)
            const playerData = await loginMutation.mutateAsync({
                playerCode: playerId!,
                password: 'demo123',
            });

            // 3. 儲存 Session 並跳轉
            const urlCode = playerData.short_code || playerData.id;
            login(playerData, teamSlug!);
            navigate(`/${teamSlug}/p/${urlCode}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || '演示登入失敗');
        } finally {
            setIsDemoLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isDemo) {
            handleDemoLogin();
            return;
        }

        if (!password.trim()) {
            setError('請輸入密碼');
            return;
        }

        try {
            const playerData = await loginMutation.mutateAsync({
                playerCode: playerId!,
                password: password.trim(),
            });

            const urlCode = playerData.short_code || playerData.id;
            login(playerData, teamSlug!);
            navigate(`/${teamSlug}/p/${urlCode}`);
        } catch (err: any) {
            setError(err.message || '登入失敗');
        }
    };

    // 載入中
    if (playerLoading || sessionLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-slate-500 font-bold">載入中...</span>
            </div>
        );
    }

    // 找不到球員
    if (!player) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-lg font-medium text-destructive">找不到球員資料</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            請確認網址 ID 或短代碼是否正確 ({playerId})
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F4F7] px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 h-96 w-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-info/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md border-slate-200/60 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-xl relative z-50">
                <CardHeader className="text-center pt-10 pb-6">
                    {/* 球員頭像 - Premium Style */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary text-3xl font-black tracking-tighter border-2 border-white shadow-lg shadow-primary/10 ring-8 ring-primary/5">
                                {player.avatar_url ? (
                                    <img src={player.avatar_url} alt={player.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span>#{player.jersey_number || '00'}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                                <Lock className="h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{player.name}</CardTitle>
                    <CardDescription className="text-slate-500 font-bold mt-1">
                        <span className="text-primary/70">{team?.name || teamSlug}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span>背號 #{player.jersey_number || '?'}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isDemo ? (
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-500 text-sm leading-relaxed text-center">
                                    <span className="block font-bold text-slate-700 mb-1">✨ 展示模式</span>
                                    無需密碼，點擊下方按鈕即可直接檢視 <br /> {player.name} 的訓練數據。
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Label htmlFor="password" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    專屬存取密碼
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="請輸入 4-6 位數字密碼"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        className="rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white h-14 pl-12 text-lg font-bold tracking-[0.5em] transition-all group-hover:border-primary/30"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                                {error && (
                                    <p className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">{error}</p>
                                )}
                            </div>
                        )}

                        <Button
                            type={isDemo ? "button" : "submit"}
                            onClick={isDemo ? (e) => {
                                e.preventDefault();
                                handleDemoLogin();
                            } : undefined}
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover font-black text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loginMutation.isPending || isDemoLoading}
                        >
                            {loginMutation.isPending || isDemoLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    進行驗證中...
                                </>
                            ) : (
                                isDemo ? '立即查看數據' : '開始回報訓練狀態'
                            )}
                        </Button>

                        <div className="text-center pt-2">
                            <Link
                                to="/"
                                className="text-xs font-bold text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-2 group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                返回系統主頁
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
