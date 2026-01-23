import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from './test-utils';
import PlayersPage from '../pages/dashboard/PlayersPage';
import * as teamHooks from '../hooks/useTeam';
import { useParams } from 'react-router-dom';

// Mock the hooks
vi.mock('../hooks/useTeam', () => ({
    useTeam: vi.fn(),
    usePlayersWithTodayStatus: vi.fn(),
    useBatchUpdatePlayersStatus: vi.fn(),
    useBatchDeletePlayers: vi.fn(),
    useUpdatePlayer: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
    };
});

describe('PlayersPage', () => {
    const mockTeam = { id: 'team-1', name: 'Test Team', slug: 'test-team' };
    const mockPlayers = [
        { id: 'p1', name: 'Player One', jersey_number: '10', position: 'Pitcher', status: 'active', hasReportedToday: true, riskLevel: 'green' },
        { id: 'p2', name: 'Player Two', jersey_number: '20', position: 'Catcher', status: 'active', hasReportedToday: false, riskLevel: null },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ teamSlug: 'test-team' });
        vi.mocked(teamHooks.useTeam).mockReturnValue({ data: mockTeam, isLoading: false } as any);
        vi.mocked(teamHooks.usePlayersWithTodayStatus).mockReturnValue({ data: mockPlayers, isLoading: false } as any);
        vi.mocked(teamHooks.useBatchUpdatePlayersStatus).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(teamHooks.useBatchDeletePlayers).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(teamHooks.useUpdatePlayer).mockReturnValue({ mutateAsync: vi.fn() } as any);

        vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        })));
    });

    it('renders the players list correctly', async () => {
        render(<PlayersPage />);

        await waitFor(() => {
            expect(screen.getByText('Player One')).toBeInTheDocument();
            expect(screen.getByText('Player Two')).toBeInTheDocument();
        });

        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Pitcher')).toBeInTheDocument();
    });

    it('filters players based on search query', async () => {
        render(<PlayersPage />);

        const searchInput = screen.getByPlaceholderText('搜尋球員姓名、背號、位置...');
        fireEvent.change(searchInput, { target: { value: 'One' } });

        await waitFor(() => {
            expect(screen.getByText('Player One')).toBeInTheDocument();
            expect(screen.queryByText('Player Two')).not.toBeInTheDocument();
        });
    });
});
