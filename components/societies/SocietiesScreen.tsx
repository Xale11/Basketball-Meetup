import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Search, Plus, Users, Crown, ChevronRight, Calendar, X, Filter } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useFetchSocietiesByUniId } from '@/hooks/societies/useFetchSocietiesByUniId';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchUniversities } from '@/hooks/universities/useFetchUniversities';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { useRefreshQueries } from '@/hooks/useRefreshQueries';
import { qk } from '@/lib/queryKeys';
import { AC_AppHeader } from '@/components/activCampus/AC_AppHeader';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { ImagePicker } from '@/components/ImagePicker';
import { SOCIETY_CATEGORIES } from '@/types/societies';
import { useCreateSociety } from '@/hooks/societies/useCreateSociety';
import { useJoinSociety } from '@/hooks/societies/useJoinSociety';
import { useLeaveSociety } from '@/hooks/societies/useLeaveSociety';
import { AC_SocietyCard } from '@/components/societies/AC_SocietyCard';


const CATEGORY_COLORS: Record<string, string> = {
  Arts: '#FFF4E8',
  Tech: '#E8F0FF',
  Sport: '#E8F5E8',
  Academic: '#F4E8FF',
  Social: '#FFF0F5',
  Other: '#F0F0F0',
};

const CATEGORY_TEXT: Record<string, string> = {
  Arts: '#FF9F40',
  Tech: '#4A6CF7',
  Sport: '#28A745',
  Academic: '#9B59B6',
  Social: '#E84393',
  Other: '#666666',
};

export default function SocietiesScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);
  const { societies: discoverSocieties, loading: discoverLoading } = useFetchSocietiesByUniId(
    user?.university_id,
  );

  const societyIds = useMemo(() => memberships.map((m) => m.society_id), [memberships]);
  const { events, loading: eventsLoading } = useFetchEvents(user?.university_id, societyIds);
  const { participationMap } = useUserParticipations(user?.id);

  const { universities } = useFetchUniversities();
  const { refreshing, onRefresh } = useRefreshQueries([qk.societies.all, qk.events.all]);
  // Names are nullable in the DB; drop the nulls rather than render "null".
  const universityNameMap = useMemo(
    () =>
      new Map(universities.flatMap((u) => (u.name ? [[u.id, u.name] as [string, string]] : []))),
    [universities],
  );

  const [selectedTab, setSelectedTab] = useState<'events' | 'discover' | 'my-societies' | 'managed'>('events');
  const [selectedSocietyFilter, setSelectedSocietyFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [societyName, setSocietyName] = useState('');
  const [societyDescription, setSocietyDescription] = useState('');
  const [createCategory, setCreateCategory] = useState<string | null>(null);
  const [createLogoUri, setCreateLogoUri] = useState<string | undefined>(undefined);

  const { createSociety: submitCreate, loading: creating } = useCreateSociety();
  const { joinSociety, loading: joining } = useJoinSociety();
  const { leaveSociety, loading: leaving } = useLeaveSociety();

  // Discover tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const societyNameMap = useMemo(
    () =>
      new Map(
        memberships.flatMap((m) =>
          m.societies.name ? [[m.society_id, m.societies.name] as [string, string]] : [],
        ),
      ),
    [memberships],
  );

  /** Societies the viewer holds a leadership role in — drives the Managed tab count. */
  const managedMemberships = useMemo(
    () =>
      memberships.filter(
        (m) => m.role_id === 'OWNER' || m.role_id === 'PRESIDENT' || m.role_id === 'EXEC',
      ),
    [memberships],
  );

  /** Membership lookup so a Discover row knows whether the viewer has joined. */
  const membershipBySocietyId = useMemo(
    () => new Map(memberships.map((m) => [m.society_id, m])),
    [memberships],
  );

  /**
   * Soonest upcoming activity per society, for the card's "Next activity" box.
   * Derived from the events already loaded — no extra query.
   */
  const nextActivityBySociety = useMemo(() => {
    const now = Date.now();
    const next = new Map<string, (typeof events)[number]>();
    for (const e of events) {
      if (!e.society_id) continue;
      if (new Date(e.start_date).getTime() < now) continue;
      const current = next.get(e.society_id);
      if (!current || new Date(e.start_date) < new Date(current.start_date)) {
        next.set(e.society_id, e);
      }
    }
    return next;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!selectedSocietyFilter) return events;
    return events.filter((e) => e.society_id === selectedSocietyFilter);
  }, [events, selectedSocietyFilter]);

  const filteredDiscoverSocieties = useMemo(() => {
    let list = discoverSocieties;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.name?.toLowerCase().includes(q));
    }
    if (selectedCategories.length > 0) {
      list = list.filter((s) => s.category && selectedCategories.includes(s.category));
    }
    return list;
  }, [discoverSocieties, searchQuery, selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const tabs = [
    { key: 'events' as const, label: 'Society Events' },
    { key: 'discover' as const, label: 'Discover' },
    { key: 'my-societies' as const, label: 'My Societies' },
    { key: 'managed' as const, label: 'Managed' },
  ];

  const resetCreateForm = () => {
    setSocietyName('');
    setSocietyDescription('');
    setCreateCategory(null);
    setCreateLogoUri(undefined);
  };

  const handleCreate = () => {
    if (!societyName.trim()) {
      Alert.alert('Validation', 'Society name is required');
      return;
    }
    if (!user?.university_id) {
      Alert.alert(
        'University Required',
        'You must be enrolled in a university to create a society. Please complete your profile first.',
      );
      return;
    }
    submitCreate(
      {
        name: societyName,
        description: societyDescription,
        category: createCategory,
        logoUri: createLogoUri,
      },
      {
        onSuccess: (newSociety) => {
          setShowCreateModal(false);
          resetCreateForm();
          router.push({ pathname: '/society/[id]', params: { id: newSociety.id } });
        },
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

    // `edges` omits the top: AC_AppHeader applies the top inset itself.
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <AC_AppHeader />
      {/* Hero banner, per the redesign: eyebrow pill, title, blurb, gradient CTA. */}
      <LinearGradient
        colors={theme.gradient.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroEyebrow}>
          <Users size={13} color={theme.colors.accentHi} />
          <Text style={styles.heroEyebrowText}>Campus Student Guilds &amp; Societies</Text>
        </View>

        <Text style={styles.title}>Societies Hub</Text>
        <Text style={styles.heroSubtitle}>
          Join official university societies, organise member-led kickabouts, post society
          updates, or launch a brand new society!
        </Text>

        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.heroCtaWrap}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCta}
          >
            <Plus size={16} color={theme.colors.textOnAccent} strokeWidth={3} />
            <Text style={styles.heroCtaText}>Create Society</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Four tabs retained by decision; horizontal scroll keeps them on one line. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map((tab) => {
          const count =
            tab.key === 'my-societies'
              ? memberships.length
              : tab.key === 'discover'
              ? filteredDiscoverSocieties.length
              : tab.key === 'events'
              ? filteredEvents.length
              : managedMemberships.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              <View style={[styles.tabCount, selectedTab === tab.key && styles.tabCountActive]}>
                <Text
                  style={[
                    styles.tabCountText,
                    selectedTab === tab.key && styles.tabCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
      >

        {/* ── Society Events ───────────────────────────────────────────── */}
        {selectedTab === 'events' && (
          <View>
            {societiesLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner />
              </View>
            ) : memberships.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={theme.colors.textFaint} />
                <Text style={styles.emptyTitle}>No societies, no events</Text>
                <Text style={styles.emptyDescription}>
                  Join a society to start seeing their events here
                </Text>
                <Button
                  label="Find a Society"
                  onPress={() => setSelectedTab('discover')}
                  style={styles.discoverButton}
                />
              </View>
            ) : (
              <>
                {/* Society filter chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterRow}
                  contentContainerStyle={styles.filterRowContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedSocietyFilter === null && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedSocietyFilter(null)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSocietyFilter === null && styles.filterChipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {memberships.map((m) => (
                    <TouchableOpacity
                      key={m.society_id}
                      style={[
                        styles.filterChip,
                        selectedSocietyFilter === m.society_id && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedSocietyFilter(m.society_id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedSocietyFilter === m.society_id && styles.filterChipTextActive,
                        ]}
                      >
                        {m.societies.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.eventsSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Upcoming Events</Text>
                    <Text style={styles.resultCount}>{filteredEvents.length} events</Text>
                  </View>

                  {eventsLoading ? (
                    <View style={styles.loadingContainer}>
                      <LoadingSpinner />
                    </View>
                  ) : filteredEvents.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Calendar size={40} color={theme.colors.textFaint} />
                      <Text style={styles.emptyTitle}>No upcoming events</Text>
                      <Text style={styles.emptyDescription}>
                        {selectedSocietyFilter
                          ? `${societyNameMap.get(selectedSocietyFilter) ?? 'This society'} hasn't posted any events yet`
                          : "None of your societies have posted events yet"}
                      </Text>
                    </View>
                  ) : (
                    filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        societyNameMap={societyNameMap}
                        universityNameMap={universityNameMap}
                        participantStatus={participationMap.get(event.id) ?? null}
                      />
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Discover ─────────────────────────────────────────────────── */}
        {selectedTab === 'discover' && (
          <View>
            {/* Search input */}
            <View style={styles.searchBox}>
              <Search size={16} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search societies..."
                placeholderTextColor={theme.colors.textFaint}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={theme.colors.textFaint} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category filters: pinned label, options scroll on one line. */}
            <View style={styles.categoryRow}>
              <View style={styles.categoryLabelWrap}>
                <Filter size={13} color={theme.colors.accentHi} />
                <Text style={styles.categoryLabel}>Category:</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.categoryScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedCategories.length === 0 && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategories([])}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategories.length === 0 && styles.filterChipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {SOCIETY_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      selectedCategories.includes(cat) && styles.filterChipActive,
                    ]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategories.includes(cat) && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Browse Societies</Text>
              <Text style={styles.resultCount}>{filteredDiscoverSocieties.length} found</Text>
            </View>

            {discoverLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner />
              </View>
            ) : filteredDiscoverSocieties.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color={theme.colors.textFaint} />
                <Text style={styles.emptyTitle}>No societies found</Text>
                <Text style={styles.emptyDescription}>
                  {searchQuery || selectedCategories.length > 0
                    ? 'Try adjusting your search or filters'
                    : 'No societies are registered for your university yet'}
                </Text>
                {(searchQuery || selectedCategories.length > 0) && (
                  <Button
                    label="Clear Filters"
                    variant="secondary"
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                    }}
                    style={styles.discoverButton}
                  />
                )}
              </View>
            ) : (
              filteredDiscoverSocieties.map((society) => {
                const membership = membershipBySocietyId.get(society.id);
                return (
                  <AC_SocietyCard
                    key={society.id}
                    society={society}
                    memberCount={society.memberCount}
                    roleId={membership?.role_id ?? null}
                    isJoined={!!membership}
                    nextActivity={nextActivityBySociety.get(society.id) ?? null}
                    onPress={() =>
                      router.push({ pathname: '/society/[id]', params: { id: society.id } })
                    }
                    onViewActivities={() =>
                      router.push({
                        pathname: '/society/[id]',
                        params: { id: society.id, tab: 'activities' },
                      })
                    }
                    onJoin={() => joinSociety({ societyId: society.id })}
                    onLeave={() => leaveSociety({ societyId: society.id })}
                    actionLoading={joining || leaving}
                  />
                );
              })
            )}
          </View>
        )}

        {/* ── My Societies ─────────────────────────────────────────────── */}
        {selectedTab === 'my-societies' && (
          <View>
            <Text style={styles.sectionTitle}>Your Societies</Text>
            {societiesLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner />
              </View>
            ) : memberships.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color={theme.colors.textFaint} />
                <Text style={styles.emptyTitle}>No societies yet</Text>
                <Text style={styles.emptyDescription}>
                  Discover and join societies to see them here
                </Text>
                <Button
                  label="Browse Societies"
                  onPress={() => setSelectedTab('discover')}
                  style={styles.discoverButton}
                />
              </View>
            ) : (
              memberships.map((m) => (
                <AC_SocietyCard
                  key={m.society_id}
                  society={m.societies}
                  memberCount={
                    discoverSocieties.find((d) => d.id === m.society_id)?.memberCount ?? 0
                  }
                  roleId={m.role_id}
                  isJoined
                  nextActivity={nextActivityBySociety.get(m.society_id) ?? null}
                  onPress={() =>
                    router.push({ pathname: '/society/[id]', params: { id: m.society_id } })
                  }
                  onViewActivities={() =>
                    router.push({
                      pathname: '/society/[id]',
                      params: { id: m.society_id, tab: 'activities' },
                    })
                  }
                  onLeave={() => leaveSociety({ societyId: m.society_id })}
                  actionLoading={leaving}
                />
              ))
            )}
          </View>
        )}

        {/* ── Managed ──────────────────────────────────────────────────── */}
        {selectedTab === 'managed' && (
          <View>
            <Text style={styles.sectionTitle}>Societies You Run</Text>
            {memberships.filter(
              (m) =>
                m.role_id === 'OWNER' || m.role_id === 'PRESIDENT' || m.role_id === 'EXEC',
            ).length === 0 ? (
              <View style={styles.emptyState}>
                <Crown size={48} color={theme.colors.textFaint} />
                <Text style={styles.emptyTitle}>No societies managed</Text>
                <Text style={styles.emptyDescription}>
                  Create a society to bring your community together
                </Text>
                <Button
                  label="Create a Society"
                  onPress={() => setShowCreateModal(true)}
                  style={styles.discoverButton}
                />
              </View>
            ) : (
              managedMemberships.map((m) => (
                <AC_SocietyCard
                  key={m.society_id}
                  society={m.societies}
                  memberCount={
                    discoverSocieties.find((d) => d.id === m.society_id)?.memberCount ?? 0
                  }
                  roleId={m.role_id}
                  isJoined
                  nextActivity={nextActivityBySociety.get(m.society_id) ?? null}
                  onPress={() =>
                    router.push({ pathname: '/society/[id]', params: { id: m.society_id } })
                  }
                  onViewActivities={() =>
                    router.push({
                      pathname: '/society/[id]',
                      params: { id: m.society_id, tab: 'activities' },
                    })
                  }
                  onLeave={() => leaveSociety({ societyId: m.society_id })}
                  actionLoading={leaving}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create Society Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Society</Text>
            <TouchableOpacity onPress={() => { setShowCreateModal(false); resetCreateForm(); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={styles.modalContent} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Logo / Banner */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Banner Image</Text>
              <ImagePicker
                selectedImage={createLogoUri}
                onImageSelected={setCreateLogoUri}
                onImageRemoved={() => setCreateLogoUri(undefined)}
                placeholder="Add Society Banner"
              />
            </View>

            {/* Name */}
            <View style={styles.formSection}>
              <TextInputField
                label="Society Name *"
                value={societyName}
                onChangeText={setSocietyName}
                placeholder="e.g., Photography Society"
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <TextInputField
                label="Description"
                value={societyDescription}
                onChangeText={setSocietyDescription}
                placeholder="What's your society about?"
                multiline
                numberOfLines={4}
                multilineHeight={120}
              />
            </View>

            {/* Category */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryChips}>
                {SOCIETY_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, createCategory === cat && styles.catChipActive]}
                    onPress={() => setCreateCategory(createCategory === cat ? null : cat)}
                  >
                    <Text style={[styles.catChipText, createCategory === cat && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button label="Create Society" loading={creating} onPress={handleCreate} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.canvas },
  // A rounded, bordered banner inset from the screen edges — not full-bleed.
  hero: {
    margin: 20,
    marginBottom: t.spacing.lg,
    padding: t.spacing.xl,
    borderRadius: t.radius.hero,
    borderWidth: 1,
    borderColor: t.colors.chromeBorder,
    gap: t.spacing.sm,
    ...t.shadow.lg,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 4,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.accentTone.bg,
    borderWidth: 1,
    borderColor: t.colors.accentTone.border,
  },
  heroEyebrowText: {
    ...t.typography.caption,
    fontSize: 11,
    color: t.colors.accentTone.text,
  },
  title: { ...t.typography.h1, color: t.colors.textPrimary },
  heroSubtitle: { ...t.typography.caption, color: t.colors.textBody, lineHeight: 19 },
  heroCtaWrap: { alignSelf: 'stretch', marginTop: t.spacing.xs },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: t.spacing.md,
    borderRadius: t.radius.card,
    ...t.shadow.accentGlow,
  },
  heroCtaText: { ...t.typography.button, color: t.colors.textOnAccent },
  tabScroll: {
    backgroundColor: t.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
    flexGrow: 0,
  },
  tabContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surfaceAlt,
  },
  activeTab: { backgroundColor: t.colors.accentTone.bg, borderColor: t.colors.accentTone.border },
  tabText: { ...t.typography.badge, fontSize: 12, color: t.colors.textMuted },
  activeTabText: { color: t.colors.accentTone.text },
  tabCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceInset,
    alignItems: 'center',
  },
  tabCountActive: { backgroundColor: t.colors.accentTone.border },
  tabCountText: { ...t.typography.badge, fontSize: 10, color: t.colors.textFaint },
  tabCountTextActive: { color: t.colors.accentTone.text },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.chip,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.sm,
    marginBottom: t.spacing.md,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  searchInput: {
    flex: 1,
    ...t.typography.caption,
    color: t.colors.textPrimary,
    // Android adds vertical padding that misaligns the row.
    paddingVertical: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: t.spacing.md,
  },
  categoryLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryLabel: {
    ...t.typography.microLabel,
    fontSize: 11,
    color: t.colors.textMuted,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: t.spacing.sm,
  },
  // Society filter on the Events tab. Bleeds to the screen edge so the row can
  // scroll past the content padding; shares the chip styles below.
  filterRow: { marginHorizontal: -20 },
  filterRowContent: { paddingHorizontal: 20, paddingBottom: t.spacing.md, gap: 6 },
  // Inactive is a surface chip with a hairline; active takes the accent tint.
  filterChip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: 6,
    borderRadius: t.radius.chip,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  filterChipActive: {
    backgroundColor: t.colors.accentTone.bg,
    borderColor: t.colors.accentTone.border,
  },
  filterChipText: { ...t.typography.badge, fontSize: 12, color: t.colors.textMuted },
  filterChipTextActive: { color: t.colors.accentTone.text },
  eventsSection: { marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  resultCount: { fontSize: 13, color: t.colors.textMuted },
  loadingContainer: { paddingTop: 60, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: t.colors.textPrimary, marginBottom: 16 },
  societyCard: {
    backgroundColor: t.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  societyCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  societyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  societyInitial: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  societyInfo: { flex: 1 },
  societyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  societyName: { fontSize: 16, fontWeight: '600', color: t.colors.textPrimary, flexShrink: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  societyDescription: { fontSize: 13, color: t.colors.textMuted, marginBottom: 6 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  membersText: { fontSize: 12, color: t.colors.textMuted },
  membershipCard: {
    backgroundColor: t.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  membershipInfo: { flex: 1 },
  membershipRole: { fontSize: 13, color: t.colors.textMuted, marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: t.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: t.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: { paddingHorizontal: 24 },
  modalContainer: { flex: 1, backgroundColor: t.colors.surface },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', color: t.colors.textPrimary },
  cancelText: { fontSize: 16, color: t.colors.accent, fontWeight: '600' },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  formSection: { paddingVertical: 12 },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.textPrimary,
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: t.colors.canvas,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  catChipActive: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  catChipText: { fontSize: 13, fontWeight: '600', color: t.colors.textMuted },
  catChipTextActive: { color: '#FFFFFF' },
  });
