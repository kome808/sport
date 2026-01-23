import { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
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

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// 建立 React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分鐘
      retry: 1,
    },
  },
});

// 路由設定
const router = createBrowserRouter([
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
]);

/**
 * 自動導向組件
 * 當使用者存取 /dashboard 時，自動尋找其所屬球隊並導向
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
        const { data: teams } = await supabase
          .schema(SCHEMA_NAME)
          .from('teams')
          .select('slug')
          .limit(1);

        if (teams && teams.length > 0) {
          navigate(`/${teams[0].slug}`, { replace: true });
        } else {
          navigate('/team/setup', { replace: true });
        }
      } catch (err) {
        console.error('Redirect failed:', err);
        navigate('/team/setup', { replace: true });
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
