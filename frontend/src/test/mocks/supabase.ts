import { vi } from 'vitest';

export const mockSupabase = {
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
};

vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
    SCHEMA_NAME: 'public',
}));
