import { useQuery } from '@tanstack/react-query';
import { getReceivedEventInvites } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useReceivedEventInvites = () => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: qk.eventInvites.received(user?.id),
    queryFn: () => getReceivedEventInvites(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  return {
    invites: result.data ?? [],
    count: result.data?.length ?? 0,
    loading: !!user?.id && result.isPending,
    fetching: result.isFetching,
    error: result.error,
    refetch: result.refetch,
  };
};
