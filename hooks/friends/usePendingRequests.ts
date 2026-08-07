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
    staleTime: 1000 * 60 * 2, // 2 min — requests should feel relatively fresh
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
