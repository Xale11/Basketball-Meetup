import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinEvent, leaveEvent } from '@/api/events.api'
import { useAuth } from '@/hooks/useAuth'
import { Alert } from 'react-native'

export const useJoinLeaveEvent = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const invalidate = (eventId: string) => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    queryClient.invalidateQueries({ queryKey: ['participatingEventIds', user?.id] })
    queryClient.invalidateQueries({ queryKey: ['participantEvents', user?.id] })
  }

  const joinMutation = useMutation({
    mutationFn: (eventId: string) => {
      console.log('[useJoinLeaveEvent] calling joinEvent API — userId:', user?.id, '| eventId:', eventId)
      return joinEvent(eventId, user!.id)
    },
    onSuccess: (_, eventId) => {
      console.log('[useJoinLeaveEvent] joinEvent success — eventId:', eventId)
      invalidate(eventId)
      Alert.alert("You're in!", 'You have successfully joined this activity.')
    },
    onError: (err: Error) => {
      console.error('[useJoinLeaveEvent] joinEvent error:', err.message)
      Alert.alert('Error', 'Could not join this activity. Please try again.')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: (eventId: string) => leaveEvent(eventId, user!.id),
    onSuccess: (_, eventId) => {
      invalidate(eventId)
    },
    onError: () => {
      Alert.alert('Error', 'Could not leave this activity. Please try again.')
    },
  })

  const handleJoin = (eventId: string) => {
    console.log('[useJoinLeaveEvent] join pressed — user:', user?.id, '| eventId:', eventId)
    if (!user) {
      console.warn('[useJoinLeaveEvent] join aborted — no authenticated user')
      return
    }
    joinMutation.mutate(eventId)
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
    join: handleJoin,
    leave: handleLeave,
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
  }
}
