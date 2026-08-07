import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCourt } from '@/api/courts.api';
import { CreateCourtForm, Court } from '@/types/courts';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { qk } from '@/lib/queryKeys';

export const useCreateCourt = () => {
  const { user, loading: authLoading, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<Court, Error, CreateCourtForm>({
    mutationFn: async (court: CreateCourtForm) => {
      // Check authentication
      const isAuthenticated = await isAuth()
      if (!isAuthenticated) {
        router.replace('/auth/login');
        throw new Error('You must be logged in to create a court');
      }

      return await createCourt(court);
    },
    onSuccess: () => {
      // Previously this invalidated nothing at all, so a newly created court
      // never appeared until the app was restarted.
      queryClient.invalidateQueries({ queryKey: qk.courts.all });
    },
  });

  return {
    ...mutation,
    // Explicit state properties for easier access
    loading: mutation.isPending || authLoading,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    // Alias mutate for convenience
    createCourt: mutation.mutate,
    createCourtAsync: mutation.mutateAsync,
    // Auth state
    isAuthenticated: !!user,
    user,
  };
};
