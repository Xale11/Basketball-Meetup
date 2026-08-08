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
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

interface Props {
  events: Event[];
  participationMap?: Map<string, EventParticipantStatus>;
}

/**
 * Marker colour keyed by who hosts the event.
 *
 * Exported so the map screen's host-type filter chips can fill with the same
 * colours the pins use — the legend and the chips must not drift apart.
 */
export const hostTypeColors = (theme: Theme): Record<EventHostType, string> => ({
  [EventHostType.USER]: theme.colors.mapPin.personal,
  [EventHostType.SOCIETY]: theme.colors.mapPin.society,
  [EventHostType.UNIVERSITY]: theme.colors.mapPin.university,
});

const InteractiveMap = ({ events, participationMap = new Map() }: Props) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const pinColors = hostTypeColors(theme);
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
          const color = pinColors[event.host_type] ?? theme.colors.mapPin.personal;
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
            <View style={[styles.legendDot, { backgroundColor: pinColors[type] }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mapOverlay}>
        <TouchableOpacity style={styles.locationButton} onPress={moveToUserLocation}>
          <Navigation size={20} color={theme.colors.textOnAccent} />
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
  const { theme } = useTheme();
  const popup = useThemedStyles(makePopupStyles);
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
          <ArrowUpRight size={16} color={theme.colors.accentText} />
          <Text style={popup.viewButtonText}>View Event</Text>
        </TouchableOpacity>
        <TouchableOpacity style={popup.closeButton} onPress={onClose}>
          <AntDesign name="close" size={20} color={theme.colors.textPrimary} />
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
        <Clock size={15} color={theme.colors.textMuted} />
        <Text style={popup.metaText}>{timeLabel}</Text>
      </View>

      {event.address && (
        <View style={popup.metaRow}>
          <MapPin size={15} color={theme.colors.textMuted} />
          <Text style={popup.metaText}>{event.address}</Text>
        </View>
      )}

      {event.max_participants != null && (
        <View style={popup.metaRow}>
          <Users size={15} color={theme.colors.textMuted} />
          <Text style={popup.metaText}>Up to {event.max_participants} participants</Text>
        </View>
      )}

      {event.description && (
        <Text style={popup.description}>{event.description}</Text>
      )}

      {isPending ? (
        <View style={[popup.joinButton, popup.joinButtonPending]}>
          <Text style={[popup.joinButtonText, popup.joinButtonTextPending]}>Request Pending…</Text>
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

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    callout: {
      width: 180,
      padding: 10,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.chip,
    },
    calloutTitle: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 2 },
    calloutDescription: { ...t.typography.caption, color: t.colors.textMuted },
    modalOverlay: {
      flex: 1,
      backgroundColor: t.colors.overlay,
      justifyContent: 'flex-end',
    },
    cardPopup: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius.hero,
      borderTopRightRadius: t.radius.hero,
      borderTopWidth: 1,
      borderColor: t.colors.chromeBorder,
      padding: t.spacing.lg,
      paddingBottom: t.spacing.xxl,
      maxHeight: '75%',
    },
    mapOverlay: { position: 'absolute', bottom: t.spacing.lg, right: t.spacing.lg },
    locationButton: {
      backgroundColor: t.colors.accent,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      ...t.shadow.md,
    },
    customMarker: { alignItems: 'center', justifyContent: 'center' },
    markerDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 3,
      // A ring in the surface colour so the pin reads as lifted off the basemap.
      borderColor: t.colors.surface,
      ...t.shadow.md,
    },
    legend: {
      position: 'absolute',
      top: t.spacing.md,
      left: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.chip,
      paddingHorizontal: 10,
      paddingVertical: t.spacing.sm,
      gap: 6,
      ...t.shadow.sm,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { ...t.typography.badge, fontSize: 11, color: t.colors.textBody },
  });

const makePopupStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: t.spacing.sm,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    viewButtonText: { ...t.typography.badge, fontSize: 12, color: t.colors.accentTone.text },
    closeButton: {
      padding: 6,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surfaceAlt,
    },
    badgeRow: { flexDirection: 'row', gap: t.spacing.sm, marginBottom: 10 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: t.radius.sm,
      borderWidth: 1,
    },
    badgeFree: {
      backgroundColor: t.colors.successTone.bg,
      borderColor: t.colors.successTone.border,
    },
    badgePaid: {
      backgroundColor: t.colors.warningTone.bg,
      borderColor: t.colors.warningTone.border,
    },
    badgeText: { ...t.typography.badge, fontSize: 12 },
    badgeTextFree: { color: t.colors.successTone.text },
    badgeTextPaid: { color: t.colors.warningTone.text },
    hostBadge: {
      backgroundColor: t.colors.neutralTone.bg,
      borderColor: t.colors.neutralTone.border,
    },
    hostBadgeText: { ...t.typography.badge, fontSize: 12, color: t.colors.neutralTone.text },
    title: { ...t.typography.h2, color: t.colors.textPrimary, marginBottom: t.spacing.md },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    metaText: { ...t.typography.body, color: t.colors.textBody, flex: 1 },
    description: {
      ...t.typography.body,
      color: t.colors.textMuted,
      lineHeight: 22,
      marginTop: t.spacing.md,
      marginBottom: 4,
    },
    joinButton: {
      backgroundColor: t.colors.accent,
      borderRadius: t.radius.card,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: t.spacing.lg,
    },
    joinButtonPaid: { backgroundColor: t.colors.warningTone.solid },
    joinButtonGoing: { backgroundColor: t.colors.successTone.solid },
    joinButtonPending: { backgroundColor: t.colors.surfaceAlt },
    joinButtonText: { ...t.typography.button, fontSize: 15, color: t.colors.textOnAccent },
    // Pending is the one state with a low-contrast fill, so it cannot reuse the
    // on-accent text colour — that would be dark-on-dark under ActivCampus.
    joinButtonTextPending: { color: t.colors.textMuted },
  });
