import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToEventInvite } from '@/api/friends.api';
import { EventInviteStatus } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';

export const useRespondEventInvite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    { inviteId: string; eventId: string; status: EventInviteStatus.ACCEPTED | EventInviteStatus.DECLINED }
  >({
    mutationFn: ({ inviteId, status }) => respondToEventInvite(inviteId, status),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['receivedEventInvites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['userEventInvite', eventId, user?.id] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    respond: mutation.mutate,
    respondAsync: mutation.mutateAsync,
  };
};
