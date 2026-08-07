import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToEventInvite } from '@/api/friends.api';
import { EventInviteStatus } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useRespondEventInvite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    { inviteId: string; eventId: string; status: EventInviteStatus.ACCEPTED | EventInviteStatus.DECLINED }
  >({
    mutationFn: ({ inviteId, status }) => respondToEventInvite(inviteId, status),
    onSuccess: (_, { eventId, status }) => {
      queryClient.invalidateQueries({ queryKey: qk.eventInvites.received(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.eventInvites.forEvent(eventId, user?.id) });

      // Accepting an invite also joins the event. Without these the "Accept &
      // Join" button left participation state and participant counts stale.
      if (status === EventInviteStatus.ACCEPTED) {
        queryClient.invalidateQueries({ queryKey: qk.events.participations(user?.id) });
        queryClient.invalidateQueries({ queryKey: qk.events.participating(user?.id) });
        queryClient.invalidateQueries({ queryKey: qk.events.detail(eventId) });
        queryClient.invalidateQueries({ queryKey: qk.events.lists });
      }
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    respond: mutation.mutate,
    respondAsync: mutation.mutateAsync,
  };
};
