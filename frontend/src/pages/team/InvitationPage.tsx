/**
 * 球隊邀請頁面
 * 選手輸入通行碼 -> 認領或建立帳號
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, UserPlus, UserCheck, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { usePlayerLogin, usePlayerSession } from '@/hooks/usePlayer';
import { useTeam } from '@/hooks/useTeam';


// Step 1: 通行碼驗證
const codeSchema = z.object({
    code: z.string().min(1, '請輸入通行碼'),
});

// Step 3: 選手資料 (整合認領與新增)
const playerSchema = z.object({
    name: z.string().min(2, '姓名至少 2 個字'),
    jersey_number: z.string().optional(),
    password: z.string().min(4, '密碼至少 4 碼'),
    confirmPassword: z.string(),
    mode: z.enum(['new', 'claim']),
    playerId: z.string().optional(), // 若是認領，需有 ID
}).refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
});

type PlayerFormData = z.infer<typeof playerSchema>;

export default function InvitationPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const navigate = useNavigate();
    const { data: team } = useTeam(teamSlug || '');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [teamInfo, setTeamInfo] = useState<{ id: string; name: string } | null>(null);
    const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
    const [invitationCode, setInvitationCode] = useState<string | null>(null);
    const [isJoiningTeam, setIsJoiningTeam] = useState(false);
    const [isInvitationDisabled, setIsInvitationDisabled] = useState(false);
    // Hooks
    const { login } = usePlayerSession();
    const loginMutation = usePlayerLogin(); // 用於最後自動登入

    // Form 1: Code
    const { register: registerCode, handleSubmit: handleCodeSubmit, formState: { errors: codeErrors }, setError: setCodeError } = useForm<{ code: string }>({
        resolver: zodResolver(codeSchema),
    });

    // Form 3: Player
    const { register: registerPlayer, handleSubmit: handlePlayerSubmit, formState: { errors: playerErrors }, setValue: setPlayerValue, watch } = useForm<PlayerFormData>({
        resolver: zodResolver(playerSchema),
        defaultValues: {
            mode: 'new',
        },
    });

    const isModeNew = watch('mode') === 'new';

    // Step 1 Submit: 驗證通行碼
    const onCodeSubmit = async (data: { code: string }) => {
        try {
            // 1. 呼叫 RPC 驗證通行碼並取得球隊資訊
            const { data: teams, error: teamError } = await supabase
                .rpc('validate_invitation_code', { code: data.code });

            if (teamError) throw teamError;

            // validate_invitation_code returns an array (table), take first
            const matchedTeam = teams?.[0];

            if (!matchedTeam) {
                setCodeError('code', { message: '無效的通行碼' });
                return;
            }

            // 檢查是否為正確的球隊 (雖然 code 唯一，但檢查 slug 確保 URL 正確)
            if (matchedTeam.team_slug !== teamSlug) {
                setCodeError('code', { message: '此通行碼不屬於目前所在的球隊頁面' });
                return;
            }

            // 檢查是否開放邀請
            if (matchedTeam.is_invitation_enabled === false) {
                setCodeError('code', { message: '目前未開放加入，請洽教練' });
                setIsInvitationDisabled(true);
                return;
            }

            setTeamInfo({ id: matchedTeam.team_id, name: matchedTeam.team_name });
            setInvitationCode(data.code); // Store the validated code

            // 2. 取得可認領球員列表 (使用 Secure RPC)
            const { data: players, error: playersError } = await supabase
                .rpc('get_team_players_for_claim', { code: data.code });

            if (playersError) throw playersError;

            setAvailablePlayers(players || []);
            setStep(2);

        } catch (err: any) {
            console.error(err);
            setCodeError('code', { message: err.message || '驗證失敗，請重試' });
        }
    };

    // Step 2: 選擇身份
    const handleSelectIdentity = (type: 'new' | 'claim', player?: any) => {
        setPlayerValue('mode', type);
        if (type === 'claim' && player) {
            setSelectedPlayer(player);
            setPlayerValue('playerId', player.id);
            setPlayerValue('name', player.name, { shouldValidate: true });
            setPlayerValue('jersey_number', player.jersey_number || '', { shouldValidate: true });
        } else {
            setSelectedPlayer(null);
            setPlayerValue('playerId', undefined);
            setPlayerValue('name', '', { shouldValidate: true });
            setPlayerValue('jersey_number', '', { shouldValidate: true });
        }
        setStep(3);
    };

    // Step 3 Submit: 建立或更新 (使用 join_team RPC)
    const onPlayerSubmit = async (data: PlayerFormData) => {
        if (!teamInfo || !invitationCode) return;

        setIsJoiningTeam(true);

        try {
            const rpcPayload: any = {
                invitation_code: invitationCode,
                mode: data.mode,
                name: data.mode === 'new' ? data.name : null,
                jersey_number: data.mode === 'new' ? (data.jersey_number || null) : null,
                password: data.password,
                player_id: data.mode === 'claim' ? data.playerId : null
            };

            const { data: result, error } = await supabase
                .rpc('join_team', rpcPayload);

            if (error) throw error;

            const { id: player_id, short_code } = result;

            // 自動登入
            if (player_id) {
                // 稍微延遲確保 DB 寫入
                setTimeout(async () => {
                    try {
                        const loggedInPlayer = await loginMutation.mutateAsync({
                            playerCode: short_code || player_id, // Use short_code if available
                            password: data.password
                        });
                        // 這裡拿到的是正確的 player 物件
                        const code = loggedInPlayer.short_code || loggedInPlayer.id; // prefer short_code for URL
                        login(loggedInPlayer, teamSlug!);
                        navigate(`/${teamSlug}/p/${code}`);
                    } catch (loginErr) {
                        console.error("Auto login failed:", loginErr);
                        alert("加入成功，但自動登入失敗。請手動登入。");
                        navigate(`/${teamSlug}/login`); // 導向一般登入頁
                    }
                }, 500);
            }

        } catch (error: any) {
            console.error(error);
            // TODO: Better error handling, e.g., display specific messages
            // For now, just log and potentially show a generic error
            alert(error.message || '加入球隊失敗，請重試');
        } finally {
            setIsJoiningTeam(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-8 pt-12">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-slate-500">加入運動隊伍</p>
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

                        <span className="text-sm font-black bg-primary/10 text-primary py-2 px-6 rounded-2xl border border-primary/20 shadow-sm">
                            @{teamSlug}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="pb-6">
                    {step === 1 && (
                        <form onSubmit={handleCodeSubmit(onCodeSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">請輸入球隊邀請通行碼</Label>
                                <Input
                                    {...registerCode('code')}
                                    placeholder="由教練提供的 4 位數代碼"
                                    className="text-center text-xl tracking-widest h-14 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                                    disabled={isInvitationDisabled}
                                    autoFocus
                                />
                                {codeErrors.code && <p className="text-sm text-destructive font-bold">{codeErrors.code.message}</p>}
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                disabled={isInvitationDisabled}
                            >
                                {isInvitationDisabled ? '停止招募' : (
                                    <>下一步 <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                請選擇您的身份
                            </p>

                            <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-4 px-4"
                                onClick={() => handleSelectIdentity('new')}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">我是新選手</div>
                                    <div className="text-xs text-muted-foreground">名單上找不到我，我要建立新資料</div>
                                </div>
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">或認領現有資料</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {availablePlayers.map(player => (
                                    <Button
                                        key={player.id}
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => handleSelectIdentity('claim', player)}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3 font-bold text-xs">
                                            {player.jersey_number}
                                        </div>
                                        <span>{player.name}</span>
                                    </Button>
                                ))}
                                {availablePlayers.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        沒有可認領的選手資料
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <form onSubmit={handlePlayerSubmit(onPlayerSubmit)} className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-2">
                                    {isModeNew ? <UserPlus className="h-8 w-8" /> : <UserCheck className="h-8 w-8" />}
                                </div>
                                <h3 className="font-medium">
                                    {isModeNew ? '建立新選手資料' : `認領身分：${selectedPlayer?.name}`}
                                </h3>
                            </div>

                            {isModeNew && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>姓名</Label>
                                            <Input {...registerPlayer('name')} placeholder="您的姓名" />
                                            {playerErrors.name && <p className="text-xs text-destructive">{playerErrors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>背號 (選填)</Label>
                                            <Input
                                                {...registerPlayer('jersey_number')}
                                                placeholder="例如: 23"
                                            />
                                            {playerErrors.jersey_number && <p className="text-xs text-destructive">{playerErrors.jersey_number.message}</p>}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-3 pt-4 border-t">
                                <Label>設定登入密碼</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        {...registerPlayer('password')}
                                        className="pl-9"
                                        placeholder="設定密碼 (至少 4 碼)"
                                    />
                                </div>
                                <Input
                                    type="password"
                                    {...registerPlayer('confirmPassword')}
                                    placeholder="再次確認密碼"
                                />
                                {playerErrors.confirmPassword && <p className="text-xs text-destructive">{playerErrors.confirmPassword.message}</p>}
                                {playerErrors.password && <p className="text-xs text-destructive">{playerErrors.password.message}</p>}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                    上一步
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isJoiningTeam || loginMutation.isPending}>
                                    {(isJoiningTeam || loginMutation.isPending) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        '完成並登入'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
