import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSocietyMembership } from '@/api/societies.api';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { qk } from '@/lib/queryKeys';

export const useLeaveSociety = () => {
  const { user, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { societyId: string }>({
    mutationFn: async ({ societyId }) => {
      const authenticated = await isAuth();
      if (!authenticated || !user?.id) {
        router.replace('/auth/login');
        throw new Error('You must be logged in');
      }
      return deleteSocietyMembership(user.id, societyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.societies.all });
      queryClient.invalidateQueries({ queryKey: qk.events.lists });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    leaveSociety: mutation.mutate,
    leaveSocietyAsync: mutation.mutateAsync,
  };
};
