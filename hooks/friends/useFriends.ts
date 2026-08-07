import { useQuery } from '@tanstack/react-query';
import { getFriends } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useFriends = () => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: qk.friends.list(user?.id),
    queryFn: () => getFriends(user!.id),
    enabled: !!user?.id,
  });

  return {
    friends: result.data ?? [],
    loading: !!user?.id && result.isPending,
    fetching: result.isFetching,
    error: result.error,
    refetch: result.refetch,
  };
};
