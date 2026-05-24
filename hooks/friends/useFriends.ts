import { useQuery } from '@tanstack/react-query';
import { getFriends } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const useFriends = () => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => getFriends(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    friends: result.data ?? [],
    loading: result.isPending,
    error: result.error,
    refetch: result.refetch,
  };
};
