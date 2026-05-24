import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToFriendRequest } from '@/api/friends.api';
import { Friendship, FriendshipStatus } from '@/types/friends';
import { useAuth } from '@/hooks/useAuth';

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
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      queryClient.invalidateQueries({
        queryKey: ['friendship', user?.id, result.requester_id],
      });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    respond: mutation.mutate,
    respondAsync: mutation.mutateAsync,
  };
};
