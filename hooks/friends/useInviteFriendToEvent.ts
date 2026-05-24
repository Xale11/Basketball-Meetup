import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteFriendToEvent } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

interface InviteInput {
  eventId: string;
  invitedUserId: string;
}

export const useInviteFriendToEvent = () => {
  const { user, isAuth } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, InviteInput>({
    mutationFn: async ({ eventId, invitedUserId }) => {
      const authenticated = await isAuth();
      if (!authenticated || !user?.id) {
        router.replace('/auth/login');
        throw new Error('You must be logged in to invite friends');
      }
      return inviteFriendToEvent(eventId, invitedUserId, user.id);
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['eventInvitees', eventId, user?.id] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    invite: mutation.mutate,
    inviteAsync: mutation.mutateAsync,
  };
};
