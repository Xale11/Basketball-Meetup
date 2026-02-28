import { useMutation } from '@tanstack/react-query';
import { createCourt } from '@/api/courts.api';
import { CreateCourtForm, Court } from '@/types/courts';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export const useCreateCourt = () => {
  const { user, loading: authLoading, isAuth } = useAuth();

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

