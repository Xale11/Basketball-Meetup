import { useQuery } from '@tanstack/react-query';
import { getEventFriends } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useEventFriends = (eventId: string | undefined) => {
  const { user } = useAuth();
  const enabled = !!eventId && !!user?.id;

  const result = useQuery({
    queryKey: qk.friends.forEvent(eventId, user?.id),
    queryFn: () => getEventFriends(eventId!, user!.id),
    enabled,
  });

  return {
    friends: result.data ?? [],
    count: result.data?.length ?? 0,
    loading: enabled && result.isPending,
    fetching: result.isFetching,
    error: result.error,
  };
};
