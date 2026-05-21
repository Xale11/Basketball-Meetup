import { useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveEvent } from '@/api/events.api'
import { EventParticipant } from '@/types/event'
import { useAuth } from '@/hooks/useAuth'
import { router } from 'expo-router'

export const useLeaveEvent = () => {
  const { user, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    void,
    Error,
    { eventId: string },
    { previousParticipations: EventParticipant[] | undefined }
  >({
    mutationFn: async ({ eventId }) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in')
      }
      return leaveEvent(eventId, user.id)
    },
    onMutate: async ({ eventId }) => {
      if (!user?.id) return { previousParticipations: undefined }
      await queryClient.cancelQueries({ queryKey: ['userParticipations', user.id] })
      const previousParticipations = queryClient.getQueryData<EventParticipant[]>(['userParticipations', user.id])
      queryClient.setQueryData<EventParticipant[]>(['userParticipations', user.id], (old) =>
        (old ?? []).filter((p) => p.event_id !== eventId),
      )
      return { previousParticipations }
    },
    onError: (_, __, context) => {
      if (user?.id && context?.previousParticipations !== undefined) {
        queryClient.setQueryData(['userParticipations', user.id], context.previousParticipations)
      }
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['userParticipations', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  return {
    ...mutation,
    loading: mutation.isPending,
    leaveEvent: mutation.mutate,
    leaveEventAsync: mutation.mutateAsync,
  }
}
