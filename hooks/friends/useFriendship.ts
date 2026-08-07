import { useQuery } from '@tanstack/react-query';
import { getFriendship } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

/** Returns the friendship row between the current user and a target user. */
export const useFriendship = (targetId: string | undefined) => {
  const { user } = useAuth();
  const enabled = !!user?.id && !!targetId && user.id !== targetId;

  const result = useQuery({
    queryKey: qk.friends.friendship(user?.id, targetId),
    queryFn: () => getFriendship(user!.id, targetId!),
    enabled,
  });

  return {
    friendship: result.data ?? null,
    loading: enabled && result.isPending,
    fetching: result.isFetching,
    error: result.error,
    refetch: result.refetch,
  };
};
