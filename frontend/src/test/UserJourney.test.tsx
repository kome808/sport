import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from './test-utils';
import TeamSetupPage from '../pages/team/TeamSetupPage';
import BatchAddPlayersPage from '../pages/dashboard/BatchAddPlayersPage';
import * as teamHooks from '../hooks/useTeam';
import * as authHooks from '../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Mock all necessary hooks
vi.mock('../hooks/useTeam', () => ({
    useTeam: vi.fn(),
    useBatchAddPlayers: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({ data: [{ id: 'team-1', slug: 'new-team' }], error: null }),
                })),
                mockReturnThis: vi.fn().mockReturnThis(),
            })),
            select: vi.fn().mockReturnThis(),
        })),
        schema: vi.fn().mockReturnThis(),
    },
    SCHEMA_NAME: 'public',
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: vi.fn(),
    };
});

describe('User Journey Integration Test (Vitest)', () => {
    const navigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(navigate);
    });

    it('Scenario: Coach creates team and adds 5 players', async () => {
        // --- Step 1: Coach Team Setup ---
        vi.mocked(authHooks.useAuth).mockReturnValue({
            user: { id: 'coach-1', email: 'coach@test.com' },
            role: 'coach',
            isLoading: false,
        } as any);

        // Setup supabase mock for team creation
        const mockInsert = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                    data: [{ id: 'team-1', slug: 'new-team' }],
                    error: null
                }),
            }),
        });
        vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

        render(<TeamSetupPage />);

        const nameInput = screen.getByPlaceholderText(/台北棒球隊/i);
        const slugInput = screen.getByPlaceholderText(/taipei-baseball/i);

        fireEvent.change(nameInput, { target: { value: 'Flying Dragons' } });
        fireEvent.change(slugInput, { target: { value: 'new-team' } });

        const submitBtn = screen.getByText(/建立球隊/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('teams');
            expect(navigate).toHaveBeenCalledWith('/new-team');
        });

        // --- Step 2: Batch Add 5 Players ---
        const batchAddMutate = vi.fn().mockResolvedValue({});
        vi.mocked(useParams).mockReturnValue({ teamSlug: 'new-team' });
        vi.mocked(teamHooks.useTeam).mockReturnValue({
            data: { id: 'team-1', name: 'Flying Dragons', slug: 'new-team' },
            isLoading: false,
        } as any);
        vi.mocked(teamHooks.useBatchAddPlayers).mockReturnValue({
            mutateAsync: batchAddMutate,
            isPending: false,
        } as any);

        render(<BatchAddPlayersPage />);

        const inputs = screen.getAllByPlaceholderText(/例: 王小明/i);

        // Add 5 players
        for (let i = 0; i < 5; i++) {
            fireEvent.change(inputs[i], { target: { value: `Player ${i + 1}` } });
        }

        const saveBtn = screen.getByText(/儲存所有球員/i);
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(batchAddMutate).toHaveBeenCalledWith(expect.objectContaining({
                players: expect.arrayContaining([
                    expect.objectContaining({ name: 'Player 1' }),
                    expect.objectContaining({ name: 'Player 5' }),
                ])
            }));
            expect(navigate).toHaveBeenCalledWith('/new-team/players');
        });
    });
});
