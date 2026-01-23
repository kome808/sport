import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from './test-utils';
import TeamSettingsPage from '../pages/team/TeamSettingsPage';
import * as teamHooks from '../hooks/useTeam';
import { useParams } from 'react-router-dom';

// Mock the hooks
vi.mock('../hooks/useTeam', () => ({
    useTeam: vi.fn(),
    useUpdateTeam: vi.fn(),
    useUpdateTeamInvitation: vi.fn(),
    useUpdateTeamCoachInvitation: vi.fn(),
    useTeamCoaches: vi.fn(),
    useRemoveCoach: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
    };
});

describe('TeamSettingsPage', () => {
    const mockTeam = {
        id: 'team-1',
        name: 'Doraemon Baseball',
        slug: 'doraemon-baseball',
        invitation_code: '1234',
        is_invitation_enabled: true,
        coach_invitation_code: '5678',
        is_coach_invitation_enabled: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ teamSlug: 'doraemon-baseball' });
        vi.mocked(teamHooks.useTeam).mockReturnValue({
            data: mockTeam,
            isLoading: false,
        } as any);
        vi.mocked(teamHooks.useUpdateTeam).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
        vi.mocked(teamHooks.useUpdateTeamInvitation).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
        vi.mocked(teamHooks.useUpdateTeamCoachInvitation).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
        vi.mocked(teamHooks.useTeamCoaches).mockReturnValue({ data: [], isLoading: false } as any);
        vi.mocked(teamHooks.useRemoveCoach).mockReturnValue({ mutate: vi.fn() } as any);

        // Mock ResizeObserver which is used by some UI components
        vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        })));
    });

    it('renders the team settings form with correct data', async () => {
        render(<TeamSettingsPage />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Doraemon Baseball')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1234')).toBeInTheDocument();
        });

        expect(screen.getByText('邀請機制')).toBeInTheDocument();
        expect(screen.getByText('教練團隊邀請')).toBeInTheDocument();
    });

    it('handles team name update', async () => {
        const updateTeamMutate = vi.fn().mockResolvedValue({});
        vi.mocked(teamHooks.useUpdateTeam).mockReturnValue({
            mutate: updateTeamMutate,
            isPending: false,
        } as any);

        render(<TeamSettingsPage />);

        const nameInput = screen.getByDisplayValue('Doraemon Baseball');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        const saveButton = screen.getByText('儲存邀請設定');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(updateTeamMutate).toHaveBeenCalledWith(expect.objectContaining({
                teamId: 'team-1',
                updates: expect.objectContaining({ name: 'New Name' }),
            }));
        });
    });
});
