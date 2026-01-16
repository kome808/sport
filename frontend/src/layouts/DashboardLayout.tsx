/**
 * 教練儀表板 Layout
 * Porto Admin 風格的淺色側邊欄設計
 */

import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Bell,
    Settings,
    LogOut,
    Menu,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotificationBell from '@/components/dashboard/NotificationBell';

// 側邊欄選單項目
const menuItems = [
    {
        title: '戰情室 Dashboard',
        icon: LayoutDashboard,
        path: '',
    },
    {
        title: '球員管理 Players',
        icon: Users,
        path: '/players',
    },
    {
        title: '警訊中心 Notifications',
        icon: Bell,
        path: '/notifications',
        badge: 3, // TODO: 從 API 取得未讀數量
    },
    {
        title: '球隊設定 Settings',
        icon: Settings,
        path: '/settings',
    },
];

export default function DashboardLayout() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 判斷當前路徑是否為選中狀態
    const isActive = (path: string) => {
        const basePath = `/${teamSlug}`;
        const fullPath = path ? `${basePath}${path}` : basePath;
        return location.pathname === fullPath;
    };

    // 側邊欄內容
    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Logo 區域 */}
            <div className="flex h-16 items-center gap-3 border-b px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                    ST
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">運動訓練平台</span>
                    <span className="text-xs text-muted-foreground">Sports Training</span>
                </div>
            </div>

            {/* 球隊資訊 */}
            <div className="border-b p-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">測試球隊</p>
                        <p className="text-xs text-muted-foreground">/{teamSlug}</p>
                    </div>
                </div>
            </div>

            {/* 導航選單 */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={`/${teamSlug}${item.path}`}
                                className={`
                  flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 group
                  ${active
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/40'
                                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                                    }
                `}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <Icon className={`h-5 w-5 ${active ? '' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                <span className="flex-1">{item.title}</span>
                                {item.badge && !active && (
                                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs rounded-full">
                                        {item.badge}
                                    </Badge>
                                )}
                                {active && (
                                    <ChevronRight className="h-4 w-4 opacity-70" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            {/* 底部選單 */}
            <div className="border-t p-3 space-y-1">
                <Link
                    to={`/${teamSlug}/settings`}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span>設定 Settings</span>
                </Link>
                <button
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
                    onClick={() => {
                        // TODO: 登出邏輯
                        console.log('登出');
                    }}
                >
                    <LogOut className="h-5 w-5" />
                    <span>登出 Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground font-sans">
                {/* 桌面版側邊欄 */}
                <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] bg-white shadow-[0_0_15px_0_rgba(34,41,47,0.05)] lg:block">
                    <SidebarContent />
                </aside>

                {/* 手機版側邊欄 */}
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetContent side="left" className="w-[260px] p-0 bg-white">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>

                {/* 主內容區 */}
                <div className="lg:pl-[260px] transition-all duration-300">
                    {/* 頂部導航 - 懸浮卡片風格 */}
                    <header className="sticky top-0 z-30 mx-4 my-2 rounded-lg bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center gap-4 px-4 lg:mx-6 lg:px-6">
                        {/* 手機版選單按鈕 */}
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">開啟選單</span>
                                </Button>
                            </SheetTrigger>
                        </Sheet>

                        {/* 麵包屑 */}
                        <div className="flex-1">
                            <h1 className="text-lg font-semibold">
                                {menuItems.find(item => isActive(item.path))?.title || '儀表板'}
                            </h1>
                        </div>

                        {/* 右側工具列 */}
                        <div className="flex items-center gap-2">
                            <NotificationBell />

                            <Separator orientation="vertical" className="h-6" />

                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                    C
                                </div>
                                <span className="hidden text-sm font-medium md:inline-block">
                                    教練
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* 頁面內容 */}
                    <main className="p-4 lg:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
