import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEvent } from '@/api/events.api';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { qk } from '@/lib/queryKeys';

export const useDeleteEvent = () => {
  const { isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { eventId: string }>({
    mutationFn: async ({ eventId }) => {
      const authenticated = await isAuth();
      if (!authenticated) {
        router.replace('/auth/login');
        throw new Error('You must be logged in to delete an activity');
      }
      return deleteEvent(eventId);
    },
    onSuccess: (_, { eventId }) => {
      // The detail query is removed rather than invalidated — refetching a
      // deleted row would just resolve to null and briefly render "not found".
      queryClient.removeQueries({ queryKey: qk.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    deleteEvent: mutation.mutate,
  };
};
