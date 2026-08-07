import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSocietyMembership } from '@/api/societies.api';
import { SocietyMembership } from '@/types/societies';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { qk } from '@/lib/queryKeys';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.societies.all });
      // Society membership feeds the event feed's society filter, so the
      // event lists are stale too.
      queryClient.invalidateQueries({ queryKey: qk.events.lists });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    joinSociety: mutation.mutate,
    joinSocietyAsync: mutation.mutateAsync,
  };
};
