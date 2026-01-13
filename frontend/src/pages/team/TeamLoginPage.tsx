/**
 * 球隊登入大廳
 * 列出所有已認領的球員，點擊頭像即可跳轉至登入頁
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useTeam } from '@/hooks/useTeam';

interface PublicPlayer {
    id: string;
    name: string;
    jersey_number: string;
    short_code: string;
    avatar_url?: string;
}

export default function TeamLoginPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const navigate = useNavigate();
    const { data: team, isLoading: isTeamLoading } = useTeam(teamSlug || '');

    const [players, setPlayers] = useState<PublicPlayer[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<PublicPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (teamSlug) {
            fetchPlayers();
        }
    }, [teamSlug]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredPlayers(players);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredPlayers(
                players.filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    (p.jersey_number && p.jersey_number.includes(query))
                )
            );
        }
    }, [searchQuery, players]);

    const fetchPlayers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .rpc('get_team_roster_public', { slug: teamSlug });

            if (error) throw error;
            setPlayers(data || []);
            setFilteredPlayers(data || []);
        } catch (error) {
            console.error('Error fetching roster:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayerClick = (player: PublicPlayer) => {
        // 使用 short_code 進行更友善的 URL 跳轉
        const code = player.short_code || player.id;
        navigate(`/${teamSlug}/p/${code}/login`);
    };

    if (isTeamLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!team) {
        return <div className="text-center mt-20">找不到球隊</div>;
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="font-semibold text-lg">{team.name} - 球員登入</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜尋姓名或背號..."
                            className="pl-10 h-12 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {filteredPlayers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {players.length === 0 ? (
                                        <p>目前沒有球員資料，或是尚未有球員完成認領。</p>
                                    ) : (
                                        <p>找不到符合的球員</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredPlayers.map(player => (
                                        <Card
                                            key={player.id}
                                            className="cursor-pointer hover:border-primary transition-colors hover:shadow-md"
                                            onClick={() => handlePlayerClick(player)}
                                        >
                                            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                                    {player.avatar_url ? (
                                                        <img src={player.avatar_url} alt={player.name} className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        <span>{player.jersey_number || player.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-lg leading-tight truncate w-full px-2">
                                                        {player.name}
                                                    </div>
                                                    {player.jersey_number && (
                                                        <div className="text-sm text-muted-foreground font-mono mt-1">
                                                            #{player.jersey_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
