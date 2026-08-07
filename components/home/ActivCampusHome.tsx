import { View, StyleSheet, SectionList, RefreshControl, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Clock, CalendarDays, Search, X, Building2, Crown, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FilterChipRow, FilterChip } from '@/components/ui/FilterChipRow';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useFetchSocietiesByUniId } from '@/hooks/societies/useFetchSocietiesByUniId';
import { useFetchUniversities } from '@/hooks/universities/useFetchUniversities';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { useFriendsAttendingCounts } from '@/hooks/friends/useFriendsAttendingCounts';
import { EventWithCounts, EventBookingMode } from '@/types/event';
import { EventCard } from '@/components/events/EventCard';
import { useRefreshQueries } from '@/hooks/useRefreshQueries';
import { qk } from '@/lib/queryKeys';
import { AC_AppHeader } from '@/components/activCampus/AC_AppHeader';
import { getClassification, ActivityClassification } from '@/lib/eventClassification';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/**
 * The category strip needs `events.category`, which lands with AC-21. Flip this
 * on once the column and its filter exist.
 */
const SHOW_CATEGORY_STRIP = false;

type TimeTab = 'today' | 'tomorrow' | 'week';
type OrganiserFilter = 'All' | ActivityClassification;
type CostFilter = 'All' | 'Free' | 'Paid';

const TABS = [
  { key: 'today' as const, label: 'Today' },
  { key: 'tomorrow' as const, label: 'Tomorrow' },
  { key: 'week' as const, label: 'This Week' },
];

/**
 * Each option carries its own active tint, matching the reference — a single
 * accent colour for every selected filter is not what the design does.
 * `neutral` is the slate/teal treatment used by "All" and "Associate".
 */
type FilterTone = 'neutral' | 'info' | 'warning' | 'success';

const ORGANISER_OPTIONS: {
  value: OrganiserFilter;
  label: string;
  tone: FilterTone;
  icon?: LucideIcon;
}[] = [
  { value: 'All', label: 'All', tone: 'neutral' },
  { value: 'University', label: 'University', tone: 'info', icon: Building2 },
  // Displayed as "Executive"; the underlying classification is "Exec".
  { value: 'Exec', label: 'Executive', tone: 'warning', icon: Crown },
  { value: 'Associate', label: 'Associate', tone: 'neutral', icon: User },
];

const COST_OPTIONS: { value: CostFilter; label: string; tone: FilterTone }[] = [
  { value: 'All', label: 'All', tone: 'neutral' },
  { value: 'Free', label: 'Free', tone: 'success' },
  { value: 'Paid', label: 'Paid', tone: 'warning' },
];

/** How far ahead counts as "Starting Soon". */
const SOON_MS = 2 * 60 * 60 * 1000;
const ONE_DAY = 86400000;

type SectionTone = 'accent' | 'warning';
type Section = { title: string; tone?: SectionTone; data: EventWithCounts[] };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * A small filter button. Inactive is bare text with no fill or border; active
 * takes its tone's tinted background, text and border. "All"/"Associate" use
 * the neutral surface with accent text, which is the reference's treatment.
 */
function FilterButton({
  label,
  icon: Icon,
  tone,
  active,
  onPress,
}: {
  label: string;
  icon?: LucideIcon;
  tone: FilterTone;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { colors } = theme;

  const toneTokens =
    tone === 'info' ? colors.infoTone : tone === 'warning' ? colors.warningTone : tone === 'success' ? colors.successTone : null;

  const activeStyle = active
    ? toneTokens
      ? { backgroundColor: toneTokens.bg, borderColor: toneTokens.border }
      : { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong }
    : null;

  const textColor = active
    ? toneTokens
      ? toneTokens.text
      : colors.accentText
    : colors.textMuted;

  // The icon keeps its tone's solid colour whether or not the option is active.
  const iconColor = toneTokens ? toneTokens.solid : colors.accentHi;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.filterBtn, activeStyle]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={4}
    >
      {Icon ? <Icon size={12} color={iconColor} /> : null}
      <Text style={[s.filterBtnText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ActivCampusHome() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);

  const [tab, setTab] = useState<TimeTab>('today');
  const [search, setSearch] = useState('');
  const [organiser, setOrganiser] = useState<OrganiserFilter>('All');
  const [cost, setCost] = useState<CostFilter>('All');
  const [maxPrice, setMaxPrice] = useState('');

  const { memberships } = useFetchUserSocieties(user?.id);
  const societyIds = useMemo(() => memberships.map((m) => m.society_id), [memberships]);
  const { events, loading: eventsLoading } = useFetchEvents(user?.university_id, societyIds);
  const { participationMap } = useUserParticipations(user?.id);

  const { societies } = useFetchSocietiesByUniId(user?.university_id ?? null);
  const { universities } = useFetchUniversities();
  const { refreshing, onRefresh } = useRefreshQueries([qk.events.all, qk.societies.all]);

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const { countFor: friendsAttendingFor } = useFriendsAttendingCounts(eventIds);

  // Names are nullable in the DB; drop the nulls rather than render "null".
  const societyNameMap = useMemo(
    () =>
      new Map(
        societies.flatMap((soc) => (soc.name ? [[soc.id, soc.name] as [string, string]] : [])),
      ),
    [societies],
  );
  const universityNameMap = useMemo(
    () =>
      new Map(universities.flatMap((u) => (u.name ? [[u.id, u.name] as [string, string]] : []))),
    [universities],
  );

  const goToCreate = () => router.push('/create');

  /** Search + organiser + cost, applied before the time bucketing. */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const priceCap = maxPrice.trim() ? Number(maxPrice) : null;

    return events.filter((e) => {
      if (q) {
        const societyName = e.society_id ? societyNameMap.get(e.society_id) ?? '' : '';
        const universityName = e.university_id ? universityNameMap.get(e.university_id) ?? '' : '';
        const haystack = [e.name, e.address ?? '', societyName, universityName]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (organiser !== 'All' && getClassification(e) !== organiser) return false;

      const isFree = e.booking_mode === EventBookingMode.FREE;
      if (cost === 'Free' && !isFree) return false;
      if (cost === 'Paid') {
        if (isFree) return false;
        if (priceCap !== null && !Number.isNaN(priceCap) && (e.price_from ?? 0) > priceCap) {
          return false;
        }
      }

      return true;
    });
  }, [events, search, organiser, cost, maxPrice, societyNameMap, universityNameMap]);

  /**
   * Buckets for the active tab.
   *
   * There is no separate "Now" tab in the redesign — Happening Now is a section
   * *inside* Today, alongside Starting Soon (next 2h) and Later Today. This Week
   * groups by day so the SectionList can pin one sticky header per date.
   */
  const sections = useMemo<Section[]>(() => {
    const now = Date.now();
    const today = startOfDay(new Date());

    const isLive = (e: EventWithCounts) =>
      new Date(e.start_date).getTime() <= now && new Date(e.end_date).getTime() >= now;
    const startsOn = (e: EventWithCounts, dayStart: number) =>
      startOfDay(new Date(e.start_date)) === dayStart;
    const byStart = (a: EventWithCounts, b: EventWithCounts) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime();

    if (tab === 'today') {
      // A long-running event that began yesterday still counts as on today.
      const todays = filtered.filter((e) => startsOn(e, today) || isLive(e));

      const happeningNow = todays.filter(isLive).sort(byStart);
      const startingSoon = todays
        .filter((e) => {
          const start = new Date(e.start_date).getTime();
          return !isLive(e) && start > now && start - now <= SOON_MS;
        })
        .sort(byStart);
      const laterToday = todays
        .filter((e) => {
          const start = new Date(e.start_date).getTime();
          return !isLive(e) && start - now > SOON_MS;
        })
        .sort(byStart);

      const all: Section[] = [
        { title: 'Happening Now', tone: 'accent', data: happeningNow },
        { title: 'Starting Soon', tone: 'warning', data: startingSoon },
        { title: 'Later Today', data: laterToday },
      ];
      return all.filter((sec) => sec.data.length > 0);
    }

    if (tab === 'tomorrow') {
      const data = filtered.filter((e) => startsOn(e, today + ONE_DAY)).sort(byStart);
      return data.length ? [{ title: 'Tomorrow', data }] : [];
    }

    const weekEnd = today + 7 * ONE_DAY;
    const upcoming = filtered
      .filter((e) => {
        const start = startOfDay(new Date(e.start_date));
        return start >= today && start < weekEnd;
      })
      .sort(byStart);

    const byDay = new Map<number, EventWithCounts[]>();
    for (const e of upcoming) {
      const key = startOfDay(new Date(e.start_date));
      const list = byDay.get(key);
      if (list) list.push(e);
      else byDay.set(key, [e]);
    }

    return [...byDay.entries()]
      .sort(([a], [b]) => a - b)
      .map(([dayStart, data]) => ({
        title:
          dayStart === today
            ? 'Today'
            : dayStart === today + ONE_DAY
            ? 'Tomorrow'
            : new Date(dayStart).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              }),
        data,
      }));
  }, [filtered, tab]);

  const resetAll = () => {
    setSearch('');
    setOrganiser('All');
    setCost('All');
    setMaxPrice('');
  };

  /** One removable chip per active filter, per AC-10. */
  const activeChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (search.trim()) {
      chips.push({ id: 'search', label: `“${search.trim()}”`, onRemove: () => setSearch('') });
    }
    if (organiser !== 'All') {
      chips.push({ id: 'organiser', label: organiser, onRemove: () => setOrganiser('All') });
    }
    if (cost !== 'All') {
      chips.push({
        id: 'cost',
        label: cost === 'Paid' && maxPrice.trim() ? `Paid · ≤£${maxPrice.trim()}` : cost,
        onRemove: () => {
          setCost('All');
          setMaxPrice('');
        },
      });
    }
    return chips;
  }, [search, organiser, cost, maxPrice]);

  if (authLoading) return <LoadingSpinner />;

  // `edges` omits the top: AC_AppHeader applies the top inset itself.
  return (
    <SafeAreaView style={s.container} edges={['left', 'right']}>
      <AC_AppHeader />

      <View style={s.controls}>
        <SegmentedTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

        <View style={s.searchBar}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search activities, places, societies"
            placeholderTextColor={theme.colors.textFaint}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <X size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Organiser and Cost share one panel, as in the reference. */}
        <View style={s.filterPanel}>
          {/* Label stays pinned; only the options scroll. */}
          <View style={s.filterGroup}>
            <Text style={s.filterGroupLabel}>Organiser:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterGroupScroll}
            >
              {ORGANISER_OPTIONS.map((opt) => (
                <FilterButton
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  tone={opt.tone}
                  active={organiser === opt.value}
                  onPress={() => setOrganiser(opt.value)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={s.filterGroup}>
            <Text style={s.filterGroupLabel}>Cost:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.filterGroupScroll}
            >
              {COST_OPTIONS.map((opt) => (
                <FilterButton
                  key={opt.value}
                  label={opt.label}
                  tone={opt.tone}
                  active={cost === opt.value}
                  onPress={() => setCost(opt.value)}
                />
              ))}
              {cost === 'Paid' && (
                <View style={s.maxPriceWrap}>
                  <Text style={s.maxPriceLabel}>≤ £</Text>
                  <TextInput
                    style={s.maxPriceInput}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="20"
                    placeholderTextColor={theme.colors.textFaint}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {SHOW_CATEGORY_STRIP && <View />}

        {activeChips.length > 0 && (
          <FilterChipRow chips={activeChips} onReset={resetAll} showReset style={s.activeChips} />
        )}
      </View>

      {eventsLoading ? (
        <View style={s.loadingContainer}>
          <LoadingSpinner />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeaderWrap}>
              <SectionHeader
                title={section.title}
                tone={
                  section.tone === 'accent'
                    ? theme.colors.accentTone
                    : section.tone === 'warning'
                    ? theme.colors.warningTone
                    : undefined
                }
                icon={
                  section.tone === 'accent'
                    ? Zap
                    : section.tone === 'warning'
                    ? Clock
                    : CalendarDays
                }
                trailing={String(section.data.length)}
              />
            </View>
          )}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              societyNameMap={societyNameMap}
              universityNameMap={universityNameMap}
              participantStatus={participationMap.get(item.id) ?? null}
              goingCount={item.going_count}
              friendsAttendingCount={friendsAttendingFor(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🔍"
              title={
                activeChips.length > 0
                  ? 'No activities match your filters'
                  : tab === 'today'
                  ? 'Nothing on today'
                  : tab === 'tomorrow'
                  ? 'Nothing on tomorrow'
                  : 'Nothing on this week'
              }
              subtitle={
                activeChips.length > 0
                  ? 'Try widening your filters, or start something of your own.'
                  : "There's nothing here yet — kick something off and bring people together."
              }
              primaryAction={
                activeChips.length > 0
                  ? { label: 'Reset all filters', onPress: resetAll }
                  : { label: 'Create an activity', onPress: goToCreate }
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.canvas,
    },
    controls: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      gap: t.spacing.sm,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      height: 42,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    searchInput: {
      flex: 1,
      ...t.typography.body,
      color: t.colors.textPrimary,
      // Android adds vertical padding that misaligns the row.
      paddingVertical: 0,
    },
    // Both filter groups live in one panel — bg-slate-900/60, rounded-2xl,
    // border-slate-800 in the reference.
    filterPanel: {
      // Groups stack; each one scrolls horizontally rather than wrapping, so a
      // filter row is always exactly one line tall.
      gap: t.spacing.sm,
      padding: 10,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    filterGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filterGroupScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      // Keeps the last option clear of the panel's rounded edge.
      paddingRight: t.spacing.sm,
    },
    filterGroupLabel: {
      ...t.typography.microLabel,
      fontSize: 11,
      color: t.colors.textMuted,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 4,
      borderRadius: t.radius.sm,
      // Inactive is bare text; the border only appears when selected.
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterBtnText: {
      ...t.typography.badge,
      fontSize: 11,
    },
    maxPriceWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    maxPriceLabel: {
      ...t.typography.caption,
      fontSize: 12,
      color: t.colors.textMuted,
    },
    maxPriceInput: {
      minWidth: 40,
      ...t.typography.caption,
      fontSize: 12,
      color: t.colors.textPrimary,
      paddingVertical: 6,
    },
    activeChips: {
      marginTop: t.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: t.spacing.lg,
      // Clears the floating tab bar and its FAB.
      paddingBottom: t.spacing.xxl * 3,
      flexGrow: 1,
    },
    sectionHeaderWrap: {
      // Sticky headers scroll over the cards, so they need an opaque backing.
      backgroundColor: t.colors.canvas,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.sm,
    },
  });
