import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendFriendRequest } from '@/api/friends.api';
import { Friendship } from '@/types/friends';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { qk } from '@/lib/queryKeys';

export const useSendFriendRequest = () => {
  const { user, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<Friendship, Error, { addresseeId: string }>({
    mutationFn: async ({ addresseeId }) => {
      const authenticated = await isAuth();
      if (!authenticated || !user?.id) {
        router.replace('/auth/login');
        throw new Error('You must be logged in to send a friend request');
      }
      return sendFriendRequest(user.id, addresseeId);
    },
    onSuccess: (_, { addresseeId }) => {
      queryClient.invalidateQueries({ queryKey: qk.friends.friendship(user?.id, addresseeId) });
      queryClient.invalidateQueries({ queryKey: qk.friends.list(user?.id) });
      // Search results carry per-row friendship state, so they go stale too.
      queryClient.invalidateQueries({ queryKey: [...qk.friends.all, 'search'] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    sendRequest: mutation.mutate,
    sendRequestAsync: mutation.mutateAsync,
  };
};
