import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const forgotPasswordSchema = z.object({
    email: z.string().email('請輸入有效的 Email 格式'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                // 為安全起見，通常不顯示"查無此帳號"
                console.error(error);
                setError('發送重設郵件失敗，請稍後再試。');
            } else {
                setIsSubmitted(true);
            }
        } catch (err) {
            console.error(err);
            setError('發生預期外的錯誤。');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md shadow-card border-0">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <CardTitle className="text-xl">郵件已發送</CardTitle>
                        <CardDescription>
                            請檢查您的信箱，我們已發送密碼重設連結給您。
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link to="/login">
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回登入
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md shadow-card border-0">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">忘記密碼</CardTitle>
                    <CardDescription>
                        輸入您的 Email，我們將發送重設連結給您
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
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
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            發送重設連結
                        </Button>
                        <Link to="/login" className="w-full">
                            <Button variant="ghost" className="w-full gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回登入
                            </Button>
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
