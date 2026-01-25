import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LayoutDashboard, Users, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'kome808@gmail.com';

export default function AdminLayout() {
    const { user, isLoading, error } = useAuth();
    const location = useLocation();

    // Debug logging
    useEffect(() => {
        if (!isLoading) {
            console.log('[AdminLayout] Auth settled:', {
                email: user?.email,
                hasError: !!error,
                errorName: error?.name
            });
        }
    }, [user, isLoading, error]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/'; // 重導至首頁
    };

    const handleFixSession = async () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-gray-500 font-medium">正在驗證身分...</span>
            </div>
        );
    }

    // Handle Session Lock / Timeout Errors
    if (error) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4 p-4 text-center">
                <div className="p-4 bg-red-50 rounded-full">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">驗證狀態異常</h2>
                <div className="text-sm text-gray-500 max-w-md bg-gray-50 p-4 rounded text-left font-mono overflow-auto">
                    <p>錯誤: {error.name || 'AuthError'}</p>
                    <p>訊息: {error.message}</p>
                </div>
                <div className="flex gap-4 mt-4">
                    <button onClick={() => window.location.reload()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 font-medium">
                        重新整理
                    </button>
                    <button onClick={handleFixSession} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold">
                        重置 Session 並登入
                    </button>
                </div>
            </div>
        );
    }

    // Access Denied Check
    const isAuthorized = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (!isAuthorized) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-6 bg-gray-50">
                <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <LogOut className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">需要權限</h1>
                    <p className="text-gray-500">
                        {user ? `帳號 (${user.email}) 無權限訪問此頁面` : '您尚未登入'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors">
                        前往登入
                    </Link>
                    {user && (
                        <button onClick={handleLogout} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">
                            登出切換帳號
                        </button>
                    )}
                </div>
                {/* Debug Info Footer */}
                <div className="mt-8 text-xs text-gray-400 font-mono">
                    Expected: {ADMIN_EMAIL}
                </div>
            </div>
        );
    }

    const navItems = [
        { href: '/dashboard', label: '戰情室', icon: LayoutDashboard },
        { href: '/teams', label: '球隊管理', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        System Admin
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">SaaS Management Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                            K
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">Kome Admin</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        登出系統
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
