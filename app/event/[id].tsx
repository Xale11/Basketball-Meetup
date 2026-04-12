import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, MapPin, Users, Globe, Calendar, Building2, User } from 'lucide-react-native';
import { useFetchEvent } from '@/hooks/events/useFetchEvent';
import useFetchSocietiesByUniId from '@/hooks/societies/useFetchSocietiesByUniId';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EventBookingMode, EventHostType, EventJoinPolicy, EventVisibility } from '@/types/event';
import { useEffect, useMemo, type ReactNode } from 'react';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event, participantCount, loading } = useFetchEvent(id);

  const { societies, fetchSocieties } = useFetchSocietiesByUniId(event?.university_id ?? null);
  const { universities, fetchUniversities } = useFetchUniversities();

  useEffect(() => {
    if (event?.university_id) fetchSocieties();
    fetchUniversities();
  }, [event?.university_id]);

  const societyName = useMemo(() => {
    if (!event?.society_id) return null;
    return societies.find((s) => s.id === event.society_id)?.name ?? null;
  }, [societies, event?.society_id]);

  const universityName = useMemo(() => {
    if (!event?.university_id) return null;
    return universities.find((u) => u.id === event.university_id)?.name ?? null;
  }, [universities, event?.university_id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><LoadingSpinner /></View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFree = event.booking_mode === EventBookingMode.FREE;
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const fmt = (d: Date) => {
    const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const tz = d.toLocaleTimeString('en-GB', { timeZoneName: 'short' }).split(' ').pop();
    return `${date} · ${time} (${tz})`;
  };

  const startLabel = fmt(startDate);
  const endLabel = fmt(endDate);

  const activityType = getActivityType(event.host_type, event.join_policy, event.visibility);
  const organiser = getOrganiser(event.host_type, societyName, universityName);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed back button over banner */}
      <View style={styles.backOverlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        {event.banner_image_url ? (
          <Image source={{ uri: event.banner_image_url }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Calendar size={40} color="#CCC" />
          </View>
        )}

        <View style={styles.body}>
          {/* Title + badges */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.name}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isFree ? styles.badgeFree : styles.badgePaid]}>
              <Text style={[styles.badgeText, isFree ? styles.badgeTextFree : styles.badgeTextPaid]}>
                {isFree ? 'Free' : `£${event.price_from ?? ''}`}
              </Text>
            </View>
            <View style={[styles.badge, activityType.style]}>
              <Text style={[styles.badgeText, activityType.textStyle]}>{activityType.label}</Text>
            </View>
          </View>

          {/* Key details */}
          <View style={styles.detailsCard}>
            <DetailRow icon={<Calendar size={18} color="#FF6B35" />} label="Start" value={startLabel} />
            <DetailRow icon={<Clock size={18} color="#FF6B35" />} label="End" value={endLabel} />
            {event.is_online ? (
              <DetailRow icon={<Globe size={18} color="#FF6B35" />} label="Location" value="Online event" />
            ) : event.address ? (
              <DetailRow icon={<MapPin size={18} color="#FF6B35" />} label="Location" value={event.address} />
            ) : null}
            <DetailRow
              icon={<Users size={18} color="#FF6B35" />}
              label="Attendance"
              value={
                event.max_participants != null
                  ? `${participantCount} joined · ${event.max_participants - participantCount} spots left`
                  : `${participantCount} joined · Open capacity`
              }
            />
            <DetailRow
              icon={organiser.icon}
              label="Organiser"
              value={organiser.name}
              isLast
            />
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Join CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.joinButton, !isFree && styles.joinButtonPaid]}>
          <Text style={styles.joinButtonText}>
            {isFree ? 'Join Free' : `Join · £${event.price_from ?? ''}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[detail.row, !isLast && detail.rowBorder]}>
      <View style={detail.iconWrap}>{icon}</View>
      <View style={detail.text}>
        <Text style={detail.label}>{label}</Text>
        <Text style={detail.value}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getActivityType(
  hostType: EventHostType,
  joinPolicy: EventJoinPolicy,
  visibility: EventVisibility,
) {
  if (hostType === EventHostType.UNIVERSITY) {
    return {
      label: 'Official',
      style: { backgroundColor: '#FFF7ED' } as const,
      textStyle: { color: '#EA6C00' } as const,
    };
  }
  if (hostType === EventHostType.SOCIETY || joinPolicy === EventJoinPolicy.APPROVAL_REQUIRED || visibility === EventVisibility.SOCIETY_ONLY) {
    return {
      label: 'Member',
      style: { backgroundColor: '#EEF2FF' } as const,
      textStyle: { color: '#4A6CF7' } as const,
    };
  }
  return {
    label: 'Open',
    style: { backgroundColor: '#F0FDF4' } as const,
    textStyle: { color: '#16A34A' } as const,
  };
}

function getOrganiser(
  hostType: EventHostType,
  societyName: string | null,
  universityName: string | null,
): { name: string; icon: ReactNode } {
  if (hostType === EventHostType.SOCIETY && societyName) {
    return { name: societyName, icon: <Users size={18} color="#FF6B35" /> };
  }
  if (hostType === EventHostType.UNIVERSITY && universityName) {
    return { name: universityName, icon: <Building2 size={18} color="#FF6B35" /> };
  }
  return { name: 'Student Hosted', icon: <User size={18} color="#FF6B35" /> };
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#666' },
  backOverlay: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', lineHeight: 32 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  badgeFree: { backgroundColor: '#F0FDF4' },
  badgePaid: { backgroundColor: '#FFF7ED' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextFree: { color: '#16A34A' },
  badgeTextPaid: { color: '#EA6C00' },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  description: { fontSize: 15, color: '#444', lineHeight: 24 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  joinButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonPaid: { backgroundColor: '#1A1A1A' },
  joinButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

const detail = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  iconWrap: { marginTop: 1 },
  text: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: '#1A1A1A', lineHeight: 22 },
});
