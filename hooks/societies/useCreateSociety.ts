import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSociety } from '@/api/societies.api';
import { Society } from '@/types/societies';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

interface CreateSocietyInput {
  name: string;
  description: string;
  category: string | null;
  logoUri?: string;
}

export const useCreateSociety = () => {
  const { user, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<Society, Error, CreateSocietyInput>({
    mutationFn: async (input) => {
      const authenticated = await isAuth();
      if (!authenticated || !user?.id) {
        router.replace('/auth/login');
        throw new Error('You must be logged in to create a society');
      }
      if (!user.university_id) {
        throw new Error('You must be enrolled in a university to create a society');
      }
      return createSociety(user.id, user.university_id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
      queryClient.invalidateQueries({ queryKey: ['userSocieties', user?.id] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    createSociety: mutation.mutate,
    createSocietyAsync: mutation.mutateAsync,
  };
};
