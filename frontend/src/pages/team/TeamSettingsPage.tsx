/**
 * 球隊設定頁面
 * 設定通行碼與邀請連結
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, Info, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTeam, useUpdateTeamInvitation, useUpdateTeam } from '@/hooks/useTeam';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const invitationSchema = z.object({
    name: z.string().min(2, '球隊名稱至少 2 個字').max(50, '球隊名稱最多 50 個字'),
    invitation_code: z.string().min(4, '通行碼至少 4 碼').max(20, '通行碼最多 20 碼'),
    is_invitation_enabled: z.boolean(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function TeamSettingsPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const { data: team, isLoading } = useTeam(teamSlug || '');
    const invitationMutation = useUpdateTeamInvitation();
    const updateTeamMutation = useUpdateTeam();
    const [isCopied, setIsCopied] = useState(false);

    const form = useForm<InvitationFormData>({
        resolver: zodResolver(invitationSchema),
        defaultValues: {
            name: '',
            invitation_code: '',
            is_invitation_enabled: true,
        },
    });

    // 載入初始資料
    useEffect(() => {
        if (team) {
            form.reset({
                name: team.name || '',
                invitation_code: team.invitation_code || '',
                is_invitation_enabled: team.is_invitation_enabled ?? true,
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

        // 更新球隊名稱
        if (data.name !== team.name) {
            updateTeamMutation.mutate({
                teamId: team.id,
                updates: { name: data.name }
            });
        }
    };

    const inviteLink = `${window.location.origin}/invite/${teamSlug}`;

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;
    }

    if (!team) {
        return <div className="text-center mt-20">找不到球隊資料</div>;
    }

    const isPending = updateTeamMutation.isPending || invitationMutation.isPending;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">球隊設定</h2>
                <p className="text-muted-foreground">管理球隊基本資料與邀請機制</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* 基本資料設定 */}
                <Card>
                    <CardHeader>
                        <CardTitle>基本資料</CardTitle>
                        <CardDescription>
                            編輯球隊名稱與基本資訊
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">球隊名稱</Label>
                            <Input
                                id="name"
                                {...form.register('name')}
                                placeholder="輸入球隊名稱"
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 邀請機制設定 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🔗 邀請機制
                            {team.is_invitation_enabled && (
                                <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    已啟用
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            設定球隊邀請連結與通行碼，讓學生自行加入
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 開關 */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">啟用邀請連結</Label>
                                <p className="text-sm text-muted-foreground">
                                    關閉後，學生將無法透過連結加入球隊
                                </p>
                            </div>
                            <div className="flex items-center h-full">
                                <input
                                    type="checkbox"
                                    id="invitation-switch"
                                    className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary"
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
                                學生點擊連結後，需輸入此通行碼才能加入
                            </p>
                            {form.formState.errors.invitation_code && (
                                <p className="text-xs text-destructive">{form.formState.errors.invitation_code.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                儲存設定
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
