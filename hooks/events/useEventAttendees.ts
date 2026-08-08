import { useQuery } from '@tanstack/react-query';
import { fetchEventAttendees } from '@/api/events.api';
import { FriendProfile } from '@/types/friends';
import { qk } from '@/lib/queryKeys';

/** Everyone confirmed GOING to an event, for the detail screen's attendee list. */
export const useEventAttendees = (eventId: string | undefined) => {
  const query = useQuery<FriendProfile[], Error>({
    queryKey: [...qk.events.detail(eventId), 'attendees'],
    queryFn: () => fetchEventAttendees(eventId!),
    enabled: !!eventId,
  });

  return {
    attendees: query.data ?? [],
    loading: !!eventId && query.isPending,
  };
};
