import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinEvent, leaveEvent } from '@/api/events.api'
import { useAuth } from '@/hooks/useAuth'
import { EventJoinPolicy } from '@/types/event'
import { Alert } from 'react-native'

export const useJoinLeaveEvent = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const participationKey = ['participatingEventIds', user?.id]

  const joinMutation = useMutation({
    mutationFn: ({ eventId, joinPolicy }: { eventId: string; joinPolicy: EventJoinPolicy }) => {
      console.log('[useJoinLeaveEvent] calling joinEvent API — userId:', user?.id, '| eventId:', eventId, '| joinPolicy:', joinPolicy)
      return joinEvent(eventId, user!.id, joinPolicy)
    },
    onMutate: async ({ eventId }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: participationKey })
      const previousIds = queryClient.getQueryData<string[]>(participationKey)
      // Immediately add eventId to the local cache
      queryClient.setQueryData<string[]>(participationKey, (old) => [...(old ?? []), eventId])
      return { previousIds }
    },
    onSuccess: (_, { eventId, joinPolicy }) => {
      console.log('[useJoinLeaveEvent] joinEvent success — eventId:', eventId)
      // Optimistic update already has correct state — only refresh the event detail for participant count
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      const message = joinPolicy === EventJoinPolicy.APPROVAL_REQUIRED
        ? 'Your request to join has been sent for approval.'
        : 'You have successfully joined this activity.'
      Alert.alert("You're in!", message)
    },
    onError: (err: Error, _, context) => {
      console.error('[useJoinLeaveEvent] joinEvent error:', err.message)
      // Roll back to previous state
      queryClient.setQueryData(participationKey, context?.previousIds)
      Alert.alert('Error', 'Could not join this activity. Please try again.')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: (eventId: string) => leaveEvent(eventId, user!.id),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: participationKey })
      const previousIds = queryClient.getQueryData<string[]>(participationKey)
      // Immediately remove eventId from the local cache
      queryClient.setQueryData<string[]>(participationKey, (old) => (old ?? []).filter((id) => id !== eventId))
      return { previousIds }
    },
    onSuccess: (_, eventId) => {
      // Optimistic update already has correct state — only refresh the event detail for participant count
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
    onError: (err: Error, _, context) => {
      console.error('[useJoinLeaveEvent] leaveEvent error:', err.message)
      queryClient.setQueryData(participationKey, context?.previousIds)
      Alert.alert('Error', 'Could not leave this activity. Please try again.')
    },
  })

  const handleJoin = (eventId: string, joinPolicy: EventJoinPolicy) => {
    console.log('[useJoinLeaveEvent] join pressed — user:', user?.id, '| eventId:', eventId)
    if (!user) {
      console.warn('[useJoinLeaveEvent] join aborted — no authenticated user')
      return
    }
    joinMutation.mutate({ eventId, joinPolicy })
  }

  const handleLeave = (eventId: string) => {
    if (!user) return
    Alert.alert(
      'Leave Activity',
      'Are you sure you want to leave this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate(eventId) },
      ],
    )
  }

  return {
    join: handleJoin,   // (eventId, joinPolicy) => void
    leave: handleLeave,
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
  }
}
