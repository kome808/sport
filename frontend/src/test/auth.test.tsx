import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            signInWithOAuth: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                    order: vi.fn(),
                    limit: vi.fn(),
                })),
                single: vi.fn(),
            })),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            upsert: vi.fn(),
        })),
        rpc: vi.fn(),
        schema: vi.fn(function () { return this; }),
    },
    SCHEMA_NAME: 'public',
}));

describe('useAuth Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock for getSession to avoid destructuring errors
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: null },
            error: null,
        } as any);
    });

    it('initializes with loading state and then updates based on session', async () => {
        const mockUser = { id: 'test-user', email: 'test@example.com' };
        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: { user: mockUser } },
            error: null,
        } as any);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles sign in success', async () => {
        const mockUser = { id: 'test-user', email: 'test@example.com' };
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: mockUser },
            error: null,
        } as any);

        const { result } = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let signInResult: any;
        signInResult = await result.current.signIn('test@example.com', 'password123');

        expect(signInResult.success).toBe(true);
        expect(signInResult.user).toEqual(mockUser);
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
    });

    it('handles sign in failure', async () => {
        const mockError = { message: 'Invalid credentials' };
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: null },
            error: mockError,
        } as any);

        const { result } = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const signInResult = await result.current.signIn('test@example.com', 'wrong-pass');

        expect(signInResult.success).toBe(false);
        expect(signInResult.error).toEqual(mockError);
    });

    it('handles sign out', async () => {
        vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any);

        const { result } = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const signOutResult = await result.current.signOut();

        expect(signOutResult.success).toBe(true);
        expect(supabase.auth.signOut).toHaveBeenCalled();
    });
});
