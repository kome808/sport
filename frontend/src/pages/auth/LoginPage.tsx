/**
 * 教練登入頁面
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const { user, isAnonymous, isLoading: authLoading, signInWithGoogle, signInAnonymously } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 智能導航：只有「正式使用者」才自動跳轉
    useEffect(() => {
        if (!authLoading && user && !isAnonymous) {
            console.log('[LoginPage] Formal user detected, redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
        }
    }, [user, isAnonymous, authLoading, navigate]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        const result = await signInWithGoogle();
        if (!result.success && result.error) {
            setErrorMessage(result.error.message || 'Google 登入失敗');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full" style={{ maxWidth: '28rem' }}>
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                            SR
                        </div>
                        <span className="font-bold text-2xl">SportRepo</span>
                    </Link>
                </div>

                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="space-y-1 text-center pb-8">
                        <CardTitle className="text-3xl font-black tracking-tight">歡迎回來</CardTitle>
                        <CardDescription className="text-base font-medium">
                            登入教練管理後台
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 錯誤訊息 */}
                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-bold">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            {/* Check if in Demo Mode */}
                            {new URLSearchParams(window.location.search).get('demo') === 'coach' ? (
                                <div className="pt-2">
                                    <p className="text-sm font-bold text-center mb-6 text-indigo-600 bg-indigo-50 py-2 rounded-lg border border-indigo-100 uppercase tracking-widest">
                                        ✨ 展示模式 ✨
                                    </p>
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-500 text-sm leading-relaxed">
                                            系統將為您建立一個 <span className="font-bold text-indigo-600 underline">匿名臨時帳號</span>，您可以直接體驗儀表板與各項專業圖表數據，無需填寫任何個資。
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={async () => {
                                                setIsLoading(true);
                                                const result = await (signInAnonymously as any)();
                                                if (result.success) {
                                                    console.log('匿名登入成功，正在獲取展示球隊...');
                                                    // 取得第一支球隊並直接跳轉，避免在 dashboard 轉圈圈
                                                    const { data: teams, error: rpcError } = await supabase.rpc('get_my_teams');

                                                    if (rpcError) {
                                                        console.error('RPC Error:', rpcError);
                                                        setErrorMessage('無法取得展示球隊數據');
                                                        setIsLoading(false);
                                                        return;
                                                    }

                                                    if (teams && teams.length > 0) {
                                                        const targetPath = `/${teams[0].slug}`;
                                                        console.log(`正在跳轉至展示球隊: ${targetPath}`);
                                                        navigate(targetPath);
                                                    } else {
                                                        console.warn('找不到任何展示球隊，退回到儀表板');
                                                        navigate('/dashboard');
                                                    }
                                                } else {
                                                    setErrorMessage(result.error?.message || '匿名登入失敗');
                                                    setIsLoading(false);
                                                }
                                            }}
                                            disabled={isLoading}
                                            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                                        >
                                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : '立即開始演示'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full h-14 rounded-2xl shadow-sm border-slate-200 hover:bg-slate-50 hover:border-primary/30 transition-all font-bold text-lg"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            使用 Google 帳號登入
                                        </>
                                    )}
                                </Button>
                            )}
                            <p className="text-xs text-slate-400 text-center font-medium">
                                點擊上方按鈕即可快速、安全地進入系統
                            </p>

                            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-xs leading-relaxed text-slate-500 font-medium text-center">
                                    <AlertCircle className="h-4 w-4 inline-block mr-2 -mt-0.5 opacity-60 text-primary" />
                                    因本系統目前為 BETA 版，使用 Google 認證登入會顯示
                                    <span className="text-slate-900 font-bold block sm:inline"> "繼續使用「plnsfktjktaxgrennwcy.supabase.co」" </span>
                                    為正常現象，請放心登入。
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    className="text-[10px] text-slate-300 hover:text-slate-500 font-medium underline uppercase tracking-tighter"
                                >
                                    登入遇到問題？清除所有連線紀錄
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-10 pt-2">
                        <p className="text-sm text-center text-slate-500 font-medium">
                            還沒有教練帳號？{' '}
                            <Link to="/register" className="text-primary hover:underline font-black">
                                免費快速註冊
                            </Link>
                        </p>
                        <div className="h-[1px] w-12 bg-slate-200 mx-auto" />
                        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                            返回首頁
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
