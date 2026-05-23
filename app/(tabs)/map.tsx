import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import InteractiveMap from '@/components/InteractiveMap';
import { EventCard } from '@/components/events/EventCard';
import { Event, EventBookingMode, EventHostType } from '@/types/event';

type TimeFilter = 'Now' | 'Today' | 'This Week';
type CostFilter = 'All' | 'Free' | 'Paid';
type ActivityFilter = 'All' | 'Personal' | 'Society' | 'University';

const ACTIVITY_HOST_MAP: Record<ActivityFilter, EventHostType | null> = {
  All: null,
  Personal: EventHostType.USER,
  Society: EventHostType.SOCIETY,
  University: EventHostType.UNIVERSITY,
};

export default function MapScreen() {
  const { user } = useAuth();
  const { memberships } = useFetchUserSocieties(user?.id);
  const societyIds = useMemo(() => memberships.map((m) => m.society_id), [memberships]);
  const { events, loading } = useFetchEvents(user?.university_id, societyIds);
  const { participationMap } = useUserParticipations(user?.id);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Today');
  const [costFilter, setCostFilter] = useState<CostFilter>('All');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('All');
  const [showFullScreen, setShowFullScreen] = useState(false);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const isHappeningNow = (e: Event) =>
    new Date(e.start_date) <= now && new Date(e.end_date) >= now;

  const filteredEvents = useMemo(() => {
    const targetHostType = ACTIVITY_HOST_MAP[activityFilter];
    return events.filter((e) => {
      const start = new Date(e.start_date);
      const matchesTime =
        timeFilter === 'Now'
          ? isHappeningNow(e)
          : timeFilter === 'Today'
          ? (start >= startOfToday && start < endOfToday) || isHappeningNow(e)
          : (start >= startOfToday && start < endOfWeek) || isHappeningNow(e);
      const matchesCost =
        costFilter === 'All' ||
        (costFilter === 'Free' && e.booking_mode === EventBookingMode.FREE) ||
        (costFilter === 'Paid' && e.booking_mode === EventBookingMode.TICKETED);
      const matchesActivity = targetHostType === null || e.host_type === targetHostType;
      return matchesTime && matchesCost && matchesActivity;
    });
  }, [events, timeFilter, costFilter, activityFilter]);

  const mapContainerStyle: ViewStyle = {
    height: showFullScreen ? 700 : 300,
    position: 'relative',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events Map</Text>
        <TouchableOpacity onPress={() => setShowFullScreen((p) => !p)} style={styles.expandButton}>
          {showFullScreen ? <Minimize2 size={20} color="#FFFFFF" /> : <Maximize2 size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={mapContainerStyle}>
          <InteractiveMap events={filteredEvents} participationMap={participationMap} />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {/* Time */}
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

          {/* Cost */}
          {(['All', 'Free', 'Paid'] as CostFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, costFilter === f && styles.filterChipActive]}
              onPress={() => setCostFilter(f)}
            >
              <Text style={[styles.filterChipText, costFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterDivider} />

          {/* Activity type */}
          {(['All', 'Personal', 'Society', 'University'] as ActivityFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                activityFilter === f && styles.filterChipActive,
                f !== 'All' && activityFilter === f && activityChipColor(f),
              ]}
              onPress={() => setActivityFilter(f)}
            >
              <Text style={[styles.filterChipText, activityFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Event list */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {timeFilter === 'Now' ? 'Happening Now' : timeFilter === 'Today' ? 'Today' : 'This Week'}
            </Text>
            <Text style={styles.resultCount}>{filteredEvents.length} events</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}><LoadingSpinner /></View>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                participantStatus={participationMap.get(event.id) ?? null}
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Returns a tinted background style for active activity chips */
function activityChipColor(filter: ActivityFilter): object {
  if (filter === 'Personal') return { backgroundColor: '#FF6B35' };
  if (filter === 'Society') return { backgroundColor: '#7C3AED' };
  if (filter === 'University') return { backgroundColor: '#2563EB' };
  return {};
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
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexGrow: 0 },
  filterRowContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F0F0F0' },
  filterChipActive: { backgroundColor: '#FF6B35' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#FFFFFF' },
  filterDivider: { width: 1, height: 20, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  listSection: { paddingHorizontal: 20, paddingTop: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  resultCount: { fontSize: 13, color: '#888' },
  loadingContainer: { paddingTop: 40, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
});
