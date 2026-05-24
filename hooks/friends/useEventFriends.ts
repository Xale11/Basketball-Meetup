import { useQuery } from '@tanstack/react-query';
import { getEventFriends } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const useEventFriends = (eventId: string | undefined) => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['eventFriends', eventId, user?.id],
    queryFn: () => getEventFriends(eventId!, user!.id),
    enabled: !!eventId && !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    friends: result.data ?? [],
    count: result.data?.length ?? 0,
    loading: result.isPending,
    error: result.error,
  };
};
