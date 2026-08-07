import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToFriendRequest } from '@/api/friends.api';
import { Friendship, FriendshipStatus } from '@/types/friends';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useRespondFriendRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Friendship,
    Error,
    { friendshipId: string; status: FriendshipStatus.ACCEPTED | FriendshipStatus.DECLINED }
  >({
    mutationFn: ({ friendshipId, status }) =>
      respondToFriendRequest(friendshipId, status),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.friends.pending(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.friends.list(user?.id) });
      queryClient.invalidateQueries({
        queryKey: qk.friends.friendship(user?.id, result.requester_id),
      });
      queryClient.invalidateQueries({ queryKey: [...qk.friends.all, 'search'] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    respond: mutation.mutate,
    respondAsync: mutation.mutateAsync,
  };
};
