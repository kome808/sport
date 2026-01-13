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

const profileSchema = z.object({
    name: z.string().min(2, '姓名至少 2 個字'),
    jersey_number: z.string().optional(),
    position: z.string().optional(),
    height_cm: z.string().optional(),
    weight_kg: z.string().optional(),
    old_password: z.string().min(1, '請輸入舊密碼以進行驗證'),
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

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    player: {
        id: string;
        name: string;
        jersey_number?: string;
        position?: string;
        height_cm?: number;
        weight_kg?: number;
    };
}

export function ProfileEditDialog({ open, onOpenChange, player }: ProfileEditDialogProps) {
    const updateProfile = useUpdatePlayerProfile();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            jersey_number: '',
            position: '',
            height_cm: '',
            weight_kg: '',
            old_password: '',
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
                old_password: '', // Always clear passwords
                new_password: '',
                confirm_new_password: '',
            });
        }
    }, [open, player, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        try {
            await updateProfile.mutateAsync({
                playerId: player.id,
                oldPassword: data.old_password,
                name: data.name,
                jerseyNumber: data.jersey_number || null,
                position: data.position || null,
                height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
                weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
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
                    <DialogTitle>修改個人資料</DialogTitle>
                    <DialogDescription>
                        請輸入舊密碼以確認變更。若不想修改密碼，新密碼欄位請留空。
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

                    <div className="border-t my-4" />

                    {/* 舊密碼 */}
                    <div className="space-y-2">
                        <Label htmlFor="old_password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" /> 舊密碼 (必填)
                        </Label>
                        <Input
                            id="old_password"
                            type="password"
                            {...register('old_password')}
                            placeholder="請輸入目前的密碼"
                        />
                        {errors.old_password && <p className="text-sm text-destructive">{errors.old_password.message}</p>}
                    </div>

                    {/* 新密碼 */}
                    <div className="space-y-2">
                        <Label htmlFor="new_password">新密碼 (選填)</Label>
                        <Input
                            id="new_password"
                            type="password"
                            {...register('new_password')}
                            placeholder="若不修改請留空"
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
