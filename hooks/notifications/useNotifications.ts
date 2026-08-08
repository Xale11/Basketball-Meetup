import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api';
import { Notification } from '@/types/notification';
import { qk } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';

/** The signed-in user's notifications, newest first. */
export const useNotifications = () => {
  const { user } = useAuth();

  const query = useQuery<Notification[], Error>({
    queryKey: qk.notifications.list(user?.id),
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  });

  return {
    notifications: query.data ?? [],
    loading: !!user?.id && query.isPending,
    error: query.error,
  };
};

/** Unread count for the header bell badge. */
export const useUnreadNotificationCount = () => {
  const { user } = useAuth();

  const query = useQuery<number, Error>({
    queryKey: qk.notifications.unreadCount(user?.id),
    queryFn: () => getUnreadNotificationCount(user!.id),
    enabled: !!user?.id,
  });

  return { count: query.data ?? 0, loading: !!user?.id && query.isPending };
};

export const useMarkNotificationsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Both mutations touch the list and the badge, so they share an invalidation.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.notifications.all });
  };

  const markOne = useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation<void, Error, void>({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: invalidate,
  });

  const remove = useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteNotification(id),
    onSuccess: invalidate,
  });

  return {
    markRead: markOne.mutate,
    markAllRead: markAll.mutate,
    removeNotification: remove.mutate,
    loading: markOne.isPending || markAll.isPending || remove.isPending,
  };
};
