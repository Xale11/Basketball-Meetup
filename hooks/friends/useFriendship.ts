import { useQuery } from '@tanstack/react-query';
import { getFriendship } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

/** Returns the friendship row between the current user and a target user. */
export const useFriendship = (targetId: string | undefined) => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['friendship', user?.id, targetId],
    queryFn: () => getFriendship(user!.id, targetId!),
    enabled: !!user?.id && !!targetId && user.id !== targetId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    friendship: result.data ?? null,
    loading: result.isPending,
    error: result.error,
    refetch: result.refetch,
  };
};
