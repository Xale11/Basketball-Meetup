import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExistingInviteeIds } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

/** Returns the set of user IDs the current user has already invited to a given event. */
export const useEventInvitees = (eventId: string | undefined) => {
  const { user } = useAuth();
  const enabled = !!eventId && !!user?.id;

  const result = useQuery({
    queryKey: qk.eventInvites.invitees(eventId, user?.id),
    queryFn: () => getExistingInviteeIds(eventId!, user!.id),
    enabled,
  });

  // Memoised so consumers get a stable Set identity between renders.
  const inviteeIds = useMemo(() => new Set(result.data ?? []), [result.data]);

  return {
    inviteeIds,
    loading: enabled && result.isPending,
    fetching: result.isFetching,
  };
};
