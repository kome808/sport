import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

// Schema Validation
const resetPasswordSchema = z.object({
    password: z.string().min(6, '密碼至少需要 6 個字元'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if we have a session (handled by auto-login from the magic link)
    useEffect(() => {
        // supabase.auth.onAuthStateChange is usually handled globally,
        // but here we ensure the user is authenticated (which the recovery link does)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might have clicked an old link or it's invalid
                // setError('連結已失效或您尚未登入。請重新申請重設密碼。');
                // NOTE: Supabase recovery link logs the user in automatically.
            }
        };
        checkSession();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            setIsSuccess(true);

            // Redirect after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || '重設密碼失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-green-700">密碼重設成功</CardTitle>
                        <CardDescription>
                            您的密碼已更新。系統將在 3 秒後自動導向登入頁面...
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-[#7367F0] hover:bg-[#5E50EE]"
                        >
                            立即登入
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">重設密碼</CardTitle>
                    <CardDescription>
                        請輸入您的新密碼
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4 py-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">新密碼</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="至少 6 個字元"
                                        className="pl-9"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">確認新密碼</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="再次輸入密碼"
                                        className="pl-9"
                                        {...register('confirmPassword')}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-6 pt-0">
                        <Button
                            className="w-full bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    更新中...
                                </>
                            ) : (
                                '確認更改'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
