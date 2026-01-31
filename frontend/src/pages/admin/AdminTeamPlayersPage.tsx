import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Player {
    id: string;
    name: string;
    jersey_number: string;
    player_position: string; // Updated from position
    height_cm: number;
    weight_kg: number;
    is_active: boolean;
    created_at: string;
}

interface TeamInfo {
    id: string;
    name: string;
    slug: string;
}

export default function AdminTeamPlayersPage() {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);
    const [team, setTeam] = useState<TeamInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (teamId) fetchTeamData();
    }, [teamId]);

    const fetchTeamData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Team Info via RPC
            const { data: teamData, error: teamError } = await supabase
                .rpc('get_admin_team_details', { p_team_id: teamId })
                .single();

            if (teamError) throw teamError;
            setTeam(teamData as TeamInfo);

            // 2. Fetch Players via RPC
            const { data: playersData, error: playersError } = await supabase
                .rpc('get_admin_team_players', { p_team_id: teamId });

            if (playersError) throw playersError;
            setPlayers(playersData as Player[] || []);

        } catch (error: any) {
            console.error('Error fetching team details:', error);
            // Handle specific errors
            if (error.code === 'PGRST116') {
                // No rows returned for team details
                setTeam(null);
            } else {
                alert(`載入失敗: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4">
                <h2 className="text-xl font-bold text-red-500">找不到該球隊</h2>
                <p className="text-gray-500">該球隊可能已被刪除或 ID 錯誤</p>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>返回儀表板</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>
                    <p className="text-gray-500 text-sm">@{team.slug} - 球員名單</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justifies-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        登錄球員 ({players.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>背號</TableHead>
                                <TableHead>姓名</TableHead>
                                <TableHead>位置</TableHead>
                                <TableHead>身高/體重</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead>加入時間</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {players.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                        尚無球員資料
                                    </TableCell>
                                </TableRow>
                            ) : (
                                players.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="min-w-[2rem] justify-center">
                                                {player.jersey_number || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{player.name}</TableCell>
                                        <TableCell>{player.player_position || '-'}</TableCell>
                                        <TableCell>
                                            {player.height_cm ? `${player.height_cm}cm` : '-'} / {' '}
                                            {player.weight_kg ? `${player.weight_kg}kg` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {player.is_active ?
                                                <Badge className="bg-green-500">現役</Badge> :
                                                <Badge variant="secondary">非活躍</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(player.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
