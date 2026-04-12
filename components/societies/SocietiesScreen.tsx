import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Users, Crown, ChevronRight, Clock, MapPin, Calendar } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Event, EventBookingMode, EventHostType } from '@/types/event';

// Placeholder until backend query is wired up
const MOCK_DISCOVER_SOCIETIES = [
  { id: '1', name: 'Film Society', description: 'Weekly screenings and discussions', members: 142, category: 'Arts' },
  { id: '2', name: 'Coding Society', description: 'Hackathons, workshops and projects', members: 98, category: 'Tech' },
  { id: '3', name: 'Hiking Club', description: 'Weekend hikes and outdoor adventures', members: 64, category: 'Sport' },
  { id: '4', name: 'Debating Society', description: 'Competitive and casual debates', members: 55, category: 'Academic' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Arts: '#FFF4E8',
  Tech: '#E8F0FF',
  Sport: '#E8F5E8',
  Academic: '#F4E8FF',
};

const CATEGORY_TEXT: Record<string, string> = {
  Arts: '#FF9F40',
  Tech: '#4A6CF7',
  Sport: '#28A745',
  Academic: '#9B59B6',
};

export default function SocietiesScreen() {
  const { user } = useAuth();
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);

  const societyIds = useMemo(() => memberships.map((m) => m.society_id), [memberships]);
  const { events, loading: eventsLoading } = useFetchEvents(user?.university_id, societyIds);

  const { universities, fetchUniversities } = useFetchUniversities();
  useEffect(() => { fetchUniversities(); }, []);
  const universityNameMap = useMemo(
    () => new Map(universities.map((u) => [u.id, u.name])),
    [universities],
  );

  const [selectedTab, setSelectedTab] = useState<'events' | 'discover' | 'my-societies' | 'managed'>('events');
  const [selectedSocietyFilter, setSelectedSocietyFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [societyName, setSocietyName] = useState('');
  const [societyDescription, setSocietyDescription] = useState('');

  const societyNameMap = useMemo(
    () => new Map(memberships.map((m) => [m.society_id, m.societies.name])),
    [memberships],
  );

  const filteredEvents = useMemo(() => {
    if (!selectedSocietyFilter) return events;
    return events.filter((e) => e.society_id === selectedSocietyFilter);
  }, [events, selectedSocietyFilter]);

  const tabs = [
    { key: 'events' as const, label: 'Society Events' },
    { key: 'discover' as const, label: 'Discover' },
    { key: 'my-societies' as const, label: 'My Societies' },
    { key: 'managed' as const, label: 'Managed' },
  ];

  const handleCreate = () => {
    if (!societyName.trim() || !societyDescription.trim()) return;
    // TODO: wire up to backend
    console.log('Creating society:', { name: societyName, description: societyDescription });
    setShowCreateModal(false);
    setSocietyName('');
    setSocietyDescription('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Societies</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}><Search size={24} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}><Filter size={24} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Society Events */}
        {selectedTab === 'events' && (
          <View>
            {societiesLoading ? (
              <View style={styles.loadingContainer}><LoadingSpinner /></View>
            ) : memberships.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#CCC" />
                <Text style={styles.emptyTitle}>No societies, no events</Text>
                <Text style={styles.emptyDescription}>Join a society to start seeing their events here</Text>
                <TouchableOpacity style={styles.discoverButton} onPress={() => setSelectedTab('discover')}>
                  <Text style={styles.discoverButtonText}>Find a Society</Text>
                </TouchableOpacity>
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
                    style={[styles.filterChip, selectedSocietyFilter === null && styles.filterChipActive]}
                    onPress={() => setSelectedSocietyFilter(null)}
                  >
                    <Text style={[styles.filterChipText, selectedSocietyFilter === null && styles.filterChipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {memberships.map((m) => (
                    <TouchableOpacity
                      key={m.society_id}
                      style={[styles.filterChip, selectedSocietyFilter === m.society_id && styles.filterChipActive]}
                      onPress={() => setSelectedSocietyFilter(m.society_id)}
                    >
                      <Text style={[styles.filterChipText, selectedSocietyFilter === m.society_id && styles.filterChipTextActive]}>
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
                    <View style={styles.loadingContainer}><LoadingSpinner /></View>
                  ) : filteredEvents.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Calendar size={40} color="#CCC" />
                      <Text style={styles.emptyTitle}>No upcoming events</Text>
                      <Text style={styles.emptyDescription}>
                        {selectedSocietyFilter
                          ? `${societyNameMap.get(selectedSocietyFilter) ?? 'This society'} hasn't posted any events yet`
                          : 'None of your societies have posted events yet'}
                      </Text>
                    </View>
                  ) : (
                    filteredEvents.map((event) => (
                      <SocietyEventCard key={event.id} event={event} societyNameMap={societyNameMap} universityNameMap={universityNameMap} />
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* Discover */}
        {selectedTab === 'discover' && (
          <View>
            <Text style={styles.sectionTitle}>Browse Societies</Text>
            {MOCK_DISCOVER_SOCIETIES.map((society) => (
              <TouchableOpacity key={society.id} style={styles.societyCard}>
                <View style={styles.societyCardLeft}>
                  <View style={styles.societyLogo}>
                    <Text style={styles.societyInitial}>{society.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.societyInfo}>
                    <View style={styles.societyTitleRow}>
                      <Text style={styles.societyName}>{society.name}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[society.category] }]}>
                        <Text style={[styles.categoryText, { color: CATEGORY_TEXT[society.category] }]}>{society.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.societyDescription}>{society.description}</Text>
                    <View style={styles.membersRow}>
                      <Users size={13} color="#888" />
                      <Text style={styles.membersText}>{society.members} members</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Societies */}
        {selectedTab === 'my-societies' && (
          <View>
            <Text style={styles.sectionTitle}>Your Societies</Text>
            {societiesLoading ? (
              <Text style={styles.helperText}>Loading…</Text>
            ) : memberships.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color="#CCC" />
                <Text style={styles.emptyTitle}>No societies yet</Text>
                <Text style={styles.emptyDescription}>Discover and join societies to see them here</Text>
                <TouchableOpacity style={styles.discoverButton} onPress={() => setSelectedTab('discover')}>
                  <Text style={styles.discoverButtonText}>Browse Societies</Text>
                </TouchableOpacity>
              </View>
            ) : (
              memberships.map((m) => (
                <TouchableOpacity key={m.society_id} style={styles.membershipCard}>
                  <View style={styles.societyLogo}>
                    <Text style={styles.societyInitial}>{m.societies.name.charAt(0).toUpperCase()}</Text>
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

        {/* Managed */}
        {selectedTab === 'managed' && (
          <View>
            <Text style={styles.sectionTitle}>Societies You Run</Text>
            <View style={styles.emptyState}>
              <Crown size={48} color="#CCC" />
              <Text style={styles.emptyTitle}>No societies managed</Text>
              <Text style={styles.emptyDescription}>Create a society to bring your community together</Text>
              <TouchableOpacity style={styles.discoverButton} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.discoverButtonText}>Create a Society</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create Society Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Society</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Society Name *</Text>
              <TextInput
                style={styles.textInput}
                value={societyName}
                onChangeText={setSocietyName}
                placeholder="e.g., Photography Society"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={societyDescription}
                onChangeText={setSocietyDescription}
                placeholder="What's your society about?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
              <Text style={styles.submitButtonText}>Create Society</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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

const hostBadgeColors: Record<'user' | 'society' | 'university', { bg: { backgroundColor: string }; text: { color: string } }> = {
  user:       { bg: { backgroundColor: '#F0FDF4' }, text: { color: '#16A34A' } },
  society:    { bg: { backgroundColor: '#EEF2FF' }, text: { color: '#4A6CF7' } },
  university: { bg: { backgroundColor: '#FFF7ED' }, text: { color: '#EA6C00' } },
};

function SocietyEventCard({
  event,
  societyNameMap,
  universityNameMap,
}: {
  event: Event;
  societyNameMap: Map<string, string>;
  universityNameMap: Map<string, string>;
}) {
  const isFree = event.booking_mode === EventBookingMode.FREE;
  const hostTag = getHostTag(event, societyNameMap, universityNameMap);
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
            <Text style={cardStyles.attendeesText}>Up to {event.max_participants}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  addButton: { padding: 8, borderRadius: 12, backgroundColor: '#FF6B35' },
  tabScroll: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexGrow: 0 },
  tabContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  activeTab: { backgroundColor: '#FF6B35' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  filterRow: { marginHorizontal: -20, backgroundColor: '#F8F9FA' },
  filterRowContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#EEEEEE' },
  filterChipActive: { backgroundColor: '#FF6B35' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#FFFFFF' },
  eventsSection: { marginTop: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 },
  resultCount: { fontSize: 13, color: '#888' },
  loadingContainer: { paddingTop: 60, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  societyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  societyCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  societyLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
  societyInitial: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  societyInfo: { flex: 1 },
  societyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  societyName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  societyDescription: { fontSize: 13, color: '#666', marginBottom: 6 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  membersText: { fontSize: 12, color: '#888' },
  joinButton: { backgroundColor: '#FF6B35', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8 },
  joinButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  membershipCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  membershipInfo: { flex: 1 },
  membershipRole: { fontSize: 13, color: '#888', marginTop: 2 },
  helperText: { fontSize: 14, color: '#666', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  discoverButton: { backgroundColor: '#FF6B35', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 },
  discoverButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  cancelText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  formSection: { paddingVertical: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginBottom: 8 },
  textInput: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A1A1A', borderWidth: 1, borderColor: '#E9ECEF' },
  textArea: { height: 120, textAlignVertical: 'top' },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  submitButton: { backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
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
  hostBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexShrink: 0 },
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
