import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, Pencil, Calendar } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useFetchSocietyById from '@/hooks/societies/useFetchSocietyById';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import { useJoinSociety } from '@/hooks/societies/useJoinSociety';
import { useLeaveSociety } from '@/hooks/societies/useLeaveSociety';
import { useUpdateSociety } from '@/hooks/societies/useUpdateSociety';
import useFetchEventsBySociety from '@/hooks/events/useFetchEventsBySociety';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { ImagePicker } from '@/components/ImagePicker';
import {
  SOCIETY_CATEGORIES,
  SocietyRoleIdEnum,
  ADMIN_SOCIETY_ROLES,
} from '@/types/societies';

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

export default function SocietyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const { society, memberCount, loading: societyLoading } = useFetchSocietyById(id);
  const { memberships } = useFetchUserSocieties(user?.id);
  const { events, loading: eventsLoading } = useFetchEventsBySociety(id);
  const { participationMap } = useUserParticipations(user?.id);
  const { universities } = useFetchUniversities();

  const { joinSociety, loading: joining } = useJoinSociety();
  const { leaveSociety, loading: leaving } = useLeaveSociety();
  const { updateSociety, loading: updating } = useUpdateSociety();

  // Derived membership state
  const userMembership = useMemo(
    () => memberships.find((m) => m.society_id === id) ?? null,
    [memberships, id],
  );
  const isMember = !!userMembership;
  const isAdmin =
    userMembership !== null &&
    ADMIN_SOCIETY_ROLES.includes(userMembership.role_id as SocietyRoleIdEnum);

  const societyNameMap = useMemo(
    () => (society ? new Map([[society.id, society.name ?? '']]) : new Map<string, string>()),
    [society],
  );
  const universityNameMap = useMemo(
    () => new Map(universities.map((u) => [u.id, u.name])),
    [universities],
  );

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editLogoUri, setEditLogoUri] = useState<string | undefined>(undefined);

  const openEdit = () => {
    setEditName(society?.name ?? '');
    setEditDescription(society?.description ?? '');
    setEditCategory(society?.category ?? null);
    setEditLogoUri(undefined);
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Society name cannot be empty');
      return;
    }
    if (!id) return;
    updateSociety(
      { id, name: editName, description: editDescription, category: editCategory, logoUri: editLogoUri },
      {
        onSuccess: () => setShowEdit(false),
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  const handleJoin = () => {
    joinSociety(
      { societyId: id },
      {
        onSuccess: () => Alert.alert('Joined!', `Welcome to ${society?.name ?? 'the society'}`),
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Society',
      `Are you sure you want to leave ${society?.name ?? 'this society'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () =>
            leaveSociety(
              { societyId: id },
              { onError: (err) => Alert.alert('Error', err.message) },
            ),
        },
      ],
    );
  };

  if (societyLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={s.centred}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  if (!society) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={s.centred}>
          <Text style={s.errorText}>Society not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const actionLoading = joining || leaving;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {society.name}
        </Text>
        {isAdmin ? (
          <TouchableOpacity style={s.editBtn} onPress={openEdit}>
            <Pencil size={18} color="#FF6B35" />
          </TouchableOpacity>
        ) : (
          <View style={s.headerSpacer} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner / Logo */}
        {society.logo ? (
          <Image source={{ uri: society.logo }} style={s.banner} resizeMode="cover" />
        ) : (
          <View style={[s.banner, s.bannerPlaceholder]}>
            <Text style={s.bannerInitial}>{society.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
        )}

        {/* Info Card */}
        <View style={s.infoCard}>
          <View style={s.nameCategoryRow}>
            <Text style={s.societyName}>{society.name}</Text>
            {society.category && (
              <View
                style={[
                  s.categoryBadge,
                  { backgroundColor: CATEGORY_COLORS[society.category] ?? '#F0F0F0' },
                ]}
              >
                <Text
                  style={[
                    s.categoryText,
                    { color: CATEGORY_TEXT[society.category] ?? '#666' },
                  ]}
                >
                  {society.category}
                </Text>
              </View>
            )}
          </View>

          <View style={s.memberRow}>
            <Users size={14} color="#888" />
            <Text style={s.memberText}>{memberCount} members</Text>
          </View>

          {society.description ? (
            <Text style={s.description}>{society.description}</Text>
          ) : null}

          {/* Join / Leave */}
          <View style={s.actionRow}>
            {actionLoading ? (
              <View style={[s.joinBtn, s.joinBtnLoading]}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            ) : isMember ? (
              <TouchableOpacity style={[s.joinBtn, s.joinBtnJoined]} onPress={handleLeave}>
                <Text style={s.joinBtnText}>Member ✓</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.joinBtn} onPress={handleJoin}>
                <Text style={s.joinBtnText}>Join Society</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Upcoming Events</Text>
            <Text style={s.sectionCount}>{events.length}</Text>
          </View>

          {eventsLoading ? (
            <View style={s.centred}>
              <LoadingSpinner />
            </View>
          ) : events.length === 0 ? (
            <View style={s.emptyEvents}>
              <Calendar size={36} color="#CCC" />
              <Text style={s.emptyEventsText}>No upcoming events</Text>
            </View>
          ) : (
            events.map((event) => (
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal (admin only) */}
      <Modal
        visible={showEdit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEdit(false)}
      >
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit Society</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={s.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Logo image picker */}
            <Text style={s.fieldLabel}>Banner Image</Text>
            <ImagePicker
              selectedImage={editLogoUri ?? society.logo ?? undefined}
              onImageSelected={setEditLogoUri}
              onImageRemoved={() => setEditLogoUri(undefined)}
              placeholder="Add Society Banner"
            />
            <View style={{ height: 20 }} />

            <TextInputField
              label="Society Name *"
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g., Photography Society"
            />
            <View style={{ height: 16 }} />

            <TextInputField
              label="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="What's your society about?"
              multiline
              numberOfLines={4}
              multilineHeight={120}
            />
            <View style={{ height: 16 }} />

            {/* Category chips */}
            <Text style={s.fieldLabel}>Category</Text>
            <View style={s.categoryChips}>
              {SOCIETY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, editCategory === cat && s.catChipActive]}
                  onPress={() => setEditCategory(editCategory === cat ? null : cat)}
                >
                  <Text style={[s.catChipText, editCategory === cat && s.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.modalFooter}>
            <Button label="Save Changes" loading={updating} onPress={handleSaveEdit} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  editBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFF4F0',
  },
  headerSpacer: { width: 40 },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  errorText: { fontSize: 16, color: '#666' },
  banner: { width: '100%', height: 180 },
  bannerPlaceholder: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerInitial: { fontSize: 72, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  nameCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  societyName: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', flexShrink: 1 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  memberText: { fontSize: 14, color: '#888' },
  description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 16 },
  actionRow: { marginTop: 4 },
  joinBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinBtnJoined: { backgroundColor: '#16A34A' },
  joinBtnLoading: { backgroundColor: '#FF6B35' },
  joinBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  sectionCount: {
    fontSize: 13,
    color: '#888',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyEvents: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEventsText: { fontSize: 15, color: '#AAA' },
  // Modal
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
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  cancelText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
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
