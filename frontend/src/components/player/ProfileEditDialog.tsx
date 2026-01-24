import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, User, Hash } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePlayerProfile } from '@/hooks/usePlayer';

// Player mode: old password only required when changing to new password
const playerProfileSchema = z.object({
    name: z.string().min(2, '姓名至少 2 個字'),
    jersey_number: z.string().optional(),
    position: z.string().optional(),
    height_cm: z.string().optional(),
    weight_kg: z.string().optional(),
    birth_date: z.string().optional(),
    old_password: z.string().optional(),
    new_password: z.string().optional(),
    confirm_new_password: z.string().optional(),
}).refine((data) => {
    // 若填寫了新密碼，則必須填寫舊密碼
    if (data.new_password && data.new_password.length > 0) {
        return !!data.old_password && data.old_password.length > 0;
    }
    return true;
}, {
    message: "變更密碼前請先輸入舊密碼",
    path: ["old_password"],
}).refine((data) => {
    if (data.new_password && data.new_password !== data.confirm_new_password) {
        return false;
    }
    return true;
}, {
    message: "新密碼不一致",
    path: ["confirm_new_password"],
});

// Coach mode: no old password required, but new password must match if provided
const coachProfileSchema = z.object({
    name: z.string().min(2, '姓名至少 2 個字'),
    jersey_number: z.string().optional(),
    position: z.string().optional(),
    height_cm: z.string().optional(),
    weight_kg: z.string().optional(),
    birth_date: z.string().optional(),
    new_password: z.string().optional(),
    confirm_new_password: z.string().optional(),
}).refine((data) => {
    if (data.new_password && data.new_password !== data.confirm_new_password) {
        return false;
    }
    return true;
}, {
    message: "新密碼不一致",
    path: ["confirm_new_password"],
});

type PlayerProfileFormData = z.infer<typeof playerProfileSchema>;
type CoachProfileFormData = z.infer<typeof coachProfileSchema>;
type ProfileFormData = PlayerProfileFormData | CoachProfileFormData;

interface ProfileEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: 'player' | 'coach'; // Add mode prop
    player: {
        id: string;
        name: string;
        jersey_number?: string;
        position?: string;
        height_cm?: number;
        weight_kg?: number;
        birth_date?: string;
    };
}

export function ProfileEditDialog({ open, onOpenChange, mode = 'player', player }: ProfileEditDialogProps) {
    const updateProfile = useUpdatePlayerProfile();

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>({
        resolver: zodResolver(mode === 'coach' ? coachProfileSchema : playerProfileSchema),
        defaultValues: {
            name: '',
            jersey_number: '',
            position: '',
            height_cm: '',
            weight_kg: '',
            birth_date: '',
            ...(mode === 'player' ? { old_password: '' } : {}),
            new_password: '',
            confirm_new_password: '',
        }
    });

    // Reset form when dialog opens or player changes
    useEffect(() => {
        if (open && player) {
            reset({
                name: player.name,
                jersey_number: player.jersey_number || '',
                position: player.position || '',
                height_cm: player.height_cm?.toString() || '',
                weight_kg: player.weight_kg?.toString() || '',
                birth_date: player.birth_date || '',
                ...(mode === 'player' ? { old_password: '' } : {}),
                new_password: '',
                confirm_new_password: '',
            });
        }
    }, [open, player, mode, reset]);

    const newPasswordValue = watch('new_password');
    const isChangingPassword = !!newPasswordValue && newPasswordValue.length > 0;

    const onSubmit = async (data: ProfileFormData) => {
        try {
            await updateProfile.mutateAsync({
                playerId: player.id,
                oldPassword: mode === 'player' ? (data as PlayerProfileFormData).old_password : null,
                name: data.name,
                jerseyNumber: data.jersey_number || null,
                position: data.position || null,
                height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
                weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
                birth_date: data.birth_date || null,
                newPassword: data.new_password || null
            });

            alert('個人資料已更新');
            onOpenChange(false);
        } catch (error: any) {
            console.error('Update profile failed:', error);
            // Check for specific error message from RPC
            if (error.message && error.message.includes('舊密碼錯誤')) {
                alert('舊密碼錯誤，請重新輸入');
            } else {
                alert('更新失敗，請稍後再試');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>修改{mode === 'coach' ? '球員' : '個人'}資料</DialogTitle>
                    <DialogDescription>
                        {mode === 'coach'
                            ? '教練可以直接修改球員資料。若需要重設密碼，請輸入新密碼即可。'
                            : '您可以直接修改個人基本資料。若要「變更密碼」，才需要輸入舊密碼進行驗證。'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">

                    {/* 姓名 */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4" /> 姓名
                        </Label>
                        <Input id="name" {...register('name')} placeholder="您的姓名" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 背號 */}
                        <div className="space-y-2">
                            <Label htmlFor="jersey_number" className="flex items-center gap-2">
                                <Hash className="h-4 w-4" /> 背號
                            </Label>
                            <Input id="jersey_number" {...register('jersey_number')} placeholder="例如: 23" />
                        </div>

                        {/* 位置 */}
                        <div className="space-y-2">
                            <Label htmlFor="position" className="flex items-center gap-2">位置</Label>
                            <Input id="position" {...register('position')} placeholder="投手" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 身高 */}
                        <div className="space-y-2">
                            <Label htmlFor="height_cm">身高 (cm)</Label>
                            <Input id="height_cm" type="number" step="0.1" {...register('height_cm')} placeholder="180" />
                        </div>
                        {/* 體重 */}
                        <div className="space-y-2">
                            <Label htmlFor="weight_kg">體重 (kg)</Label>
                            <Input id="weight_kg" type="number" step="0.1" {...register('weight_kg')} placeholder="75" />
                        </div>
                    </div>

                    {/* 出生日期 */}
                    <div className="space-y-2">
                        <Label htmlFor="birth_date">出生日期</Label>
                        <Input id="birth_date" type="date" {...register('birth_date')} />
                    </div>

                    {mode === 'coach' && <div className="border-t my-4" />}

                    {/* Password Section - Only show old_password if needed or if changing password */}
                    {mode === 'player' && (
                        <div className={`space-y-4 pt-4 border-t transition-all ${isChangingPassword ? 'opacity-100' : 'opacity-40'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold">帳號安全設定</span>
                            </div>

                            {/* 舊密碼 - Only for player mode, only required if new_password is set */}
                            <div className="space-y-2">
                                <Label htmlFor="old_password" className={isChangingPassword ? 'text-primary' : 'text-slate-400'}>
                                    舊密碼 {isChangingPassword ? '(變更密碼必填)' : '(僅在變更密碼時需要)'}
                                </Label>
                                <Input
                                    id="old_password"
                                    type="password"
                                    {...register('old_password' as any)}
                                    placeholder={isChangingPassword ? "請輸入目前的密碼" : "變更基本資料免填"}
                                    className={!isChangingPassword ? 'bg-muted/50 cursor-not-allowed' : ''}
                                    disabled={!isChangingPassword}
                                />
                                {errors && 'old_password' in errors && errors.old_password && (
                                    <p className="text-sm text-destructive">{(errors as any).old_password.message}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 新密碼 */}
                    <div className="space-y-2">
                        <Label htmlFor="new_password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" /> {mode === 'coach' ? '新密碼 (選填)' : '新密碼 (選填)'}
                        </Label>
                        <Input
                            id="new_password"
                            type="password"
                            {...register('new_password')}
                            placeholder={mode === 'coach' ? '輸入新密碼以重設' : '若不修改請留空'}
                        />
                    </div>

                    {/* 確認新密碼 */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm_new_password">確認新密碼</Label>
                        <Input
                            id="confirm_new_password"
                            type="password"
                            {...register('confirm_new_password')}
                            placeholder="再輸入一次新密碼"
                        />
                        {errors.confirm_new_password && <p className="text-sm text-destructive">{errors.confirm_new_password.message}</p>}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    儲存中
                                </>
                            ) : (
                                '儲存設定'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
