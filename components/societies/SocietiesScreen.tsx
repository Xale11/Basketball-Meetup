import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Users, Crown, ChevronRight, Calendar, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import useFetchSocietiesByUniId from '@/hooks/societies/useFetchSocietiesByUniId';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { ImagePicker } from '@/components/ImagePicker';
import { SOCIETY_CATEGORIES } from '@/types/societies';
import { useCreateSociety } from '@/hooks/societies/useCreateSociety';

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
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);
  const { societies: discoverSocieties, loading: discoverLoading } = useFetchSocietiesByUniId(
    user?.university_id,
  );

  const societyIds = useMemo(() => memberships.map((m) => m.society_id), [memberships]);
  const { events, loading: eventsLoading } = useFetchEvents(user?.university_id, societyIds);
  const { participationMap } = useUserParticipations(user?.id);

  const { universities, fetchUniversities } = useFetchUniversities();
  useEffect(() => {
    fetchUniversities();
  }, []);
  const universityNameMap = useMemo(
    () => new Map(universities.map((u) => [u.id, u.name])),
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

  // Discover tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const societyNameMap = useMemo(
    () => new Map(memberships.map((m) => [m.society_id, m.societies.name])),
    [memberships],
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Societies</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Society Events ───────────────────────────────────────────── */}
        {selectedTab === 'events' && (
          <View>
            {societiesLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner />
              </View>
            ) : memberships.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#CCC" />
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
                      <Calendar size={40} color="#CCC" />
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
              <Search size={16} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search societies..."
                placeholderTextColor="#AAA"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="#AAA" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterRowContent}
            >
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
                <Users size={48} color="#CCC" />
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
              filteredDiscoverSocieties.map((society) => (
                <TouchableOpacity
                  key={society.id}
                  style={styles.societyCard}
                  onPress={() =>
                    router.push({ pathname: '/society/[id]', params: { id: society.id } })
                  }
                >
                  <View style={styles.societyCardLeft}>
                    <View style={styles.societyLogo}>
                      <Text style={styles.societyInitial}>
                        {society.name?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={styles.societyInfo}>
                      <View style={styles.societyTitleRow}>
                        <Text style={styles.societyName} numberOfLines={1}>
                          {society.name}
                        </Text>
                        {society.category && (
                          <View
                            style={[
                              styles.categoryBadge,
                              {
                                backgroundColor:
                                  CATEGORY_COLORS[society.category] ?? '#F0F0F0',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryText,
                                { color: CATEGORY_TEXT[society.category] ?? '#666' },
                              ]}
                            >
                              {society.category}
                            </Text>
                          </View>
                        )}
                      </View>
                      {society.description ? (
                        <Text style={styles.societyDescription} numberOfLines={2}>
                          {society.description}
                        </Text>
                      ) : null}
                      <View style={styles.membersRow}>
                        <Users size={13} color="#888" />
                        <Text style={styles.membersText}>{society.memberCount} members</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#CCC" />
                </TouchableOpacity>
              ))
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
                <Users size={48} color="#CCC" />
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
                <TouchableOpacity
                  key={m.society_id}
                  style={styles.membershipCard}
                  onPress={() =>
                    router.push({ pathname: '/society/[id]', params: { id: m.society_id } })
                  }
                >
                  <View style={styles.societyLogo}>
                    <Text style={styles.societyInitial}>
                      {m.societies.name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.membershipInfo}>
                    <Text style={styles.societyName}>{m.societies.name}</Text>
                    <Text style={styles.membershipRole}>{m.role_id}</Text>
                  </View>
                  <ChevronRight size={20} color="#CCC" />
                </TouchableOpacity>
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
                <Crown size={48} color="#CCC" />
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
              memberships
                .filter(
                  (m) =>
                    m.role_id === 'OWNER' || m.role_id === 'PRESIDENT' || m.role_id === 'EXEC',
                )
                .map((m) => (
                  <TouchableOpacity
                    key={m.society_id}
                    style={styles.membershipCard}
                    onPress={() =>
                      router.push({ pathname: '/society/[id]', params: { id: m.society_id } })
                    }
                  >
                    <View style={styles.societyLogo}>
                      <Text style={styles.societyInitial}>
                        {m.societies.name?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={styles.membershipInfo}>
                      <Text style={styles.societyName}>{m.societies.name}</Text>
                      <Text style={styles.membershipRole}>{m.role_id}</Text>
                    </View>
                    <ChevronRight size={20} color="#CCC" />
                  </TouchableOpacity>
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
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 32 }}>
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
  headerActions: { flexDirection: 'row', gap: 12 },
  addButton: { padding: 8, borderRadius: 12, backgroundColor: '#FF6B35' },
  tabScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexGrow: 0,
  },
  tabContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  activeTab: { backgroundColor: '#FF6B35' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  filterRow: { marginHorizontal: -20, backgroundColor: '#F8F9FA' },
  filterRowContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#EEEEEE',
  },
  filterChipActive: { backgroundColor: '#FF6B35' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#FFFFFF' },
  eventsSection: { marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  resultCount: { fontSize: 13, color: '#888' },
  loadingContainer: { paddingTop: 60, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  societyCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FF6B35',
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
  societyName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flexShrink: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  societyDescription: { fontSize: 13, color: '#666', marginBottom: 6 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  membersText: { fontSize: 12, color: '#888' },
  membershipCard: {
    backgroundColor: '#FFFFFF',
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
  membershipRole: { fontSize: 13, color: '#888', marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: { paddingHorizontal: 24 },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  cancelText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  formSection: { paddingVertical: 12 },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  catChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catChipTextActive: { color: '#FFFFFF' },
});
