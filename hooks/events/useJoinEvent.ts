import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinEvent } from '@/api/events.api'
import { EventParticipant, EventJoinPolicy, EventParticipantStatus } from '@/types/event'
import { useAuth } from '@/hooks/useAuth'
import { router } from 'expo-router'
import { qk } from '@/lib/queryKeys'

export const useJoinEvent = () => {
  const { user, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    EventParticipant,
    Error,
    { eventId: string; joinPolicy: EventJoinPolicy | null },
    { previousParticipations: EventParticipant[] | undefined }
  >({
    mutationFn: async ({ eventId, joinPolicy }) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in to join an event')
      }
      return joinEvent(eventId, user.id, joinPolicy)
    },
    onMutate: async ({ eventId, joinPolicy }) => {
      if (!user?.id) return { previousParticipations: undefined }
      await queryClient.cancelQueries({ queryKey: qk.events.participations(user.id) })
      const previousParticipations = queryClient.getQueryData<EventParticipant[]>(
        qk.events.participations(user.id),
      )
      const status =
        joinPolicy === EventJoinPolicy.APPROVAL_REQUIRED
          ? EventParticipantStatus.REQUESTED
          : EventParticipantStatus.GOING
      queryClient.setQueryData<EventParticipant[]>(qk.events.participations(user.id), (old) => [
        ...(old ?? []),
        { event_id: eventId, user_id: user.id, status, joined_at: new Date().toISOString() },
      ])
      return { previousParticipations }
    },
    onError: (_, __, context) => {
      if (user?.id && context?.previousParticipations !== undefined) {
        queryClient.setQueryData(qk.events.participations(user.id), context.previousParticipations)
      }
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: qk.events.participations(user?.id) })
      queryClient.invalidateQueries({ queryKey: qk.events.detail(eventId) })
      // Joining changes the participant count on list rows and adds the event
      // to "events I'm attending" — neither was refreshed before.
      queryClient.invalidateQueries({ queryKey: qk.events.participating(user?.id) })
      queryClient.invalidateQueries({ queryKey: qk.events.lists })
      queryClient.invalidateQueries({ queryKey: qk.friends.forEvent(eventId, user?.id) })
    },
  })

  return {
    ...mutation,
    loading: mutation.isPending,
    joinEvent: mutation.mutate,
    joinEventAsync: mutation.mutateAsync,
  }
}
