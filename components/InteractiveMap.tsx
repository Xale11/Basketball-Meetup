import { useEffect, useState } from 'react';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { MapPin, Navigation, Clock, Users, ArrowUpRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Event, EventBookingMode, EventHostType, EventParticipantStatus, EventJoinPolicy } from '@/types/event';
import { useJoinEvent } from '@/hooks/events/useJoinEvent';
import { useLeaveEvent } from '@/hooks/events/useLeaveEvent';

interface Props {
  events: Event[];
  participationMap?: Map<string, EventParticipantStatus>;
}

/** Marker colour keyed by who hosts the event */
const HOST_TYPE_COLORS: Record<EventHostType, string> = {
  [EventHostType.USER]: '#FF6B35',      // orange  — personal
  [EventHostType.SOCIETY]: '#7C3AED',   // purple  — society
  [EventHostType.UNIVERSITY]: '#2563EB', // blue    — university
};

const InteractiveMap = ({ events, participationMap = new Map() }: Props) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);

  const { joinEvent, loading: joining } = useJoinEvent();
  const { leaveEvent, loading: leaving } = useLeaveEvent();

  const mappableEvents = events.filter(
    (e) => e.latitude != null && e.longitude != null,
  );

  const handleMarkerPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const moveToUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        region={region || undefined}
        initialRegion={region || undefined}
      >
        {mappableEvents.map((event) => {
          const color = HOST_TYPE_COLORS[event.host_type] ?? '#FF6B35';
          return (
            <Marker
              key={event.id}
              coordinate={{ latitude: event.latitude!, longitude: event.longitude! }}
              onPress={() => handleMarkerPress(event)}
            >
              <View style={styles.customMarker}>
                <View style={[styles.markerDot, { backgroundColor: color }]} />
              </View>
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle} numberOfLines={2}>{event.name}</Text>
                  {event.address && (
                    <Text style={styles.calloutDescription} numberOfLines={1}>{event.address}</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Marker legend */}
      <View style={styles.legend}>
        {(
          [
            { type: EventHostType.USER, label: 'Personal' },
            { type: EventHostType.SOCIETY, label: 'Society' },
            { type: EventHostType.UNIVERSITY, label: 'University' },
          ] as const
        ).map(({ type, label }) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: HOST_TYPE_COLORS[type] }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mapOverlay}>
        <TouchableOpacity style={styles.locationButton} onPress={moveToUserLocation}>
          <Navigation size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cardPopup}>
            {selectedEvent && (
              <EventPopup
                event={selectedEvent}
                onClose={closeModal}
                participantStatus={participationMap.get(selectedEvent.id) ?? null}
                onJoin={() =>
                  joinEvent(
                    { eventId: selectedEvent.id, joinPolicy: selectedEvent.join_policy },
                    { onSuccess: closeModal },
                  )
                }
                onLeave={() =>
                  leaveEvent(
                    { eventId: selectedEvent.id },
                    { onSuccess: closeModal },
                  )
                }
                joining={joining}
                leaving={leaving}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface EventPopupProps {
  event: Event;
  onClose: () => void;
  participantStatus: EventParticipantStatus | null;
  onJoin: () => void;
  onLeave: () => void;
  joining: boolean;
  leaving: boolean;
}

function EventPopup({ event, onClose, participantStatus, onJoin, onLeave, joining, leaving }: EventPopupProps) {
  const isFree = event.booking_mode === EventBookingMode.FREE;
  const startDate = new Date(event.start_date);
  const now = new Date();
  const isToday = startDate.toDateString() === now.toDateString();
  const timeLabel = isToday
    ? `Today · ${startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : `${startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  const isGoing = participantStatus === EventParticipantStatus.GOING;
  const isPending = participantStatus === EventParticipantStatus.REQUESTED;

  const handleViewEvent = () => {
    onClose();
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={popup.header}>
        <TouchableOpacity style={popup.viewButton} onPress={handleViewEvent}>
          <ArrowUpRight size={16} color="#FF6B35" />
          <Text style={popup.viewButtonText}>View Event</Text>
        </TouchableOpacity>
        <TouchableOpacity style={popup.closeButton} onPress={onClose}>
          <AntDesign name="close" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={popup.badgeRow}>
        <View style={[popup.badge, isFree ? popup.badgeFree : popup.badgePaid]}>
          <Text style={[popup.badgeText, isFree ? popup.badgeTextFree : popup.badgeTextPaid]}>
            {isFree ? 'Free' : `£${event.price_from ?? ''}`}
          </Text>
        </View>
        <View style={[popup.badge, popup.hostBadge]}>
          <Text style={popup.hostBadgeText}>{event.host_type.charAt(0) + event.host_type.slice(1).toLowerCase()}</Text>
        </View>
      </View>

      <Text style={popup.title}>{event.name}</Text>

      <View style={popup.metaRow}>
        <Clock size={15} color="#666" />
        <Text style={popup.metaText}>{timeLabel}</Text>
      </View>

      {event.address && (
        <View style={popup.metaRow}>
          <MapPin size={15} color="#666" />
          <Text style={popup.metaText}>{event.address}</Text>
        </View>
      )}

      {event.max_participants != null && (
        <View style={popup.metaRow}>
          <Users size={15} color="#666" />
          <Text style={popup.metaText}>Up to {event.max_participants} participants</Text>
        </View>
      )}

      {event.description && (
        <Text style={popup.description}>{event.description}</Text>
      )}

      {isPending ? (
        <View style={[popup.joinButton, popup.joinButtonPending]}>
          <Text style={popup.joinButtonText}>Request Pending…</Text>
        </View>
      ) : isGoing ? (
        <TouchableOpacity
          style={[popup.joinButton, popup.joinButtonGoing]}
          onPress={onLeave}
          disabled={leaving}
        >
          <Text style={popup.joinButtonText}>{leaving ? 'Leaving…' : '✓ Going — Leave'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[popup.joinButton, !isFree && popup.joinButtonPaid]}
          onPress={onJoin}
          disabled={joining}
        >
          <Text style={popup.joinButtonText}>
            {joining
              ? 'Joining…'
              : isFree
              ? 'Join Free'
              : `Join · £${event.price_from ?? ''}`}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

export default InteractiveMap;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  callout: {
    width: 180,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  calloutTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  calloutDescription: { fontSize: 12, color: '#666' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  cardPopup: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  mapOverlay: { position: 'absolute', bottom: 20, right: 20 },
  locationButton: {
    backgroundColor: '#FF6B35',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  customMarker: { alignItems: 'center', justifyContent: 'center' },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: '#444', fontWeight: '500' },
});

const popup = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF4EE',
  },
  viewButtonText: { fontSize: 13, fontWeight: '600', color: '#FF6B35' },
  closeButton: { padding: 6, borderRadius: 16, backgroundColor: '#F8F9FA' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeFree: { backgroundColor: '#F0FDF4' },
  badgePaid: { backgroundColor: '#FFF7ED' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextFree: { color: '#16A34A' },
  badgeTextPaid: { color: '#EA6C00' },
  hostBadge: { backgroundColor: '#F3F4F6' },
  hostBadgeText: { fontSize: 13, fontWeight: '500', color: '#555' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metaText: { fontSize: 14, color: '#555', flex: 1 },
  description: { fontSize: 14, color: '#666', lineHeight: 22, marginTop: 12, marginBottom: 4 },
  joinButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonPaid: { backgroundColor: '#1A1A1A' },
  joinButtonGoing: { backgroundColor: '#16A34A' },
  joinButtonPending: { backgroundColor: '#94A3B8' },
  joinButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
