import { useQuery } from '@tanstack/react-query';
import { getFriendsAttendingCountMap } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

/**
 * How many of the viewer's friends are attending each of `eventIds`.
 *
 * One bulk query for the whole feed rather than a request per card — the
 * underlying API loads every friend participation in a single round trip.
 */
export const useFriendsAttendingCounts = (eventIds: string[]) => {
  const { user } = useAuth();
  // Sorted so a re-ordered feed doesn't produce a different cache key.
  const key = [...eventIds].sort();
  const enabled = !!user?.id && key.length > 0;

  const result = useQuery({
    queryKey: [...qk.friends.all, 'attendingCounts', user?.id, key],
    queryFn: () => getFriendsAttendingCountMap(key, user!.id),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  return {
    countFor: (eventId: string) => result.data?.get(eventId) ?? 0,
    loading: enabled && result.isPending,
  };
};
