import { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// 頁面元件
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import TeamSetupPage from './pages/team/TeamSetupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PlayersPage from './pages/dashboard/PlayersPage';
import BatchAddPlayersPage from './pages/dashboard/BatchAddPlayersPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import PlayerLoginPage from './pages/player/PlayerLoginPage';
import PlayerRecordPage from './pages/shared/PlayerRecordPage';
import PlayerReportPage from './pages/player/PlayerReportPage';
import InvitationPage from './pages/team/InvitationPage';
import TeamSettingsPage from './pages/team/TeamSettingsPage';
import TeamLoginPage from './pages/team/TeamLoginPage';
import CoachInvitationPage from './pages/team/CoachInvitationPage';
import TutorialPage from './pages/team/TutorialPage';
import ScienceGuidePage from './pages/public/ScienceGuidePage';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTeamManagementPage from './pages/admin/AdminTeamManagementPage';
import AdminTeamPlayersPage from './pages/admin/AdminTeamPlayersPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';

// 建立 React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分鐘
      retry: 1,
    },
  },
});

// 判斷是否為 Admin 模式
const isAdminMode = import.meta.env.VITE_APP_MODE === 'admin' ||
  window.location.hostname.startsWith('admin.') ||
  window.location.port === '3001';

console.log('[App] Auth Check:', {
  isAdminMode,
  hostname: window.location.hostname,
  port: window.location.port,
  mode: import.meta.env.VITE_APP_MODE
});

// 路由設定
const router = createBrowserRouter(
  isAdminMode
    ? [
      {
        path: '/login',
        element: <AdminLoginPage />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'teams',
            element: <AdminTeamManagementPage />,
          },
          {
            path: 'teams/:teamId',
            element: <AdminTeamPlayersPage />,
          },
          {
            path: '*', // 內層捕捉
            element: <AdminDashboardPage />,
          }
        ],
      },
      {
        path: '*', // 外層捕捉
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          }
        ]
      }
    ]
    : [
      // User 模式路由 (Port 3000)
      // 公開頁面
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/science',
        element: <ScienceGuidePage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        path: '/team/setup',
        element: <TeamSetupPage />,
      },
      {
        path: '/invite/coach/:teamSlug',
        element: <CoachInvitationPage />,
      },
      {
        path: '/invite/:teamSlug',
        element: <InvitationPage />,
      },
      {
        path: '/:teamSlug/login',
        element: <TeamLoginPage />,
      },

      {
        path: '/dashboard',
        element: <DashboardRedirect />,
      },

      // 注意：Admin 路由在此模式下已被移除

      // 教練端 - 儀表板
      {
        path: '/:teamSlug',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'players',
            element: <PlayersPage />,
          },
          {
            path: 'players/add',
            element: <BatchAddPlayersPage />,
          },
          {
            path: 'player/:playerId/:activeTab?',
            element: <PlayerRecordPage mode="coach" />,
          },
          {
            path: 'notifications',
            element: <NotificationsPage />,
          },
          {
            path: 'settings',
            element: <TeamSettingsPage />,
          },
          {
            path: 'tutorial',
            element: <TutorialPage />,
          },
        ],
      },

      // 球員端
      {
        path: '/:teamSlug/p/:playerId/login',
        element: <PlayerLoginPage />,
      },
      {
        path: '/:teamSlug/p/:playerId/report',
        element: <PlayerReportPage />,
      },
      {
        path: '/:teamSlug/p/:playerId/:activeTab?',
        element: <PlayerRecordPage mode="player" />,
      },
    ]
);

/**
 * 自動導向組件
 * 當使用者存取 /dashboard時，自動尋找其所屬球隊並導向
 */
function DashboardRedirect() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading || isRedirecting) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const performRedirect = async () => {
      setIsRedirecting(true);
      try {
        // Safari 補強：有的時候 Token 掛載需要一點點時間
        const { data: teams, error } = await supabase.rpc('get_my_teams');

        if (error) {
          console.error('[DashboardRedirect] RPC Error:', error);
          // 如果是授權錯誤，先等一下再試一次 (Safari Race Condition Fix)
          if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retry = await supabase.rpc('get_my_teams');
            if (!retry.error && retry.data && retry.data.length > 0) {
              navigate(`/${retry.data[0].slug}`, { replace: true });
              return;
            }
          }
          throw error;
        }

        if (teams && teams.length > 0) {
          navigate(`/${teams[0].slug}`, { replace: true });
        } else {
          // 只有確定沒有球隊時才去 setup
          console.log('[DashboardRedirect] No teams found, going to setup');
          navigate('/team/setup', { replace: true });
        }
      } catch (err) {
        console.error('[DashboardRedirect] Final redirect failure:', err);
        // 不再自動帶去填資料，而是回登入頁
        navigate('/login', { replace: true });
      }
    };

    performRedirect();
  }, [user, authLoading, navigate, isRedirecting]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
