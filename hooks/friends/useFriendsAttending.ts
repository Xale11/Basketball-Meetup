import { useQuery } from '@tanstack/react-query';
import { getFriendsAttendingMap } from '@/api/friends.api';
import { FriendProfile } from '@/types/friends';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

const EMPTY: FriendProfile[] = [];

/**
 * Which of the viewer's friends are attending each of `eventIds`.
 *
 * One bulk query for the whole feed rather than a request per card — the
 * underlying API loads every friend participation in a single round trip.
 */
export const useFriendsAttending = (eventIds: string[]) => {
  const { user } = useAuth();
  // Sorted so a re-ordered feed doesn't produce a different cache key.
  const key = [...eventIds].sort();
  const enabled = !!user?.id && key.length > 0;

  const result = useQuery({
    queryKey: [...qk.friends.all, 'attending', user?.id, key],
    queryFn: () => getFriendsAttendingMap(key, user!.id),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  return {
    /** Stable empty array so an absent entry doesn't remount the avatar stack. */
    friendsFor: (eventId: string) => result.data?.get(eventId) ?? EMPTY,
    countFor: (eventId: string) => result.data?.get(eventId)?.length ?? 0,
    loading: enabled && result.isPending,
  };
};
