import { useQuery } from '@tanstack/react-query';
import { getUserEventInvite } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useUserEventInvite = (eventId: string | undefined) => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: qk.eventInvites.forEvent(eventId, user?.id),
    queryFn: () => getUserEventInvite(eventId!, user!.id),
    enabled: !!eventId && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  return {
    invite: result.data ?? null,
    loading: !!eventId && !!user?.id && result.isPending,
    fetching: result.isFetching,
    error: result.error,
  };
};
