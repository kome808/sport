import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AdminTeam {
    team_id: string;
    name: string;
    slug: string;
    coach_email: string;
    player_count: number;
    created_at: string;
    last_active_at: string | null;
    status: 'active' | 'normal' | 'idle';
}

export default function AdminTeamManagementPage() {
    const [teams, setTeams] = useState<AdminTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'normal' | 'idle'>('all');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            console.log('[AdminTeamManagement] Start fetching teams...');
            setLoading(true);
            const { data, error } = await supabase.rpc('get_admin_teams');

            console.log('[AdminTeamManagement] Fetch result:', { data, error });

            if (error) throw error;
            setTeams(data as AdminTeam[]);
        } catch (err: any) {
            console.error('[AdminTeamManagement] Error fetching admin teams:', err);
            // 改用 setError 顯示在 UI 而不是 alert，體驗較好
            // setErrorMessage(err.message); // 需要新增 state
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        try {
            console.log('[AdminTeamManagement] Deleting team:', teamId);
            const { error } = await supabase.rpc('admin_delete_team', { p_team_id: teamId });
            if (error) throw error;

            setTeams(teams.filter(t => t.team_id !== teamId));
            window.alert('球隊已成功刪除');
        } catch (err: any) {
            console.error('Error deleting team:', err);
            window.alert('刪除球隊失敗: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-gray-500 font-medium">球隊資料載入中...</span>
            </div>
        );
    }

    const filteredTeams = teams.filter(team => {
        const matchesSearch =
            (team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (team.coach_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (team.slug || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || team.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: AdminTeam['status']) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500 hover:bg-green-600">活躍</Badge>;
            case 'normal':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">一般</Badge>;
            case 'idle':
                return <Badge variant="destructive">閒置</Badge>;
            default:
                return <Badge variant="outline">未知</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Debug Info: 若正式上線可移除 */}
            <div className="bg-yellow-50 p-2 text-xs font-mono border border-yellow-200 rounded text-yellow-800">
                DEBUG: Teams Count = {teams.length}, Filtered = {filteredTeams.length}
                {teams.length > 0 && (
                    <details>
                        <summary className="cursor-pointer">View First Team Logic</summary>
                        <pre className="mt-2 whitespace-pre-wrap">
                            {JSON.stringify(teams[0], null, 2)}
                        </pre>
                    </details>
                )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">球隊管理</h2>
                    <p className="text-gray-500 mt-1">管理系統內所有註冊球隊與狀態監控</p>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="text"
                            placeholder="搜尋名稱、Email..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">所有狀態</option>
                        <option value="active">活躍</option>
                        <option value="normal">一般</option>
                        <option value="idle">閒置 (殭屍)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>球隊名稱</TableHead>
                            <TableHead>教練 Email</TableHead>
                            <TableHead>球員數</TableHead>
                            <TableHead>建立日期</TableHead>
                            <TableHead>最後活躍</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    沒有符合條件的球隊
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTeams.map((team) => (
                                <TableRow key={team.team_id}>
                                    <TableCell className="font-medium">
                                        <div>{team.name}</div>
                                        <div className="text-xs text-gray-400">@{team.slug}</div>
                                    </TableCell>
                                    <TableCell>{team.coach_email}</TableCell>
                                    <TableCell>{team.player_count}</TableCell>
                                    <TableCell>{format(new Date(team.created_at), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell>
                                        {team.last_active_at
                                            ? format(new Date(team.last_active_at), 'yyyy-MM-dd HH:mm')
                                            : <span className="text-gray-400">無紀錄</span>}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(team.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center text-red-600">
                                                        <AlertTriangle className="mr-2 h-5 w-5" />
                                                        確認強制刪除？
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        此動作**無法復原**。將會永久刪除球隊 <strong>{team.name}</strong> 以及所有關聯的：
                                                        <ul className="list-disc list-inside mt-2 ml-2">
                                                            <li>所有球員資料</li>
                                                            <li>所有訓練與醫療紀錄</li>
                                                            <li>所有相關檔案</li>
                                                        </ul>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-600 hover:bg-red-700"
                                                        onClick={() => handleDeleteTeam(team.team_id)}
                                                    >
                                                        確認刪除
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-gray-500 text-right">
                顯示 {filteredTeams.length} / {teams.length} 支球隊
            </div>
        </div>
    );
}
