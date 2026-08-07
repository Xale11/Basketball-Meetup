import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSociety } from '@/api/societies.api';
import { Society } from '@/types/societies';
import { qk } from '@/lib/queryKeys';

export const useUpdateSociety = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Society,
    Error,
    { id: string; name: string; description: string; category: string | null; logoUri?: string }
  >({
    mutationFn: ({ id, ...updates }) => updateSociety(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.societies.all });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    updateSociety: mutation.mutate,
    updateSocietyAsync: mutation.mutateAsync,
  };
};
