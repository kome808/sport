import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 頁面元件
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
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
    path: '/team/setup',
    element: <TeamSetupPage />,
  },
  {
    path: '/invite/:teamSlug',
    element: <InvitationPage />,
  },
  {
    path: '/:teamSlug/login',
    element: <TeamLoginPage />,
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
