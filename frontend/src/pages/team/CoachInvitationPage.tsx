import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';

// Step 1: Code Validation
const codeSchema = z.object({
    code: z.string().min(1, '請輸入通行碼'),
});

export default function CoachInvitationPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: team } = useTeam(teamSlug || '');

    const [step, setStep] = useState<1 | 2>(1);
    const [teamInfo, setTeamInfo] = useState<{ id: string; name: string } | null>(null);
    const [invitationCode, setInvitationCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInvitationDisabled, setIsInvitationDisabled] = useState(false);

    // Form 1: Code Validation
    const { register: registerCode, handleSubmit: handleCodeSubmit, formState: { errors: codeErrors }, setError: setCodeError } = useForm<{ code: string }>({
        resolver: zodResolver(codeSchema),
    });

    // Handle Google OAuth
    const handleGoogleAuth = async () => {
        if (invitationCode) {
            sessionStorage.setItem('coach_invitation_code', invitationCode);
            sessionStorage.setItem('coach_team_slug', teamSlug || '');
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) alert('Google 登入失敗: ' + error.message);
    };

    // Step 1 Submit: Validate Code
    const onCodeSubmit = async (values: { code: string }) => {
        console.log('--- Step 1: Code Submit Starting ---');
        console.log('Entered Code:', values.code);
        console.log('Current Team Slug:', teamSlug);

        setIsLoading(true);
        try {
            // 直接呼叫 RPC 避免 Hook 狀態延遲問題
            console.log('Calling RPC: validate_coach_invitation_code with p_invcode...');

            // 加入 Promise.race 避免無限等待
            const rpcPromise = supabase.rpc('validate_coach_invitation_code', { p_invcode: values.code });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('伺服器回應超時，請檢查網路連線或重試')), 10000));

            const response = await Promise.race([rpcPromise, timeoutPromise]) as any;
            const { data: results, error: validateError } = response;

            if (validateError) {
                console.error('RPC validateError:', validateError);
                throw validateError;
            }

            console.log('RPC Results:', results);
            const result = results?.[0];

            if (!result) {
                console.warn('No result found for this code.');
                setCodeError('code', { message: '無效的通行碼，請確認是否輸入正確' });
                setIsLoading(false);
                return;
            }

            // 轉小寫比較，防呆
            if (result.team_slug?.toLowerCase() !== teamSlug?.toLowerCase()) {
                console.warn('Team Slug Mismatch:', result.team_slug, 'vs', teamSlug);
                setCodeError('code', { message: '此通行碼不屬於此球隊' });
                setIsLoading(false);
                return;
            }

            // 檢查是否啟用
            if (result.is_enabled === false) {
                setCodeError('code', { message: '目前未開放加入，請洽教練' });
                setIsInvitationDisabled(true);
                setIsLoading(false);
                return;
            }

            console.log('Validated Team Info:', result);
            setTeamInfo({ id: result.team_id, name: result.team_name });
            setInvitationCode(values.code);

            // 如果已經登入，直接嘗試加入
            if (user) {
                console.log('User is already logged in (ID:', user.id, '), attempting to join team...');
                const { data: joinData, error: joinError } = await supabase
                    .rpc('join_team_as_coach', { invitation_code: values.code });

                if (joinError) {
                    console.error('Join team RPC error:', joinError);
                    throw joinError;
                }

                console.log('Join team success:', joinData);

                // 成功加入，確保停止載入狀態後再跳轉
                setIsLoading(false);
                navigate(`/${teamSlug}`);
            } else {
                console.log('User is not logged in, storing code and moving to step 2');
                // 先存入 sessionStorage 以防萬一
                sessionStorage.setItem('coach_invitation_code', values.code);
                sessionStorage.setItem('coach_team_slug', teamSlug || '');

                setStep(2);
                setIsLoading(false);
            }

        } catch (err: any) {
            console.error('Coach Invitation Error Exception:', err);
            // 嘗試從不同欄位取得錯誤訊息
            const errorMsg = err.message || err.details || (typeof err === 'string' ? err : '驗證失敗，請重新輸入');
            setCodeError('code', { message: errorMsg });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-8 pt-12">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-slate-500">教練團隊邀請</p>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight px-4 transition-all uppercase">
                                {team?.name || teamSlug}
                            </h1>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-[1px] w-8 bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                {teamInfo ? "Identity Verification" : "Invitation Code Required"}
                            </span>
                            <div className="h-[1px] w-8 bg-slate-200" />
                        </div>

                        <div className="pt-2">
                            <span className="text-sm font-black bg-primary/10 text-primary py-2 px-6 rounded-2xl border border-primary/20 shadow-sm">
                                @{teamSlug}
                            </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-6">
                    {step === 1 && (
                        <form onSubmit={handleCodeSubmit(onCodeSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">請輸入球隊邀請通行碼</Label>
                                <Input
                                    {...registerCode('code')}
                                    placeholder="4 位數通行碼"
                                    className="text-center text-xl tracking-widest h-14 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                                    autoFocus
                                    disabled={isInvitationDisabled}
                                />
                                {codeErrors.code && <p className="text-sm text-destructive font-medium">{codeErrors.code.message}</p>}
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                disabled={isLoading || isInvitationDisabled}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    isInvitationDisabled ? '停止招募' : (
                                        <>下一步 <ArrowRight className="ml-2 h-5 w-5" /></>
                                    )
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 py-4">
                            <div className="text-center space-y-2">
                                <h3 className="font-black text-2xl tracking-tight text-slate-900">最後一步</h3>
                                <p className="text-sm font-medium text-slate-500">
                                    請登入帳號以加入 <span className="text-primary font-bold">{teamInfo?.name}</span> 教練團
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-14 rounded-2xl shadow-sm border-slate-200 hover:bg-slate-50 hover:border-primary/30 transition-all font-bold text-lg"
                                onClick={handleGoogleAuth}
                                disabled={isLoading}
                            >
                                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                使用 Google 帳號登入
                            </Button>

                            <div className="pt-2 text-center">
                                <Button
                                    variant="ghost"
                                    className="text-slate-400 hover:text-slate-600 font-bold"
                                    onClick={() => setStep(1)}
                                >
                                    返回輸入通行碼
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
