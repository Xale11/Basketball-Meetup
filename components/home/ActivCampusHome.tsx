import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, ChevronRight, Plus, Sparkles } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import useFetchSocietiesByUniId from '@/hooks/societies/useFetchSocietiesByUniId';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import { Event, EventBookingMode } from '@/types/event';
import { EventCard } from '@/components/events/EventCard';
import { useUserParticipatingEvents } from '@/hooks/events/useUserParticipatingEvents';
import { useJoinLeaveEvent } from '@/hooks/events/useJoinLeaveEvent';

type TimeFilter = 'Now' | 'Today' | 'This Week';
type CostFilter = 'All' | 'Free' | 'Paid';

export default function ActivCampusHome() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Today');
  const [costFilter, setCostFilter] = useState<CostFilter>('All');

  const isWidestFilter = timeFilter === 'This Week' && costFilter === 'All';
  const resetFilters = () => {
    setTimeFilter('This Week');
    setCostFilter('All');
  };
  const goToCreate = () => router.push('/(tabs)/create');

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

  const { isJoined } = useUserParticipatingEvents(user?.id);
  const { join, leave } = useJoinLeaveEvent();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const isHappeningNow = (e: Event) =>
    new Date(e.start_date) <= now && new Date(e.end_date) >= now;

  const matchesTimeFilter = (e: Event): boolean => {
    const start = new Date(e.start_date);
    if (timeFilter === 'Now') return isHappeningNow(e);
    if (timeFilter === 'Today') return (start >= startOfToday && start < endOfToday) || isHappeningNow(e);
    return (start >= startOfToday && start < endOfWeek) || isHappeningNow(e);
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
                  <EventCard
                    key={event.id}
                    event={event}
                    societyNameMap={societyNameMap}
                    universityNameMap={universityNameMap}
                    isJoined={isJoined(event.id)}
                    onJoin={() => join(event.id, event.join_policy)}
                    onLeave={() => leave(event.id)}
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
                <EmptyState
                  emoji="🔍"
                  title={isWidestFilter ? 'No activities yet' : 'No activities match your filters'}
                  subtitle={
                    isWidestFilter
                      ? "There's nothing on right now — kick things off by creating one."
                      : 'Try widening your filters to see everything happening this week, or start something of your own.'
                  }
                  primaryAction={
                    isWidestFilter
                      ? { label: 'Create an activity', onPress: goToCreate, leftIcon: Plus }
                      : { label: 'View all this week', onPress: resetFilters, leftIcon: Sparkles }
                  }
                  secondaryAction={
                    isWidestFilter
                      ? undefined
                      : { label: 'Create an activity', onPress: goToCreate, leftIcon: Plus }
                  }
                />
              ) : (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    societyNameMap={societyNameMap}
                    universityNameMap={universityNameMap}
                    isJoined={isJoined(event.id)}
                    onJoin={() => join(event.id, event.join_policy)}
                    onLeave={() => leave(event.id)}
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
});
