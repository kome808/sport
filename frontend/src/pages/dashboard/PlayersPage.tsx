/**
 * 球員管理頁面
 * 整合真實資料與 CRUD 功能
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Search,
    MoreHorizontal,
    Users,
    Copy,
    Edit,
    Trash2,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import {
    useTeam,
    usePlayersWithTodayStatus,
    useAddPlayer,
    useUpdatePlayer,
    useDeletePlayer
} from '@/hooks/useTeam';
import type { Player } from '@/types';

// 新增球員 Schema
const playerSchema = z.object({
    name: z.string().min(2, '姓名至少需要 2 個字元'),
    jersey_number: z.string().min(1, '請輸入背號'),
    position: z.string().min(1, '請輸入守備位置'),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const riskBadgeVariants = {
    green: 'default',
    yellow: 'secondary',
    red: 'destructive',
    black: 'destructive',
} as const;

export default function PlayersPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    // Hooks
    const { data: team } = useTeam(teamSlug || '');
    const { data: players, isLoading } = usePlayersWithTodayStatus(team?.id);
    const addPlayerMutation = useAddPlayer();
    const updatePlayerMutation = useUpdatePlayer();
    const deletePlayerMutation = useDeletePlayer();

    // Form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<PlayerFormData>({
        resolver: zodResolver(playerSchema),
    });

    // 處理新增/編輯提交
    const onSubmit = async (data: PlayerFormData) => {
        if (!team?.id) return;

        try {
            if (isEdit && editingPlayer) {
                await updatePlayerMutation.mutateAsync({
                    id: editingPlayer.id,
                    ...data,
                });
            } else {
                await addPlayerMutation.mutateAsync({
                    team_id: team.id,
                    ...data,
                    // 預設密碼 (實際應用應更安全處理)
                    password_hash: '$2a$10$abcdefghijklmnopqrstuv', // placeholder hash
                });
            }
            setIsAddDialogOpen(false);
            reset();
            setIsEdit(false);
            setEditingPlayer(null);
        } catch (error) {
            console.error('儲存失敗:', error);
            // TODO: Add Toast notification
        }
    };

    // 開啟編輯對話框
    const handleEdit = (player: Player) => {
        setEditingPlayer(player);
        setIsEdit(true);
        setValue('name', player.name);
        setValue('jersey_number', player.jersey_number || '');
        setValue('position', player.position || '');
        setIsAddDialogOpen(true);
    };

    // 處理刪除
    const handleDelete = async (playerId: string) => {
        if (confirm('確定要移除這位球員嗎？')) {
            try {
                await deletePlayerMutation.mutateAsync(playerId);
            } catch (error) {
                console.error('刪除失敗:', error);
            }
        }
    };

    // 篩選球員
    const filteredPlayers = players?.filter(
        (player) =>
            player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.jersey_number.includes(searchQuery) ||
            (player.position && player.position.includes(searchQuery))
    ) || [];

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 頁面標題 */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">球員管理</h2>
                    <p className="text-muted-foreground">
                        管理球隊成員 ({players?.length || 0} 人)
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) {
                        setIsEdit(false);
                        setEditingPlayer(null);
                        reset();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            新增球員
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEdit ? '編輯球員' : '新增球員'}</DialogTitle>
                            <DialogDescription>
                                {isEdit ? '修改球員資料' : '填寫球員基本資料，預設密碼為 1234'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="playerName">姓名</Label>
                                    <Input
                                        id="playerName"
                                        placeholder="輸入球員姓名"
                                        {...register('name')}
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="jerseyNumber">背號</Label>
                                        <Input
                                            id="jerseyNumber"
                                            placeholder="例: 7"
                                            {...register('jersey_number')}
                                        />
                                        {errors.jersey_number && <p className="text-xs text-destructive">{errors.jersey_number.message}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="position">守備位置</Label>
                                        <Input
                                            id="position"
                                            placeholder="例: 投手"
                                            {...register('position')}
                                        />
                                        {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    取消
                                </Button>
                                <Button type="submit" disabled={addPlayerMutation.isPending || updatePlayerMutation.isPending}>
                                    {isEdit ? '儲存變更' : '建立球員'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 搜尋與篩選 */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="搜尋球員姓名、背號..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Badge variant="outline">
                    <Users className="mr-1 h-3 w-3" />
                    {filteredPlayers.length} 位顯示中
                </Badge>
            </div>

            {/* 球員列表 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPlayers.map((player) => {
                    const riskLevel = player.riskLevel || 'green';

                    return (
                        <Card key={player.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <Link
                                        to={`/${teamSlug}/player/${player.id}`}
                                        className="flex items-center gap-3 flex-1 min-w-0"
                                    >
                                        <div
                                            className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${player.riskLevel
                                                ? riskBadgeVariants[player.riskLevel as keyof typeof riskBadgeVariants] === 'destructive' ? 'bg-danger' :
                                                    riskBadgeVariants[player.riskLevel as keyof typeof riskBadgeVariants] === 'secondary' ? 'bg-warning' : 'bg-primary'
                                                : 'bg-primary' // 預設顏色
                                                }`}
                                        >
                                            {player.jersey_number}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{player.name}</p>
                                            <p className="text-sm text-muted-foreground">{player.position}</p>
                                        </div>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/player/login`);
                                                // TODO: Toast
                                            }}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                複製登入連結
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(player)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                編輯資料
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(player.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                移除球員
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <Badge
                                        variant={player.riskLevel ? (player.riskLevel === 'red' || player.riskLevel === 'black' ? 'destructive' : player.riskLevel === 'yellow' ? 'secondary' : 'default') : 'outline'}
                                    >
                                        {riskLevel === 'green' && '正常'}
                                        {riskLevel === 'yellow' && '注意'}
                                        {riskLevel === 'red' && '高風險'}
                                        {riskLevel === 'black' && '極高風險'}
                                        {!player.riskLevel && '無資料'}
                                    </Badge>

                                    {!player.hasReportedToday && (
                                        <span className="text-xs text-muted-foreground">今日未回報</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
