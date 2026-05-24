import { useQuery } from '@tanstack/react-query';
import { getExistingInviteeIds } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

/** Returns the set of user IDs the current user has already invited to a given event. */
export const useEventInvitees = (eventId: string | undefined) => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['eventInvitees', eventId, user?.id],
    queryFn: () => getExistingInviteeIds(eventId!, user!.id),
    enabled: !!eventId && !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    inviteeIds: new Set(result.data ?? []),
    loading: result.isPending,
  };
};
