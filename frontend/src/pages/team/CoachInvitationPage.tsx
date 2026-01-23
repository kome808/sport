import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, ShieldCheck, Mail, Lock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useValidateCoachInvitation, useJoinTeamAsCoach } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';

// Step 1: Code Validation
const codeSchema = z.object({
    code: z.string().min(1, '請輸入通行碼'),
});

// Step 2: Register/Login
const registerSchema = z.object({
    name: z.string().min(2, '姓名至少 2 個字'),
    email: z.string().email('Email 格式不正確'),
    password: z.string().min(6, '密碼至少 6 碼'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function CoachInvitationPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2>(1);
    const [teamInfo, setTeamInfo] = useState<{ id: string; name: string } | null>(null);
    const [invitationCode, setInvitationCode] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

    const validateMutation = useValidateCoachInvitation();
    const joinMutation = useJoinTeamAsCoach();
    const { signInWithGoogle } = useAuth();

    // Handle Google OAuth
    const handleGoogleAuth = async () => {
        // Store invitation code in sessionStorage so we can use it after redirect
        if (invitationCode) {
            sessionStorage.setItem('coach_invitation_code', invitationCode);
            sessionStorage.setItem('coach_team_slug', teamSlug || '');
        }
        const result = await signInWithGoogle();
        if (!result.success && result.error) {
            alert(result.error.message || 'Google 登入失敗');
        }
    };

    // Form 1
    const { register: registerCode, handleSubmit: handleCodeSubmit, formState: { errors: codeErrors }, setError: setCodeError } = useForm<{ code: string }>({
        resolver: zodResolver(codeSchema),
    });

    // Form 2
    const { register: registerAuth, handleSubmit: handleAuthSubmit, formState: { errors: authErrors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    // Step 1: Validate Code
    const onCodeSubmit = async (data: { code: string }) => {
        try {
            const result = await validateMutation.mutateAsync(data.code);

            if (!result) {
                setCodeError('code', { message: '無效的通行碼' });
                return;
            }

            if (result.team_slug !== teamSlug) {
                setCodeError('code', { message: '此通行碼不屬於此球隊' });
                return;
            }

            setTeamInfo({ id: result.team_id, name: result.team_name });
            setInvitationCode(data.code);

            // If user is already logged in, join directly
            if (user) {
                handleJoin(data.code);
            } else {
                setStep(2);
            }

        } catch (err: any) {
            setCodeError('code', { message: '驗證失敗' });
        }
    };

    // Step 3: Join Logic
    const handleJoin = async (code: string, coachName?: string) => {
        setIsJoining(true);
        try {
            await joinMutation.mutateAsync({
                code: code,
                name: coachName
            });
            navigate(`/${teamSlug}`);
        } catch (err: any) {
            console.error(err);
            alert(err.message || '加入失敗');
            setIsJoining(false);
        }
    };

    // Step 2: Auth & Join
    const onAuthSubmit = async (data: RegisterFormData) => {
        setIsJoining(true);
        try {
            let authData;

            if (authMode === 'register') {
                const response = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        data: { full_name: data.name }
                    }
                });
                if (response.error) throw response.error;
                authData = response.data;
            } else {
                const response = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                });
                if (response.error) throw response.error;
                authData = response.data;
            }

            // Check if we have a session
            if (!authData.session) {
                // Determine if this is due to email confirmation
                if (authMode === 'register' && !authData.user && !authData.session) {
                    // This case usually implies error, but we checked error above.
                    // If user is null but no error? Rare.
                } else if (authMode === 'register' && authData.user && !authData.session) {
                    alert("註冊成功！請檢查您的電子信箱並點擊驗證連結，驗證完成後請重新登入。");
                    setIsJoining(false);
                    setAuthMode('login'); // Switch to login mode
                    return;
                } else {
                    // Login but no session?
                    throw new Error('登入狀態異常，無法取得 Session');
                }
            }

            // Allow a brief moment for client state to settle (optional but safe)
            await new Promise(resolve => setTimeout(resolve, 500));

            if (invitationCode) {
                await handleJoin(invitationCode, data.name);
            }

        } catch (err: any) {
            console.error(err);
            // Handle specific Supabase errors if needed
            if (err.message && err.message.includes('rate limit')) {
                alert('請求過於頻繁，請稍後再試');
            } else {
                alert(err.message || '認證失敗');
            }
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        教練團隊邀請
                    </CardTitle>
                    <CardDescription>
                        {teamSlug}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    {step === 1 && (
                        <form onSubmit={handleCodeSubmit(onCodeSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>請輸入教練通行碼</Label>
                                <Input
                                    {...registerCode('code')}
                                    placeholder="4 位數通行碼"
                                    className="text-center text-lg tracking-widest"
                                />
                                {codeErrors.code && <p className="text-sm text-destructive">{codeErrors.code.message}</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={validateMutation.isPending}>
                                {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                下一步 <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleAuthSubmit(onAuthSubmit)} className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-lg">
                                    {authMode === 'register' ? '建立教練帳號' : '登入現有帳號'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    加入 {teamInfo?.name} 的教練團隊
                                </p>
                            </div>

                            {authMode === 'register' && (
                                <div className="space-y-2">
                                    <Label>姓名</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input {...registerAuth('name')} className="pl-9" placeholder="您的稱呼" />
                                    </div>
                                    {authErrors.name && <p className="text-xs text-destructive">{authErrors.name.message}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input {...registerAuth('email')} className="pl-9" placeholder="name@example.com" />
                                </div>
                                {authErrors.email && <p className="text-xs text-destructive">{authErrors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>密碼</Label>
                                    {authMode === 'login' && (
                                        <a href="/forgot-password" className="text-xs text-primary hover:underline">
                                            忘記密碼？
                                        </a>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="password" {...registerAuth('password')} className="pl-9" placeholder={authMode === 'register' ? '設定密碼' : '輸入密碼'} />
                                </div>
                                {authErrors.password && <p className="text-xs text-destructive">{authErrors.password.message}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isJoining}>
                                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {authMode === 'register' ? '註冊並加入' : '登入並加入'}
                            </Button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">或</span>
                                </div>
                            </div>

                            {/* Google OAuth Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGoogleAuth}
                                disabled={isJoining}
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                使用 Google {authMode === 'register' ? '註冊' : '登入'}
                            </Button>

                            <div className="text-center text-sm pt-2">
                                {authMode === 'register' ? (
                                    <span className="text-muted-foreground">
                                        已有帳號？
                                        <button type="button" onClick={() => setAuthMode('login')} className="text-primary hover:underline ml-1">直接登入</button>
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        沒有帳號？
                                        <button type="button" onClick={() => setAuthMode('register')} className="text-primary hover:underline ml-1">註冊新帳號</button>
                                    </span>
                                )}
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

