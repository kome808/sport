import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    Users,
    Edit,
    Trash2,
    Loader2,
    UserMinus,
    CheckCircle2,
    AlertTriangle,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Copy,
} from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

import {
    useTeam,
    usePlayersWithTodayStatus,
    useBatchUpdatePlayersStatus,
    useBatchDeletePlayers,
    useUpdatePlayer
} from '@/hooks/useTeam';



export default function PlayersPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'graduated'>('active');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Hooks
    const { data: team } = useTeam(teamSlug || '');
    const { data: players, isLoading } = usePlayersWithTodayStatus(team?.id, activeTab);
    const updatePlayerStatusMutation = useBatchUpdatePlayersStatus();
    const deletePlayersMutation = useBatchDeletePlayers();
    const updatePlayerMutation = useUpdatePlayer();

    // 狀態
    const [editingPlayer, setEditingPlayer] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
    const [activeCopyUrl, setActiveCopyUrl] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // 篩選與排序球員
    const filteredPlayers = useMemo(() => {
        let items = players?.filter(
            (player) =>
                player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (player.jersey_number && player.jersey_number.includes(searchQuery)) ||
                (player.position && player.position.includes(searchQuery))
        ) || [];

        if (sortConfig) {
            items = [...items].sort((a, b) => {
                const aValue = (a as any)[sortConfig.key];
                const bValue = (b as any)[sortConfig.key];

                if (aValue === bValue) return 0;

                const factor = sortConfig.direction === 'asc' ? 1 : -1;

                // 處理數字排序
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return (aValue - bValue) * factor;
                }

                // 處理字串排序 (包含空值處理)
                const strA = String(aValue || '');
                const strB = String(bValue || '');
                return strA.localeCompare(strB, 'zh-Hant') * factor;
            });
        }
        return items;
    }, [players, searchQuery, sortConfig]);

    // 排序處理函式
    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // 排序圖標組件
    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3 text-primary" /> : <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
    };

    // 選取邏輯
    const toggleSelectAll = () => {
        if (selectedPlayerIds.length === filteredPlayers.length && filteredPlayers.length > 0) {
            setSelectedPlayerIds([]);
        } else {
            setSelectedPlayerIds(filteredPlayers.map(p => p.id));
        }
    };

    const toggleSelectPlayer = (playerId: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    // Demo Check
    const isDemo = teamSlug === 'doraemon-baseball';
    const checkDemo = () => {
        if (isDemo) {
            alert('展示模式無法修改球員資料');
            return true;
        }
        return false;
    };

    // 處理編輯提交
    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (checkDemo()) return;
        if (!editingPlayer) return;

        const formData = new FormData(e.currentTarget);
        const updates = {
            id: editingPlayer.id,
            name: formData.get('name') as string,
            jersey_number: formData.get('jersey_number') as string,
            position: formData.get('position') as string,
            birth_date: formData.get('birth_date') as string || undefined,
            height_cm: formData.get('height_cm') ? Number(formData.get('height_cm')) : undefined,
            weight_kg: formData.get('weight_kg') ? Number(formData.get('weight_kg')) : undefined,
        };

        try {
            await updatePlayerMutation.mutateAsync(updates);
            setIsEditDialogOpen(false);
            setEditingPlayer(null);
        } catch (error) {
            console.error('更新球員失敗:', error);
        }
    };

    // 處理批次畢業
    const handleBatchGraduate = async () => {
        if (checkDemo()) return;
        if (selectedPlayerIds.length === 0) return;
        try {
            await updatePlayerStatusMutation.mutateAsync({
                playerIds: selectedPlayerIds,
                status: 'graduated'
            });
            setSelectedPlayerIds([]);
        } catch (error) {
            console.error('更新狀態失敗:', error);
        }
    };

    // 處理批次歸隊
    const handleBatchActivate = async () => {
        if (checkDemo()) return;
        if (selectedPlayerIds.length === 0) return;
        try {
            await updatePlayerStatusMutation.mutateAsync({
                playerIds: selectedPlayerIds,
                status: 'active'
            });
            setSelectedPlayerIds([]);
        } catch (error) {
            console.error('更新狀態失敗:', error);
        }
    };

    // 處理單一/批次刪除
    const handleBatchDelete = async () => {
        if (checkDemo()) return;
        if (selectedPlayerIds.length === 0) return;
        try {
            await deletePlayersMutation.mutateAsync(selectedPlayerIds);
            setSelectedPlayerIds([]);
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error('刪除失敗:', error);
        }
    };

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
                    <h2 className="text-3xl font-black tracking-tight text-black">選手管理</h2>
                    <p className="text-black/80 font-bold text-lg">
                        管理球隊成員 ({players?.length || 0} 人)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate(`/${teamSlug}/players/add`)} className="rounded-xl shadow-lg shadow-primary/25 h-12 px-6 font-black text-lg">
                        <Plus className="mr-2 h-5 w-5" />
                        新增選手
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50 p-4 rounded-2xl border border-muted/50 shadow-sm">
                <Tabs
                    defaultValue="active"
                    className="w-full sm:w-auto"
                    onValueChange={(val) => {
                        setActiveTab(val as 'active' | 'graduated');
                        setSelectedPlayerIds([]);
                    }}
                >
                    <TabsList className="grid w-full grid-cols-2 lg:w-[320px] h-11 p-1 bg-muted/50 rounded-xl shadow-inner border border-muted">
                        <TabsTrigger
                            value="active"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all text-base font-black text-black/60"
                        >
                            在隊中
                        </TabsTrigger>
                        <TabsTrigger
                            value="graduated"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all text-base font-black text-black/60"
                        >
                            已畢業
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
                    <Input
                        placeholder="搜尋選手姓名、背號、位置..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 text-black font-bold bg-white"
                    />
                </div>
            </div>

            {/* 批次操作工具列 */}
            {selectedPlayerIds.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-black text-primary">
                        <Badge className="bg-primary text-white hover:bg-primary rounded-lg px-2 py-1">{selectedPlayerIds.length}</Badge>
                        <span className="text-base">項已選取</span>
                    </div>
                    <div className="flex gap-3">
                        {activeTab === 'active' ? (
                            <Button size="sm" variant="outline" onClick={handleBatchGraduate} className="gap-2 border-primary/20 hover:bg-primary/10 rounded-xl text-black font-black h-10 px-4">
                                <UserMinus className="h-4 w-4" />
                                標記為畢業
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={handleBatchActivate} className="gap-2 border-primary/20 hover:bg-primary/10 rounded-xl text-black font-black h-10 px-4">
                                <CheckCircle2 className="h-4 w-4" />
                                恢復為在隊
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="gap-2 shadow-lg shadow-destructive/20 rounded-xl font-black h-10 px-4 !bg-[#EA5455] !text-white hover:!bg-[#EA5455]/90"
                        >
                            <Trash2 className="h-4 w-4" />
                            刪除選手
                        </Button>
                    </div>
                </div>
            )}

            {/* 球員表格 */}
            <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm">
                <div className="rounded-3xl border border-muted/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/40 font-black">
                            <TableRow className="hover:bg-transparent border-b-2 border-muted/50">
                                <TableHead className="w-[60px] px-6">
                                    <Checkbox
                                        checked={selectedPlayerIds.length === filteredPlayers.length && filteredPlayers.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-2"
                                    />
                                </TableHead>
                                <TableHead onClick={() => handleSort('name')} className="cursor-pointer group hover:bg-muted/60 transition-colors text-black font-black text-base py-4">
                                    <div className="flex items-center">
                                        姓名
                                        <SortIcon columnKey="name" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('jersey_number')} className="cursor-pointer group hover:bg-muted/60 transition-colors text-black font-black text-base py-4">
                                    <div className="flex items-center">
                                        背號
                                        <SortIcon columnKey="jersey_number" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('birth_date')} className="cursor-pointer group hover:bg-muted/60 transition-colors text-black font-black text-base py-4">
                                    <div className="flex items-center">
                                        出生日期
                                        <SortIcon columnKey="birth_date" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('height_cm')} className="cursor-pointer group hover:bg-muted/60 transition-colors text-black font-black text-base py-4">
                                    <div className="flex items-center">
                                        身高
                                        <SortIcon columnKey="height_cm" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('weight_kg')} className="cursor-pointer group hover:bg-muted/60 transition-colors text-black font-black text-base py-4">
                                    <div className="flex items-center">
                                        體重
                                        <SortIcon columnKey="weight_kg" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-black font-black text-base py-4">位置</TableHead>
                                <TableHead className="text-black font-black text-base py-4">今日狀態</TableHead>
                                <TableHead className="text-right px-6 text-black font-black text-base py-4">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlayers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-60 text-center text-black font-black text-xl bg-gray-50/50">
                                        查無選手資料
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPlayers.map((player) => (
                                    <TableRow key={player.id} className="group hover:bg-muted/20 transition-all border-b border-muted/30">
                                        <TableCell className="px-6">
                                            <Checkbox
                                                checked={selectedPlayerIds.includes(player.id)}
                                                onCheckedChange={() => toggleSelectPlayer(player.id)}
                                                className="border-2"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                to={`/${teamSlug}/player/${player.short_code || player.id}`}
                                                className="font-black text-black text-lg hover:text-primary transition-colors hover:underline underline-offset-8"
                                            >
                                                {player.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-black text-lg w-12 h-8 justify-center bg-gray-100 text-black border-2 border-gray-200 rounded-lg">
                                                {player.jersey_number || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-black font-bold text-base">{player.birth_date || '-'}</TableCell>
                                        <TableCell className="text-black font-bold text-base">{player.height_cm ? `${player.height_cm} cm` : '-'}</TableCell>
                                        <TableCell className="text-black font-bold text-base">{player.weight_kg ? `${player.weight_kg} kg` : '-'}</TableCell>
                                        <TableCell className="text-black font-black text-base">
                                            <span className="bg-muted px-2 py-1 rounded-md">{player.position || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={player.riskLevel ? (player.riskLevel === 'red' || player.riskLevel === 'black' ? 'destructive' : player.riskLevel === 'yellow' ? 'secondary' : 'default') : 'outline'}
                                                    className="px-3 py-1 rounded-xl font-black text-sm shadow-md"
                                                >
                                                    {player.riskLevel === 'green' && '正常'}
                                                    {player.riskLevel === 'yellow' && '注意'}
                                                    {player.riskLevel === 'red' && '高風險'}
                                                    {player.riskLevel === 'black' && '極高風險'}
                                                    {!player.riskLevel && '無資料'}
                                                </Badge>
                                                {!player.hasReportedToday && (
                                                    <span className="text-[12px] text-white font-black bg-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm">未回報</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 active:scale-95 transition-all rounded-full border-2 border-transparent hover:border-primary/20">
                                                        <MoreHorizontal className="h-5 w-5 text-black" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-muted/50 p-2 backdrop-blur-lg bg-white/95">
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/${teamSlug}/player/${player.short_code || player.id}`} className="cursor-pointer rounded-xl font-bold text-black py-3 text-sm flex items-center">
                                                            <Users className="mr-3 h-4 w-4 text-primary" />
                                                            詳細數據
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer rounded-xl font-bold text-black py-3 text-sm flex items-center"
                                                        onClick={() => {
                                                            // 改為複製選手首頁連結
                                                            const url = `${window.location.origin}/${teamSlug}/p/${player.short_code || player.id}`;
                                                            setActiveCopyUrl(url);
                                                            navigator.clipboard.writeText(url).then(() => {
                                                                setIsCopyDialogOpen(true);
                                                            }).catch(err => {
                                                                console.error('Copy failed', err);
                                                                // Fallback if copy fails, still show dialog so user can manual copy
                                                                setIsCopyDialogOpen(true);
                                                            });
                                                        }}
                                                    >
                                                        <Copy className="mr-3 h-4 w-4 text-primary" />
                                                        選手回報網址
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer rounded-xl font-bold text-black py-3 text-sm flex items-center"
                                                        onClick={() => {
                                                            setEditingPlayer(player);
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="mr-3 h-4 w-4 text-primary" />
                                                        編輯資料
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-2 bg-muted/50 h-0.5" />
                                                    <DropdownMenuItem
                                                        className="text-destructive cursor-pointer hover:bg-destructive/10 rounded-xl font-bold py-3 text-sm flex items-center"
                                                        onClick={() => {
                                                            setSelectedPlayerIds([player.id]);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-3 h-4 w-4" />
                                                        移除球員
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* 編輯資料彈窗 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[32px] p-0 border-none shadow-2xl overflow-hidden bg-white">
                    <div className="bg-primary/5 px-8 pt-8 pb-6 border-b border-primary/10">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-black flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-2xl">
                                    <Edit className="h-7 w-7 text-primary" />
                                </div>
                                編輯選手資料
                            </DialogTitle>
                            <DialogDescription className="text-black/60 font-black text-lg mt-2">
                                正在更新「{editingPlayer?.name}」的技術手冊資訊。
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">姓名 (必填)</label>
                                <Input name="name" defaultValue={editingPlayer?.name} required className="border-2 border-gray-200 text-black font-black text-lg h-14 rounded-2xl focus:border-primary focus:ring-primary/10 bg-gray-50/30 transition-all" />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">背號</label>
                                <Input name="jersey_number" defaultValue={editingPlayer?.jersey_number} className="border-2 border-gray-200 text-black font-black text-lg h-14 rounded-2xl focus:border-primary focus:ring-primary/10 bg-gray-50/30 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">出生日期</label>
                            <Input name="birth_date" type="date" defaultValue={editingPlayer?.birth_date} className="border-2 border-gray-200 text-black font-black text-lg h-14 rounded-2xl focus:border-primary focus:ring-primary/10 bg-gray-50/30 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">身高 (cm)</label>
                                <Input name="height_cm" type="number" defaultValue={editingPlayer?.height_cm} className="border-2 border-gray-200 text-black font-black text-lg h-14 rounded-2xl focus:border-primary focus:ring-primary/10 bg-gray-50/30 transition-all" />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">體重 (kg)</label>
                                <Input name="weight_kg" type="number" defaultValue={editingPlayer?.weight_kg} className="border-2 border-gray-200 text-black font-black text-lg h-14 rounded-2xl focus:border-primary focus:ring-primary/10 bg-gray-50/30 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">位置</label>
                            <Input name="position" defaultValue={editingPlayer?.position} className="border-2 border-gray-200 text-black font-black text-lg h-14 rounded-2xl focus:border-primary focus:ring-primary/10 bg-gray-50/30 transition-all" placeholder="例如：投手、游擊手" />
                        </div>
                        <DialogFooter className="pt-6 gap-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-2xl flex-1 h-14 font-black border-2 border-gray-300 text-black hover:bg-gray-100 text-lg transition-all">
                                取消變更
                            </Button>
                            <Button type="submit" className="rounded-2xl flex-1 h-14 font-black shadow-2xl shadow-primary/30 text-lg transition-all active:scale-95">
                                確認儲存
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 複製連結確認彈窗 */}
            <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[24px] p-0 border-none shadow-2xl overflow-hidden bg-white">
                    <div className="bg-green-50 px-8 pt-8 pb-6 border-b border-green-100">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-black flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-2xl">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                連結已複製！
                            </DialogTitle>
                            <DialogDescription className="text-black/60 font-bold text-lg mt-2">
                                選手回報網址已複製到剪貼簿。
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-black/40 uppercase tracking-widest pl-1">連結網址</label>
                            <div className="flex items-center gap-2">
                                <input
                                    readOnly
                                    value={activeCopyUrl}
                                    style={{ color: '#000000', opacity: 1, WebkitTextFillColor: '#000000' }}
                                    className="flex-1 border-2 border-gray-200 text-black font-bold text-base h-12 rounded-xl bg-gray-50 px-3 outline-none focus:border-primary/50 w-full"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeCopyUrl);
                                        // Optional: Button feedback, but main action is done
                                    }}
                                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50 shrink-0"
                                >
                                    <Copy className="h-5 w-5 text-black/60" />
                                </Button>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={() => setIsCopyDialogOpen(false)}
                                className="rounded-xl h-12 font-black shadow-lg shadow-primary/20 text-base w-full bg-black text-white hover:bg-black/90"
                            >
                                關閉
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 刪除確認彈窗 */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[24px] p-0 border-none shadow-2xl overflow-hidden bg-white">
                    <div className="bg-destructive/5 px-8 pt-8 pb-6 border-b border-destructive/10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-black flex items-center gap-3">
                                <div className="bg-destructive/10 p-2 rounded-2xl">
                                    <AlertTriangle className="h-6 w-6 text-destructive" />
                                </div>
                                確認刪除選手？
                            </DialogTitle>
                            <DialogDescription className="text-black/60 font-bold text-lg mt-2">
                                您即將永久刪除 <span className="text-destructive font-black">{selectedPlayerIds.length} 位</span> 選手的資料。
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <h4 className="text-destructive font-black text-base mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                警告：此動作無法復原
                            </h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-sm font-bold text-black/70">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                    選手資料將從系統中永久移除
                                </li>
                                <li className="flex items-start gap-2 text-sm font-bold text-black/70">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                    該選手將無法再登入平台
                                </li>
                                <li className="flex items-start gap-2 text-sm font-bold text-black/70">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                    所有的訓練數據與傷病紀錄將一併刪除
                                </li>
                            </ul>
                        </div>

                        <DialogFooter className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    if (selectedPlayerIds.length === 1 && !filteredPlayers.find(p => p.id === selectedPlayerIds[0])) {
                                        setSelectedPlayerIds([]);
                                    }
                                }}
                                className="rounded-xl h-12 font-black border-2 border-gray-200 text-black hover:bg-gray-50 text-base w-full"
                            >
                                取消
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBatchDelete}
                                className="rounded-xl h-12 font-black shadow-lg shadow-destructive/20 text-base w-full !bg-[#EA5455] !text-white hover:!bg-[#EA5455]/90"
                            >
                                確認刪除
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
