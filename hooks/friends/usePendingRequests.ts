import { useQuery } from '@tanstack/react-query';
import { getPendingFriendRequests } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const usePendingRequests = () => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: qk.friends.pending(user?.id),
    queryFn: () => getPendingFriendRequests(user!.id),
    enabled: !!user?.id,
    /**
     * Incoming requests are written by *another* user, so nothing on this
     * device can invalidate them — no mutation here ever fires. Cache
     * invalidation can only ever refresh the sender's view.
     *
     * Previously 2 minutes of `staleTime` and no interval, which meant a
     * request could be invisible for minutes, and indefinitely if the
     * recipient was already sitting on the requests screen (no remount, no
     * focus change, nothing to trigger a refetch). Polling is what makes it
     * arrive on its own.
     */
    staleTime: 0,
    refetchInterval: 1000 * 20,
    refetchIntervalInBackground: false,
  });

  return {
    requests: result.data ?? [],
    count: result.data?.length ?? 0,
    loading: !!user?.id && result.isPending,
    fetching: result.isFetching,
    error: result.error,
    refetch: result.refetch,
  };
};
