import { useQuery } from '@tanstack/react-query';
import { getUserEventInvite } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const useUserEventInvite = (eventId: string | undefined) => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['userEventInvite', eventId, user?.id],
    queryFn: () => getUserEventInvite(eventId!, user!.id),
    enabled: !!eventId && !!user?.id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return {
    invite: result.data ?? null,
    loading: result.isPending,
    error: result.error,
  };
};
