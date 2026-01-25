import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';
import {
    Users, UserPlus, Zap, Database, AlertCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface StatsData {
    kpi: {
        total_teams: number;
        total_players: number;
        daily_active_users: number;
    };
    growth_chart: {
        month: string;
        teams: number;
        players: number;
    }[];
    activity_chart: {
        date: string;
        records: number;
    }[];
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            console.log('[AdminDashboard] Start fetching stats...');
            setLoading(true);
            setError(null); // Clear previous error

            const { data, error } = await supabase.rpc('get_admin_stats');

            if (error) {
                console.error('[AdminDashboard] RPC Error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            console.log('[AdminDashboard] Fetch success');
            setData(data as StatsData);
        } catch (err: any) {
            console.error('[AdminDashboard] Critical Error fetching admin stats:', err);
            // Handle specifically for 400 or RPC errors to avoid confusion
            if (err.code === '42702' || err.code === '42804' || err.code === 'PGRST202') {
                setError(`資料庫函數定義錯誤 (${err.code}): ${err.message}. 請執行最新的 SQL 遷移腳本。`);
            } else {
                setError(err.message || '無法載入統計數據');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-gray-500 font-medium">數據載入中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-red-500 flex items-center">
                <AlertCircle className="mr-2" />
                {error}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">戰情室儀表板</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        系統運作正常
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>最後更新: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">總球隊數</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.total_teams}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +12% compared to last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">總球員數</CardTitle>
                        <UserPlus className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.total_players}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active registered athletes
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今日活躍</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpi.daily_active_users}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Users recorded data in 24h
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">系統狀態</CardTitle>
                        <Database className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Healthy</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All services operational
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Growth Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>每月成長趨勢</CardTitle>
                        <CardDescription>
                            新註冊球隊與球員數量 (近 6 個月)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        {data.growth_chart && data.growth_chart.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.growth_chart}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f3f4f6' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="teams" name="新增球隊" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="players" name="新增球員" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">暫無數據</div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>每日活躍度分析</CardTitle>
                        <CardDescription>
                            每日上傳訓練紀錄總數 (近 30 天)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        {data.activity_chart && data.activity_chart.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.activity_chart}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={3}
                                    />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="records"
                                        name="訓練紀錄"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">暫無數據</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Errors / Logs (Mock for now) */}
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>最近系統日誌</CardTitle>
                        <CardDescription>
                            顯示最近 5 筆重要的系統警告或錯誤
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock Data */}
                            <div className="flex items-center">
                                <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                                <div className="ml-2 space-y-1">
                                    <p className="text-sm font-medium leading-none">Database Backup</p>
                                    <p className="text-xs text-muted-foreground">Successful at 03:00 AM</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2" />
                                <div className="ml-2 space-y-1">
                                    <p className="text-sm font-medium leading-none">High Latency Alert</p>
                                    <p className="text-xs text-muted-foreground">api.sport.com/v1/records (500ms)</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="col-span-4 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-blue-900">管理員捷徑</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 grid-cols-2">
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center h-32">
                            <Users className="h-8 w-8 text-blue-500 mb-2" />
                            <span className="font-medium text-gray-900">管理球隊</span>
                            <span className="text-xs text-gray-500 mt-1">檢視閒置名單</span>
                        </div>
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center h-32 opacity-50">
                            <Database className="h-8 w-8 text-indigo-500 mb-2" />
                            <span className="font-medium text-gray-900">備份資料</span>
                            <span className="text-xs text-gray-500 mt-1">即將開放</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
