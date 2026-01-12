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
import { usePlayer, usePlayerLogin, usePlayerSession } from '@/hooks/usePlayer';
import { useTeam } from '@/hooks/useTeam';

export default function PlayerLoginPage() {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
        if (!sessionLoading && session && session.playerId === playerId) {
            navigate(`/${teamSlug}/p/${playerId}`);
        }
    }, [session, sessionLoading, playerId, teamSlug, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password.trim()) {
            setError('請輸入密碼');
            return;
        }

        try {
            const playerData = await loginMutation.mutateAsync({
                playerCode: playerId!,  // playerId 可以是 short_code 或 UUID
                password: password.trim(),
            });

            // 登入成功 - 使用 short_code 作為 URL（如果有的話）
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    {/* 球員頭像 */}
                    <div className="flex justify-center mb-4">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                            {player.jersey_number || player.name.charAt(0)}
                        </div>
                    </div>

                    <CardTitle className="text-xl">{player.name}</CardTitle>
                    <CardDescription>
                        {team?.name || teamSlug} · #{player.jersey_number || '?'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                <Lock className="inline-block h-4 w-4 mr-1" />
                                登入密碼
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="請輸入密碼"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    登入中...
                                </>
                            ) : (
                                '登入填寫回報'
                            )}
                        </Button>

                        <div className="text-center">
                            <Link
                                to="/"
                                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                返回首頁
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
