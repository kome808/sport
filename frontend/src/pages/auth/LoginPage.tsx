/**
 * 教練登入頁面
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';

// 表單驗證 Schema
const loginSchema = z.object({
    email: z.string().email('請輸入有效的 Email 格式'),
    password: z.string().min(6, '密碼至少需要 6 個字元'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        const result = await signInWithGoogle();
        if (!result.success && result.error) {
            setErrorMessage(result.error.message || 'Google 登入失敗');
            setIsLoading(false);
        }
        // If successful, redirect is handled by OAuth flow
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const result = await signIn(data.email, data.password);

            if (!result.success) {
                let message = '登入失敗，請稍後再試';
                if (result.error?.message === 'Invalid login credentials') {
                    message = '帳號或密碼錯誤';
                } else if (result.error?.message) {
                    message = result.error.message;
                }
                setErrorMessage(message);
                setIsLoading(false);
                return;
            }

            // 登入成功，判斷導向位置
            // 查詢教練自己所屬的球隊
            const { data: teams } = await supabase
                .schema(SCHEMA_NAME)
                .from('teams')
                .select('slug')
                .eq('coach_id', result.user?.id)
                .limit(1);

            if (teams && teams.length > 0) {
                navigate(`/${teams[0].slug}`);
            } else {
                // 若無球隊，導向建立球隊頁面
                navigate('/team/setup');
            }
        } catch (error: any) {
            console.error('登入錯誤:', error);
            setErrorMessage(error.message || '連線錯誤，請稍後再試');
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

                <Card className="shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">教練登入</CardTitle>
                        <CardDescription>
                            輸入您的帳號密碼登入系統
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4 py-4">
                            {/* 錯誤訊息 */}
                            {errorMessage && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {errorMessage}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    {...register('email')}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">密碼</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        忘記密碼？
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 pb-6 pt-0">
                            <Button
                                className="w-full bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        登入中...
                                    </>
                                ) : (
                                    '登入'
                                )}
                            </Button>

                            {/* Google OAuth Divider */}
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">或</span>
                                </div>
                            </div>

                            {/* Google Login Button */}
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                使用 Google 登入
                            </Button>

                            <p className="text-center text-sm text-foreground/60">
                                還沒有帳號嗎？
                                <Link to="/register" className="font-semibold text-[#7367F0] hover:text-[#5E50EE] ml-1">
                                    免費註冊
                                </Link>
                            </p>
                            <Link to="/" className="w-full">
                                <Button variant="outline" type="button" className="w-full border-muted-foreground/20 text-foreground/70 hover:bg-muted hover:text-foreground">
                                    返回首頁 (取消)
                                </Button>
                            </Link>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
