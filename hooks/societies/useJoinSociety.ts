import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSocietyMembership } from '@/api/societies.api';
import { SocietyMembership } from '@/types/societies';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export const useJoinSociety = () => {
  const { user, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<SocietyMembership | null, Error, { societyId: string }>({
    mutationFn: async ({ societyId }) => {
      const authenticated = await isAuth();
      if (!authenticated || !user?.id) {
        router.replace('/auth/login');
        throw new Error('You must be logged in to join a society');
      }
      return createSocietyMembership(user.id, societyId);
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
    joinSociety: mutation.mutate,
    joinSocietyAsync: mutation.mutateAsync,
  };
};
