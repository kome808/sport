/**
 * 教練登入頁面
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
                                    <p className="text-sm font-bold text-center mb-4 text-indigo-600">-- 演示模式登入 --</p>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        // 暫時停用 Demo 登入以恢復系統穩定
                                        setErrorMessage('演示系統維護中，請使用正常帳號登入。');
                                    }} className="space-y-3">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-500 pl-1 uppercase">帳號</p>
                                            <input
                                                readOnly
                                                value="sportrepotw@gmail.com"
                                                className="w-full h-12 px-4 rounded-xl border bg-slate-100/50 text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-500 pl-1 uppercase">密碼</p>
                                            <input
                                                type="password"
                                                readOnly
                                                value="sportrepotw"
                                                className="w-full h-12 px-4 rounded-xl border bg-slate-100/50 text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-12 rounded-xl text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    登入中...
                                                </>
                                            ) : (
                                                '一鍵登入演示帳號'
                                            )}
                                        </Button>
                                    </form>
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
