import { useQuery } from '@tanstack/react-query';
import { getReceivedEventInvites } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const useReceivedEventInvites = () => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['receivedEventInvites', user?.id],
    queryFn: () => getReceivedEventInvites(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return {
    invites: result.data ?? [],
    count: result.data?.length ?? 0,
    loading: result.isPending,
    error: result.error,
    refetch: result.refetch,
  };
};
