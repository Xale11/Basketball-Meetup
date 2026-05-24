import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeFriend } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const useRemoveFriend = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { targetId: string }>({
    mutationFn: ({ targetId }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return removeFriend(user.id, targetId);
    },
    onSuccess: (_, { targetId }) => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendship', user?.id, targetId] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests', user?.id] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    removeFriend: mutation.mutate,
    removeFriendAsync: mutation.mutateAsync,
  };
};
