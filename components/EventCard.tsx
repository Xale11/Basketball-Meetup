import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Calendar, Users, DollarSign, MapPin, Wifi } from 'lucide-react-native';
import { Event, EventHostType, EventJoinPolicy, EventParticipantStatus } from '@/types/event';
import { useJoinEvent } from '@/hooks/events/useJoinEvent';
import { useLeaveEvent } from '@/hooks/events/useLeaveEvent';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  participantStatus?: EventParticipantStatus | null;
}

export function EventCard({ event, onPress, participantStatus }: EventCardProps) {
  const { joinEvent, loading: joining } = useJoinEvent();
  const { leaveEvent, loading: leaving } = useLeaveEvent();
  const actionLoading = joining || leaving;

  const isInviteOnly = event.join_policy === EventJoinPolicy.INVITE_ONLY;
  const isJoined = participantStatus === EventParticipantStatus.GOING;
  const isPending = participantStatus === EventParticipantStatus.PENDING;

  const handleJoin = () => {
    joinEvent(
      { eventId: event.id, joinPolicy: event.join_policy },
      {
        onSuccess: (participant) => {
          const msg = participant.status === EventParticipantStatus.PENDING
            ? 'Your request has been sent. You\'ll be notified when approved.'
            : 'You\'re going! See you there.';
          Alert.alert('Joined!', msg);
        },
        onError: (err) => Alert.alert('Could not join', err.message),
      },
    );
  };

  const handleLeave = () => {
    Alert.alert(
      isPending ? 'Cancel Request' : 'Leave Event',
      isPending ? 'Cancel your join request?' : 'Are you sure you want to leave this event?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: isPending ? 'Cancel Request' : 'Leave',
          style: 'destructive',
          onPress: () =>
            leaveEvent(
              { eventId: event.id },
              { onError: (err) => Alert.alert('Error', err.message) },
            ),
        },
      ],
    );
  };

  const renderJoinButton = () => {
    if (isInviteOnly && !participantStatus) return null;
    if (actionLoading) {
      return (
        <View style={[styles.joinButton, styles.joinButtonLoading]}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }
    if (isJoined) {
      return (
        <TouchableOpacity style={[styles.joinButton, styles.joinButtonJoined]} onPress={handleLeave}>
          <Text style={styles.joinButtonText}>Joined ✓</Text>
        </TouchableOpacity>
      );
    }
    if (isPending) {
      return (
        <TouchableOpacity style={[styles.joinButton, styles.joinButtonPending]} onPress={handleLeave}>
          <Text style={[styles.joinButtonText, styles.joinButtonTextDark]}>Requested</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
        <Text style={styles.joinButtonText}>Join Event</Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {event.banner_image_url && (
        <View style={styles.bannerContainer}>
          <Image source={{ uri: event.banner_image_url }} style={styles.bannerImage} />
          <View style={styles.priceTagOverlay}>
            <DollarSign size={16} color="#FFFFFF" />
            <Text style={styles.price}>
              {event.booking_mode === 'FREE' ? 'Free' : `$${event.price_from ?? ''}`}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>{event.name}</Text>
          {!event.banner_image_url && (
            <View style={styles.priceTag}>
              <DollarSign size={16} color="#FFFFFF" />
              <Text style={styles.price}>
                {event.booking_mode === 'FREE' ? 'Free' : `$${event.price_from ?? ''}`}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoRow}>
          <Calendar size={16} color="#666" />
          <Text style={styles.infoText}>
            {new Date(event.start_date).toLocaleDateString('en-GB', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Users size={16} color="#666" />
          <Text style={styles.infoText}>
            {event.max_participants ?? '∞'} max participants
          </Text>
        </View>

        <View style={styles.infoRow}>
          {event.is_online ? (
            <>
              <Wifi size={16} color="#1D6FA4" />
              <Text style={[styles.infoText, styles.onlineText]}>Online event</Text>
            </>
          ) : (
            <>
              <MapPin size={16} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>{event.address ?? 'Location TBC'}</Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: event.is_cancelled ? '#DC3545' : '#FF6B35' },
              ]}
            >
              <Text style={styles.statusText}>{event.is_cancelled ? 'CANCELLED' : 'UPCOMING'}</Text>
            </View>
            {event.host_type === EventHostType.UNIVERSITY && (
              <View style={[styles.hostBadge, { backgroundColor: '#1D6FA4' }]}>
                <Text style={styles.statusText}>UNIVERSITY</Text>
              </View>
            )}
            {event.host_type === EventHostType.SOCIETY && (
              <View style={[styles.hostBadge, { backgroundColor: '#7B5EA7' }]}>
                <Text style={styles.statusText}>SOCIETY</Text>
              </View>
            )}
          </View>
          {renderJoinButton()}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  bannerContainer: {
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  priceTagOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  body: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  onlineText: {
    color: '#1D6FA4',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  joinButtonJoined: { backgroundColor: '#16A34A' },
  joinButtonPending: { backgroundColor: '#E9ECEF' },
  joinButtonLoading: { backgroundColor: '#1A1A1A' },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButtonTextDark: { color: '#444' },
});
