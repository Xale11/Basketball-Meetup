import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, MapPin, Clock, Users, ChevronRight } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import useFetchSocietiesByUniId from '@/hooks/societies/useFetchSocietiesByUniId';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import { Event, EventBookingMode, EventHostType } from '@/types/event';

type TimeFilter = 'Now' | 'Today' | 'This Week';
type CostFilter = 'All' | 'Free' | 'Paid';

export default function ActivCampusHome() {
  const { user, loading: authLoading } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Today');
  const [costFilter, setCostFilter] = useState<CostFilter>('All');

  const { memberships } = useFetchUserSocieties(user?.id);
  const societyIds = memberships.map((m) => m.society_id);
  const { events, loading: eventsLoading } = useFetchEvents(user?.university_id, societyIds);

  const { societies, fetchSocieties } = useFetchSocietiesByUniId(user?.university_id ?? null);
  const { universities, fetchUniversities } = useFetchUniversities();

  useEffect(() => {
    if (user?.university_id) fetchSocieties();
    fetchUniversities();
  }, [user?.university_id]);

  const societyNameMap = useMemo(
    () => new Map(societies.map((s) => [s.id, s.name])),
    [societies],
  );
  const universityNameMap = useMemo(
    () => new Map(universities.map((u) => [u.id, u.name])),
    [universities],
  );

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const isHappeningNow = (e: Event) =>
    new Date(e.start_date) <= now && new Date(e.end_date) >= now;

  const matchesTimeFilter = (e: Event): boolean => {
    const start = new Date(e.start_date);
    if (timeFilter === 'Now') return isHappeningNow(e);
    if (timeFilter === 'Today') return start >= startOfToday && start < endOfToday;
    return start >= startOfToday && start < endOfWeek;
  };

  const matchesCostFilter = (e: Event): boolean => {
    if (costFilter === 'All') return true;
    if (costFilter === 'Free') return e.booking_mode === EventBookingMode.FREE;
    return e.booking_mode === EventBookingMode.TICKETED;
  };

  const nowEvents = events.filter(isHappeningNow);
  const filteredEvents = events.filter((e) => {
    if (!matchesCostFilter(e)) return false;
    if (timeFilter === 'Now') return isHappeningNow(e);
    return matchesTimeFilter(e) && !isHappeningNow(e);
  });

  if (authLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {user?.first_name || 'there'},</Text>
          <Text style={styles.subtitle}>What's on today?</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {(['Now', 'Today', 'This Week'] as TimeFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, timeFilter === f && styles.filterChipActive]}
              onPress={() => setTimeFilter(f)}
            >
              <Text style={[styles.filterChipText, timeFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {(['All', 'Free', 'Paid'] as CostFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, costFilter === f && styles.filterChipActive]}
              onPress={() => setCostFilter(f)}
            >
              <Text style={[styles.filterChipText, costFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {eventsLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : (
          <>
            {/* Happening Now */}
            {timeFilter !== 'Now' && nowEvents.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.nowBadge}>
                    <View style={styles.nowDot} />
                    <Text style={styles.sectionTitle}>Happening Now</Text>
                  </View>
                  <ChevronRight size={20} color="#666" />
                </View>
                {nowEvents.map((event) => (
                  <ActivityCard
                    key={event.id}
                    event={event}
                    societyNameMap={societyNameMap}
                    universityNameMap={universityNameMap}
                  />
                ))}
              </View>
            )}

            {/* Main feed */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {timeFilter === 'Now' ? 'Right Now' : timeFilter === 'Today' ? 'Today' : 'This Week'}
                </Text>
                <Text style={styles.resultCount}>{filteredEvents.length} activities</Text>
              </View>
              {filteredEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Nothing here yet</Text>
                  <Text style={styles.emptySubtitle}>Be the first to create an activity</Text>
                </View>
              ) : (
                filteredEvents.map((event) => (
                  <ActivityCard
                    key={event.id}
                    event={event}
                    societyNameMap={societyNameMap}
                    universityNameMap={universityNameMap}
                  />
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityCard({
  event,
  societyNameMap,
  universityNameMap,
}: {
  event: Event;
  societyNameMap: Map<string, string>;
  universityNameMap: Map<string, string>;
}) {
  const hostTag = getHostTag(event, societyNameMap, universityNameMap);
  const isFree = event.booking_mode === EventBookingMode.FREE;

  const startDate = new Date(event.start_date);
  const now = new Date();
  const isToday =
    startDate.getDate() === now.getDate() &&
    startDate.getMonth() === now.getMonth() &&
    startDate.getFullYear() === now.getFullYear();

  const timeLabel = isToday
    ? `Today · ${startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : `${startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardTop}>
        <View style={cardStyles.titleRow}>
          <Text style={cardStyles.cardTitle} numberOfLines={2}>{event.name}</Text>
          <View style={[cardStyles.hostBadge, hostBadgeColors[hostTag.type].bg]}>
            <Text style={[cardStyles.hostBadgeText, hostBadgeColors[hostTag.type].text]}>{hostTag.label}</Text>
          </View>
        </View>
        <View style={cardStyles.metaCol}>
          <View style={cardStyles.metaItem}>
            <Clock size={13} color="#888" />
            <Text style={cardStyles.metaText}>{timeLabel}</Text>
          </View>
          {event.address && (
            <View style={cardStyles.metaItem}>
              <MapPin size={13} color="#888" />
              <Text style={cardStyles.metaText} numberOfLines={1}>{event.address}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={cardStyles.cardBottom}>
        {event.max_participants != null ? (
          <View style={cardStyles.attendeesRow}>
            <Users size={14} color="#666" />
            <Text style={cardStyles.attendeesText}>
              {`Up to ${event.max_participants}`}
            </Text>
          </View>
        ) : (
          <View style={cardStyles.attendeesRow}>
            <Users size={14} color="#666" />
            <Text style={cardStyles.attendeesText}>Open</Text>
          </View>
        )}
        <TouchableOpacity style={cardStyles.joinButton}>
          <Text style={cardStyles.joinButtonText}>{isFree ? 'Join Free' : `Join · £${event.price_from ?? ''}`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type HostTag = { label: string; type: 'user' | 'society' | 'university' };

function getHostTag(
  event: Event,
  societyNameMap: Map<string, string>,
  universityNameMap: Map<string, string>,
): HostTag {
  if (event.host_type === EventHostType.SOCIETY && event.society_id) {
    const name = societyNameMap.get(event.society_id) ?? event.society_id;
    return { label: `Hosted by ${name}`, type: 'society' };
  }
  if (event.host_type === EventHostType.UNIVERSITY && event.university_id) {
    const name = universityNameMap.get(event.university_id) ?? event.university_id;
    return { label: `Hosted by ${name}`, type: 'university' };
  }
  return { label: 'Student Hosted', type: 'user' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: { fontSize: 16, color: '#666' },
  subtitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  content: { flex: 1 },
  filterRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterRowContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F0F0F0' },
  filterChipActive: { backgroundColor: '#FF6B35' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#FFFFFF' },
  filterDivider: { width: 1, height: 20, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  loadingContainer: { paddingTop: 60 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  resultCount: { fontSize: 13, color: '#888' },
  nowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#28A745' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { marginBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  hostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
  },
  hostBadgeText: { fontSize: 12, fontWeight: '600' },
  metaCol: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#666', flex: 1 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attendeesText: { fontSize: 13, color: '#666' },
  joinButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  joinButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});

const hostBadgeColors: Record<'user' | 'society' | 'university', { bg: { backgroundColor: string }; text: { color: string } }> = {
  user:       { bg: { backgroundColor: '#F0FDF4' }, text: { color: '#16A34A' } },
  society:    { bg: { backgroundColor: '#EEF2FF' }, text: { color: '#4A6CF7' } },
  university: { bg: { backgroundColor: '#FFF7ED' }, text: { color: '#EA6C00' } },
};
