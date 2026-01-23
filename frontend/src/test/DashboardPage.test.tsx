import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from './test-utils';
import DashboardPage from '../pages/dashboard/DashboardPage';
import * as teamHooks from '../hooks/useTeam';
import { useParams } from 'react-router-dom';

// Mock the hooks
vi.mock('../hooks/useTeam', () => ({
    useTeam: vi.fn(),
    useTeamStats: vi.fn(),
    useTeamFatigueOverview: vi.fn(),
    usePlayers: vi.fn(),
    useTeamActivePainReports: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
    };
});

describe('DashboardPage', () => {
    const mockTeam = { id: 'team-1', name: 'Test Team', slug: 'doraemon-baseball' };
    const mockStats = {
        playerCount: 10,
        reportRate: 80,
        reportedCount: 8,
        painCount: 2,
    };
    const mockFatigue = [
        {
            player: { id: 'p1', name: 'High Risk Player', short_code: 'p1' },
            metrics: {
                acwr: { acwr: 1.6, risk_level: 'red' },
                rhr: { current_rhr: 80, status: 'gray' },
                wellness: { total: 15, status: 'gray' },
                srpe: { score: 500, status: 'gray' },
            }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ teamSlug: 'doraemon-baseball' });
        vi.mocked(teamHooks.useTeam).mockReturnValue({ data: mockTeam, isLoading: false } as any);
        vi.mocked(teamHooks.useTeamStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
        vi.mocked(teamHooks.useTeamFatigueOverview).mockReturnValue({ data: mockFatigue, isLoading: false } as any);
        vi.mocked(teamHooks.usePlayers).mockReturnValue({ data: [mockFatigue[0].player], isLoading: false } as any);
        vi.mocked(teamHooks.useTeamActivePainReports).mockReturnValue({ data: [], isLoading: false } as any);

        vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        })));
    });

    it('renders dashboard with stats and risk list', async () => {
        render(<DashboardPage />);

        // Check for specific card titles that should be there
        expect(await screen.findByText('球隊球員數')).toBeInTheDocument();
        expect(await screen.findByText('今日回報率')).toBeInTheDocument();
        expect(await screen.findByText(/填補測試數據/)).toBeInTheDocument();
    });
});
