import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTeam, usePlayers } from '../hooks/useTeam';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    limit: vi.fn(),
                    order: vi.fn(),
                })),
                order: vi.fn(),
                limit: vi.fn(),
            })),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            upsert: vi.fn(),
        })),
        rpc: vi.fn(),
        schema: vi.fn(function (this: any) { return this; }),
    },
    SCHEMA_NAME: 'public',
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTeam Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('useTeam fetches team data by slug', async () => {
        const mockTeam = { id: 'team-1', name: 'Test Team', slug: 'test-team' };

        // Setup mock for supabase.from('teams').select('*').eq('slug', 'test-team').limit(1)
        const mockEq = vi.fn().mockReturnThis();
        const mockLimit = vi.fn().mockResolvedValue({ data: [mockTeam], error: null });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, limit: mockLimit });

        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

        const { result } = renderHook(() => useTeam('test-team'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockTeam);
        expect(supabase.from).toHaveBeenCalledWith('teams');
    });

    it('usePlayers fetches players by teamId', async () => {
        const mockPlayers = [{ id: 'p1', name: 'Player 1', jersey_number: 1 }];

        const mockOrder = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
        const mockEq2 = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2, order: mockOrder });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

        const { result } = renderHook(() => usePlayers('team-1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockPlayers);
    });
});
