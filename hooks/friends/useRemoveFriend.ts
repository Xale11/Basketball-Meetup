import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeFriend } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useRemoveFriend = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { targetId: string }>({
    mutationFn: ({ targetId }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return removeFriend(user.id, targetId);
    },
    onSuccess: (_, { targetId }) => {
      queryClient.invalidateQueries({ queryKey: qk.friends.list(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.friends.friendship(user?.id, targetId) });
      queryClient.invalidateQueries({ queryKey: qk.friends.pending(user?.id) });
      queryClient.invalidateQueries({ queryKey: [...qk.friends.all, 'search'] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    removeFriend: mutation.mutate,
    removeFriendAsync: mutation.mutateAsync,
  };
};
