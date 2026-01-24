/**
 * 球隊設定頁面
 * 設定通行碼與邀請連結
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, Info, Loader2, Save, Trash2, Shield, UserCog, Pen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    useTeam,
    useUpdateTeamInvitation,
    useUpdateTeam,
    useUpdateTeamCoachInvitation,
    useTeamCoaches,
    useRemoveCoach
} from '@/hooks/useTeam';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const invitationSchema = z.object({
    name: z.string().min(2, '球隊名稱至少 2 個字').max(50, '球隊名稱最多 50 個字'),
    invitation_code: z.string().min(4, '通行碼至少 4 碼').max(20, '通行碼最多 20 碼'),
    is_invitation_enabled: z.boolean(),
    coach_invitation_code: z.string().min(4, '通行碼至少 4 碼').max(20, '通行碼最多 20 碼').optional(),
    is_coach_invitation_enabled: z.boolean().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function TeamSettingsPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const { data: team, isLoading } = useTeam(teamSlug || '');
    const invitationMutation = useUpdateTeamInvitation();
    const coachInvitationMutation = useUpdateTeamCoachInvitation();
    const updateTeamMutation = useUpdateTeam();
    const { data: coaches, isLoading: isLoadingCoaches } = useTeamCoaches(team?.id);
    const removeCoachMutation = useRemoveCoach();

    const isDemo = teamSlug === 'doraemon-baseball';

    const [isCopied, setIsCopied] = useState(false);
    const [isCoachLinkCopied, setIsCoachLinkCopied] = useState(false);
    const [coachToDelete, setCoachToDelete] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);

    const form = useForm<InvitationFormData>({
        resolver: zodResolver(invitationSchema),
        defaultValues: {
            name: '',
            invitation_code: '',
            is_invitation_enabled: true,
            coach_invitation_code: '',
            is_coach_invitation_enabled: true,
        },
    });

    // 載入初始資料
    useEffect(() => {
        if (team) {
            form.reset({
                name: team.name || '',
                invitation_code: team.invitation_code || '',
                is_invitation_enabled: team.is_invitation_enabled ?? true,
                coach_invitation_code: team.coach_invitation_code || '',
                is_coach_invitation_enabled: team.is_coach_invitation_enabled ?? true,
            });
        }
    }, [team, form]);

    const generateRandomCode = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const onSubmit = (data: InvitationFormData) => {
        if (!team) return;

        // 更新邀請設定
        invitationMutation.mutate({
            teamId: team.id,
            code: data.invitation_code,
            enabled: data.is_invitation_enabled,
        });

        // 更新教練邀請設定
        coachInvitationMutation.mutate({
            teamId: team.id,
            code: data.coach_invitation_code || '',
            enabled: data.is_coach_invitation_enabled || false,
        });

        // 更新球隊名稱
        if (data.name !== team.name) {
            updateTeamMutation.mutate({
                teamId: team.id,
                updates: { name: data.name }
            });
        }
    };

    const inviteLink = `${window.location.origin}/invite/${teamSlug}`;
    const coachInviteLink = `${window.location.origin}/invite/coach/${teamSlug}`;

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const copyCoachLink = () => {
        navigator.clipboard.writeText(coachInviteLink);
        setIsCoachLinkCopied(true);
        setTimeout(() => setIsCoachLinkCopied(false), 2000);
    };

    const handleDeleteCoach = async () => {
        if (!team || !coachToDelete) return;
        await removeCoachMutation.mutateAsync({ teamId: team.id, coachId: coachToDelete });
        setCoachToDelete(null);
    };

    if (isLoading) {
        return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;
    }

    if (!team) {
        return <div className="text-center mt-20">找不到球隊資料</div>;
    }

    const isPending = updateTeamMutation.isPending || invitationMutation.isPending;

    return (
        <div className="max-w-4xl mx-auto py-8 pb-12 space-y-6">
            <div className="px-4 md:px-0">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">球隊設定</h2>
                <p className="text-slate-500 mt-1">管理球隊基本資料、安全性與邀請機制</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4 md:px-0">

                {/* 基本資料設定 */}
                <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                        <CardTitle className="text-xl font-bold text-slate-900">基本資料</CardTitle>
                        <CardDescription className="text-sm text-slate-500">
                            編輯球隊名稱與顯示資訊，將向所有成員展示。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">球隊名稱</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="name"
                                    {...form.register('name')}
                                    placeholder="輸入球隊名稱"
                                    disabled={!isEditingName || isDemo}
                                    className={`transition-colors ${!isEditingName || isDemo ? 'bg-slate-50 border-transparent cursor-default font-bold' : ''}`}
                                />
                                {isEditingName ? (
                                    <>
                                        <Button
                                            type="button"
                                            size="icon"
                                            onClick={() => {
                                                const currentName = form.getValues('name');
                                                if (currentName !== team?.name) { // Only submit if changed
                                                    form.handleSubmit(onSubmit)();
                                                }
                                                setIsEditingName(false);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 h-10 w-10 shrink-0 rounded-lg"
                                        >
                                            <Check className="h-4 w-4 text-white" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                form.setValue('name', team?.name || '');
                                                setIsEditingName(false);
                                            }}
                                            className="h-10 w-10 shrink-0 rounded-lg"
                                        >
                                            <X className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsEditingName(true);
                                        }}
                                        className="h-10 w-10 shrink-0 rounded-lg"
                                    >
                                        <Pen className="h-4 w-4 text-slate-500" />
                                    </Button>
                                )}
                            </div>
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        {/* 選手登入網址 */}
                        <div className="space-y-2">
                            <Label>選手登入網址</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={`${window.location.origin}/${teamSlug}/login`}
                                    readOnly
                                    className="bg-muted font-mono text-sm"
                                />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/${teamSlug}/login`);
                                                    setIsCopied(true);
                                                    setTimeout(() => setIsCopied(false), 2000);
                                                }}
                                            >
                                                {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>複製登入網址</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                選手使用此網址登入個人帳號
                            </p>
                        </div>


                    </CardContent>
                </Card>

                {/* 邀請機制設定 */}
                <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-base">🔗</span>
                            邀請機制
                            {team.is_invitation_enabled && (
                                <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                                    服務中
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500">
                            設定球隊邀請連結與通行碼，讓選手自行加入
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6 space-y-6">
                        {/* 開關 */}
                        <div className="flex items-center justify-between rounded-2xl border bg-slate-50/50 p-6">
                            <div className="space-y-1">
                                <Label className="text-base font-bold">啟用邀請連結</Label>
                                <p className="text-sm text-muted-foreground">
                                    關閉後，選手將無法透過連結加入球隊
                                </p>
                            </div>
                            <div className="flex items-center h-full">
                                <input
                                    type="checkbox"
                                    id="invitation-switch"
                                    className="h-6 w-6 rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={form.watch('is_invitation_enabled')}
                                    onChange={(e) => form.setValue('is_invitation_enabled', e.target.checked, { shouldDirty: true })}
                                />
                                <Label htmlFor="invitation-switch" className="sr-only">切換開關</Label>
                            </div>
                        </div>

                        {/* 連結區塊 */}
                        <div className="space-y-2">
                            <Label>邀請連結</Label>
                            <div className="flex gap-2">
                                <Input value={inviteLink} readOnly className="bg-muted font-mono text-sm" />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                                                {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>複製連結</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* 通行碼 */}
                        <div className="space-y-2">
                            <Label>球隊通行碼</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        {...form.register('invitation_code')}
                                        placeholder="例如: 8888"
                                        maxLength={20}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => form.setValue('invitation_code', generateRandomCode(), { shouldDirty: true })}
                                >
                                    隨機產生
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                選手點擊連結後，需輸入此通行碼才能加入
                            </p>
                            {form.formState.errors.invitation_code && (
                                <p className="text-xs text-destructive">{form.formState.errors.invitation_code.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                            <Button type="submit" disabled={isPending || isDemo} className="px-8 py-6 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 group">
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                )}
                                {isDemo ? '展示模式 (無法儲存)' : '儲存邀請設定'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 教練邀請設定 */}
                <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                                <Shield className="h-4 w-4 text-indigo-600" />
                            </div>
                            教練團隊邀請
                            {form.watch('is_coach_invitation_enabled') && (
                                <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                                    已開啟
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500">
                            提供此連結與通行碼給其他教練，讓他們加入團隊
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6 space-y-6">
                        {/* Toggle */}
                        <div className="flex items-center justify-between rounded-2xl border bg-slate-50/50 p-6">
                            <div className="space-y-1">
                                <Label className="text-base font-bold">啟用教練邀請連結</Label>
                                <p className="text-sm text-muted-foreground">
                                    啟用後，擁有邀請碼的教練可申請加入
                                </p>
                            </div>
                            <div className="flex items-center h-full">
                                <input
                                    type="checkbox"
                                    id="coach-invitation-switch"
                                    className="h-6 w-6 rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={form.watch('is_coach_invitation_enabled')}
                                    onChange={(e) => form.setValue('is_coach_invitation_enabled', e.target.checked, { shouldDirty: true })}
                                />
                                <Label htmlFor="coach-invitation-switch" className="sr-only">切換開關</Label>
                            </div>
                        </div>

                        {/* Coach Link */}
                        <div className="space-y-2">
                            <Label>教練加入網址</Label>
                            <div className="flex gap-2">
                                <Input value={coachInviteLink} readOnly className="bg-muted font-mono text-sm" />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" onClick={copyCoachLink}>
                                                {isCoachLinkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>複製連結</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Coach Code */}
                        <div className="space-y-2">
                            <Label>教練通行碼</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        {...form.register('coach_invitation_code')}
                                        placeholder="例如: 9999"
                                        maxLength={20}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => form.setValue('coach_invitation_code', generateRandomCode(), { shouldDirty: true })}
                                >
                                    隨機產生
                                </Button>
                            </div>
                            {form.formState.errors.coach_invitation_code && (
                                <p className="text-xs text-destructive">{form.formState.errors.coach_invitation_code.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                            <Button type="submit" disabled={isPending} className="px-8 py-6 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 group">
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                )}
                                儲存教練設定
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 教練名單 */}
                <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                <UserCog className="h-4 w-4 text-slate-600" />
                            </div>
                            教練成員
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500">
                            管理球隊中的教練成員 (共 {coaches?.length || 0} 位)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        {isLoadingCoaches ? (
                            <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                        ) : (
                            <div className="space-y-4">
                                {coaches?.map((coach) => (
                                    <div key={coach.coach_id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-base">
                                                {coach.name?.charAt(0) || coach.email.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-base flex items-center gap-2 text-slate-900">
                                                    {coach.name}
                                                    {coach.role === 'owner' && (
                                                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                                            擁有者
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400">{coach.email}</div>
                                            </div>
                                        </div>
                                        {coach.role !== 'owner' && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                onClick={() => {
                                                    setCoachToDelete(coach.coach_id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {coaches?.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 font-medium">暫無其他教練成員</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>

            <AlertDialog open={!!coachToDelete} onOpenChange={(open) => !open && setCoachToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認移除教練？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作將移除該教練對球隊的管理權限。您隨時可以再次邀請他們加入。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCoach} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            移除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
