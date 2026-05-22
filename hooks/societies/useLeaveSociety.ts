import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSocietyMembership } from '@/api/societies.api';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

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
    onSuccess: (_, { societyId }) => {
      queryClient.invalidateQueries({ queryKey: ['userSocieties', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['society', societyId] });
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    leaveSociety: mutation.mutate,
    leaveSocietyAsync: mutation.mutateAsync,
  };
};
