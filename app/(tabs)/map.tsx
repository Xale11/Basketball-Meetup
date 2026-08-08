import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appVariant } from '@/constants/appVariant';
import { AC_AppHeader } from '@/components/activCampus/AC_AppHeader';
import { useState, useMemo } from 'react';
import { Maximize2, Minimize2, Zap, Calendar, Clock, LucideIcon } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import InteractiveMap, { hostTypeColors } from '@/components/BM_InteractiveMap';
import { EventCard } from '@/components/events/EventCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Event, EventBookingMode, EventHostType } from '@/types/event';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

type TimeFilter = 'Now' | 'Today' | 'This Week';
type CostFilter = 'All' | 'Free' | 'Paid';
type ActivityFilter = 'All' | 'Personal' | 'Society' | 'University';

const ACTIVITY_HOST_MAP: Record<ActivityFilter, EventHostType | null> = {
  All: null,
  Personal: EventHostType.USER,
  Society: EventHostType.SOCIETY,
  University: EventHostType.UNIVERSITY,
};

/**
 * The list heading for each time filter.
 *
 * The map has a single section rather than the feed's stacked ones, so every
 * filter gets the tinted-pill treatment — the feed reserves it for the sections
 * that need emphasis and leaves the rest as plain labels.
 */
const TIME_FILTER_HEADING: Record<TimeFilter, { title: string; icon: LucideIcon }> = {
  Now: { title: 'Happening Now', icon: Zap },
  Today: { title: 'Today', icon: Calendar },
  'This Week': { title: 'This Week', icon: Clock },
};

export default function MapScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { colors } = theme;

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

  /** Active-chip fill for the host-type filters, matched to the map pin colours. */
  const activityChipColor = (filter: ActivityFilter): ViewStyle => {
    const hostType = ACTIVITY_HOST_MAP[filter];
    if (!hostType) return {};
    return { backgroundColor: hostTypeColors(theme)[hostType] };
  };

  // ActivCampus renders the shared app header, which owns the top inset.
  // Basketball Meetup keeps its own header and the default safe area.
  return (
    <SafeAreaView
      style={styles.container}
      edges={appVariant === 'activCampus' ? ['left', 'right'] : undefined}
    >
      {appVariant === 'activCampus' ? (
        // The app header is the only chrome above the map — no title row, so the
        // map starts immediately beneath it.
        <AC_AppHeader />
      ) : (
        // Basketball Meetup has no app header, so it keeps a title row rather
        // than opening straight onto the map with nothing above it.
        <View style={styles.header}>
          <Text style={styles.title}>Events Map</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={mapContainerStyle}>
          <InteractiveMap events={filteredEvents} participationMap={participationMap} />

          {/* Overlaid top-right; the marker legend owns the top-left corner. */}
          <TouchableOpacity
            onPress={() => setShowFullScreen((p) => !p)}
            style={styles.expandButton}
            accessibilityLabel={showFullScreen ? 'Collapse map' : 'Expand map'}
          >
            {showFullScreen ? (
              <Minimize2 size={20} color={colors.textOnAccent} />
            ) : (
              <Maximize2 size={20} color={colors.textOnAccent} />
            )}
          </TouchableOpacity>
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
              <Text style={[styles.filterChipText, timeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
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
              <Text style={[styles.filterChipText, costFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
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
              <Text
                style={[styles.filterChipText, activityFilter === f && styles.filterChipTextActive]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Event list */}
        <View style={styles.listSection}>
          {/* Same SectionHeader the Discover feed uses, so these headings read
              identically on both screens. */}
          <SectionHeader
            title={TIME_FILTER_HEADING[timeFilter].title}
            tone={colors.accentTone}
            icon={TIME_FILTER_HEADING[timeFilter].icon}
            trailing={`${filteredEvents.length} events`}
            style={styles.listHeader}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner />
            </View>
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

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.chromeBorder,
    },
    title: { ...t.typography.h1, color: t.colors.textPrimary },
    expandButton: {
      position: 'absolute',
      top: t.spacing.md,
      right: t.spacing.md,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      // Android draws MapView late; without an explicit stacking order the
      // control can end up behind it.
      zIndex: 10,
      ...t.shadow.md,
      elevation: 6,
    },
    filterRow: {
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      flexGrow: 0,
    },
    filterRowContent: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      gap: t.spacing.sm,
      alignItems: 'center',
    },
    filterChip: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: 7,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    filterChipActive: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    filterChipText: { ...t.typography.badge, fontSize: 12, color: t.colors.textBody },
    filterChipTextActive: { color: t.colors.textOnAccent },
    filterDivider: {
      width: 1,
      height: 20,
      backgroundColor: t.colors.borderStrong,
      marginHorizontal: t.spacing.xs,
    },
    listSection: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg },
    listHeader: { marginBottom: t.spacing.md },
    loadingContainer: { paddingTop: t.spacing.xl, alignItems: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: t.spacing.xl },
    emptyTitle: { ...t.typography.h3, color: t.colors.textPrimary },
    emptySubtitle: { ...t.typography.body, color: t.colors.textMuted, marginTop: 4 },
    bottomPadding: { height: t.spacing.xxl },
  });
