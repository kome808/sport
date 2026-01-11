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

// 表單驗證 Schema
const loginSchema = z.object({
    email: z.string().email('請輸入有效的 Email 格式'),
    password: z.string().min(6, '密碼至少需要 6 個字元'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
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

            // 登入成功，直接跳轉到測試球隊頁面
            navigate('/doraemon-baseball');
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
                            ST
                        </div>
                        <span className="font-bold text-2xl">運動訓練平台</span>
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
                        <CardContent className="space-y-4">
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
                        <CardFooter className="flex flex-col gap-4 pt-2">
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
