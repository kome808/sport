/**
 * 教練註冊頁面
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

// 表單驗證 Schema
const registerSchema = z.object({
    name: z.string().min(2, '姓名至少需要 2 個字元'),
    email: z.string().email('請輸入有效的 Email 格式'),
    password: z.string().min(8, '密碼至少需要 8 個字元'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: '密碼不一致',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRequirements = [
    { label: '至少 8 個字元', test: (pw: string) => pw.length >= 8 },
    { label: '包含大寫字母', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: '包含小寫字母', test: (pw: string) => /[a-z]/.test(pw) },
    { label: '包含數字', test: (pw: string) => /[0-9]/.test(pw) },
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch('password', '');

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const result = await signUp(data.email, data.password, data.name);

            if (!result.success) {
                const errorMsg = result.error?.message || '註冊失敗，請稍後再試';
                if (errorMsg.includes('already registered')) {
                    setErrorMessage('此 Email 已經註冊過');
                } else {
                    setErrorMessage(errorMsg);
                }
                setIsLoading(false);
                return;
            }

            if (result.user && !result.user.email_confirmed_at && !result.user.app_metadata.provider) {
                // Email 註冊但未驗證 (Supabase 預設行為)
                setErrorMessage('註冊成功！請至您的信箱收取確認信件，驗證後即可登入。');
                setIsLoading(false);
                return;
            }

            // 註冊成功，導向球隊設定
            navigate('/team/setup');
        } catch (error) {
            console.error('註冊錯誤:', error);
            setErrorMessage('連線錯誤，請稍後再試');
        } finally {
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
                            ST
                        </div>
                        <span className="font-bold text-2xl">運動訓練平台</span>
                    </Link>
                </div>

                <Card className="shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">免費註冊</CardTitle>
                        <CardDescription>
                            建立您的教練帳號，開始管理球隊
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
                                <Label htmlFor="name">姓名</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="王教練"
                                    {...register('name')}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>
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
                                <Label htmlFor="password">密碼</Label>
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
                                {/* 密碼強度提示 */}
                                {password && (
                                    <ul className="text-xs space-y-1 mt-2">
                                        {passwordRequirements.map((req) => (
                                            <li
                                                key={req.label}
                                                className={`flex items-center gap-1.5 ${req.test(password) ? 'text-green-600' : 'text-muted-foreground'
                                                    }`}
                                            >
                                                <Check className={`h-3 w-3 ${req.test(password) ? '' : 'opacity-30'}`} />
                                                {req.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">確認密碼</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('confirmPassword')}
                                    disabled={isLoading}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                建立帳號
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                                已經有帳號？{' '}
                                <Link to="/login" className="text-primary hover:underline font-medium">
                                    登入
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
