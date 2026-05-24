import { useQuery } from '@tanstack/react-query';
import { getPendingFriendRequests } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const usePendingRequests = () => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['pendingFriendRequests', user?.id],
    queryFn: () => getPendingFriendRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 min — requests should feel relatively fresh
    refetchOnWindowFocus: false,
  });

  return {
    requests: result.data ?? [],
    count: result.data?.length ?? 0,
    loading: result.isPending,
    error: result.error,
    refetch: result.refetch,
  };
};
