import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import type { Notification } from '@/types';

// Fetch notifications for the current user
export function useNotifications(userId: string | undefined) {
    return useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .schema(SCHEMA_NAME)
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50); // Limit to recent 50

            if (error) throw error;
            return data as Notification[];
        },
        enabled: !!userId,
        // Refresh every 30 seconds
        refetchInterval: 30000,
    });
}

// Mark a single notification as read
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: (_, notificationId) => {
            // Optimistically update cache
            queryClient.setQueryData(
                ['notifications', supabase.auth.getUser().then(u => u.data.user?.id)], // Note: This might be tricky if we don't have userId in closure. 
                // Better strategy: Invalidate queries.
                (oldData: Notification[] | undefined) => {
                    if (!oldData) return [];
                    return oldData.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    );
                }
            );
            // Invalidate to be sure
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Mark all as read
export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .schema(SCHEMA_NAME)
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
