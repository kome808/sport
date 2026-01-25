/**
 * 教練註冊頁面
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
    const { user, isAnonymous, isLoading: authLoading, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 智能導覽：只有「正式使用者」才自動跳轉
    useEffect(() => {
        if (!authLoading && user && !isAnonymous) {
            console.log('[RegisterPage] Formal user detected, redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
        }
    }, [user, isAnonymous, authLoading, navigate]);

    const handleGoogleRegister = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        const result = await signInWithGoogle();
        if (!result.success && result.error) {
            setErrorMessage(result.error.message || 'Google 註冊失敗');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
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
                        <CardTitle className="text-3xl font-black tracking-tight">建立管理中心</CardTitle>
                        <CardDescription className="text-base font-medium">
                            使用教練帳號開始管理您的球隊
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                        {/* 錯誤訊息 */}
                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-bold">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full h-14 rounded-2xl shadow-sm border-slate-200 hover:bg-slate-50 hover:border-primary/30 transition-all font-bold text-lg"
                                onClick={handleGoogleRegister}
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
                                        使用 Google 快速註冊
                                    </>
                                )}
                            </Button>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                                <p className="text-[11px] leading-relaxed text-amber-700 font-bold">
                                    ⚠️ Beta 測試說明：
                                </p>
                                <p className="text-[11px] leading-relaxed text-amber-600 font-medium">
                                    下一步將引導至 Google 認證，因目前本系統為 BETA 版本，畫面顯示繼續使用「plnsfktjktaxgrennwcy.supabase.co」是正常現象。
                                </p>
                            </div>

                            <p className="text-xs text-slate-400 text-center font-medium px-4">
                                註冊即代表您同意本系統之使用規範與隱私權條款
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-10">
                        <p className="text-sm text-center text-slate-500 font-medium">
                            已經擁有教練帳號？{' '}
                            <Link to="/login" className="text-primary hover:underline font-black">
                                立即登入
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
