import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser } from '@/api/users.api';
import { User } from '@/types/user';
import { qk } from '@/lib/queryKeys';

/**
 * Was a hand-rolled `useState` + try/catch, which lost retry, error typing and
 * concurrent-call protection and diverged from the pattern used everywhere else.
 */
export default function useUpdateUser(userId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation<User, Error, Partial<User>>({
    mutationFn: (updates) => {
      if (!userId) throw new Error('No user id available to update');
      return updateUser(userId, updates);
    },
    onSuccess: (updated) => {
      // Seed the cache so the change is visible immediately, then reconcile.
      if (updated) queryClient.setQueryData(qk.users.detail(userId), updated);
      queryClient.invalidateQueries({ queryKey: qk.users.detail(userId) });
    },
  });

  const updateProfile = async (updates: Partial<User>) => {
    if (!userId) return;
    return mutation.mutateAsync(updates);
  };

  return {
    ...mutation,
    saving: mutation.isPending,
    error: mutation.error,
    updateProfile,
  };
}
