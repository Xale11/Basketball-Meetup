import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendFriendRequest } from '@/api/friends.api';
import { Friendship } from '@/types/friends';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

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
      queryClient.invalidateQueries({ queryKey: ['friendship', user?.id, addresseeId] });
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    sendRequest: mutation.mutate,
    sendRequestAsync: mutation.mutateAsync,
  };
};
