import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Pencil as Edit, ChevronRight, CreditCard, Bell, Shield, User, Camera, Users, UserPlus, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useUpdateProfilePhoto } from '@/hooks/users/useUpdateProfilePhoto';
import { useUpdateUser } from '@/hooks/users/useUpdateUser';
import { useFetchMyEvents } from '@/hooks/events/useFetchMyEvents';
import { useFetchParticipantEvents } from '@/hooks/events/useFetchParticipantEvents';
import { useFriends } from '@/hooks/friends/useFriends';
import { usePendingRequests } from '@/hooks/friends/usePendingRequests';
import { useReceivedEventInvites } from '@/hooks/events/useReceivedEventInvites';
import { appVariant } from '@/constants/appVariant';
import { AC_AppHeader } from '@/components/activCampus/AC_AppHeader';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ActivitySection } from '@/components/profile/ActivitySection';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { useState } from 'react';
import { useRefreshQueries } from '@/hooks/useRefreshQueries';
import { qk } from '@/lib/queryKeys';

const { colors } = theme;

export default function ProfileScreen() {
  const { user, session, logout } = useAuth();
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);
  const { photoUploading, handlePhotoPress } = useUpdateProfilePhoto(user?.id);
  const { saving, updateProfile } = useUpdateUser(user?.id);
  const { events: myEvents, loading: myEventsLoading } = useFetchMyEvents(user?.id);
  const { events: participantEvents, loading: participantEventsLoading } = useFetchParticipantEvents(user?.id);
  const { friends } = useFriends();
  const { count: requestCount } = usePendingRequests();
  const { count: inviteCount } = useReceivedEventInvites();
  const { refreshing, onRefresh } = useRefreshQueries([
    qk.users.detail(user?.id),
    qk.events.all,
    qk.friends.all,
    qk.eventInvites.all,
    qk.societies.mine(user?.id),
  ]);

  const [showEditModal, setShowEditModal] = useState(false);

  const menuItems = [
    { label: 'Edit Profile', icon: Edit, onPress: () => setShowEditModal(true) },
    { label: 'Payment Methods', icon: CreditCard, onPress: () => { } },
    { label: 'Notifications', icon: Bell, onPress: () => { } },
    { label: 'Privacy & Security', icon: Shield, onPress: () => { } },
    { label: 'Settings', icon: Settings, onPress: () => { } },
  ];

  const handleSave = async (form: { first_name: string; last_name: string; bio: string; course: string }) => {
    try {
      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        bio: form.bio.trim() || undefined,
        course: form.course.trim() || undefined,
      });
      setShowEditModal(false);
    } catch {
      // error already logged in hook
    }
  };

    // ActivCampus renders the shared app header, which owns the top inset.
  // Basketball Meetup keeps its own header and the default safe area.
  return (
    <SafeAreaView
      style={styles.container}
      edges={appVariant === 'activCampus' ? ['left', 'right'] : undefined}
    >
      {appVariant === 'activCampus' && <AC_AppHeader />}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => handlePhotoPress(!!user?.photo_url)}
              disabled={photoUploading}
            >
              {user?.photo_url
                ? <Image source={{ uri: user.photo_url }} style={styles.avatar} />
                : <View style={styles.avatarPlaceholder}><User size={36} color={colors.textMuted} /></View>
              }
              <View style={styles.avatarBadge}>
                {photoUploading
                  ? <ActivityIndicator size="small" color={colors.textOnAccent} />
                  : <Camera size={14} color={colors.textOnAccent} />
                }
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
              <Text style={styles.userEmail}>{session?.user?.email}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active Player</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setShowEditModal(true)}>
              <Edit size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Section */}
        {appVariant === 'activCampus' && (
          <SectionCard style={styles.sectionCardSpacing}>
            <Text style={styles.sectionTitle}>My Activity</Text>
            <ActivitySection
              myEvents={myEvents}
              participantEvents={participantEvents}
              myEventsLoading={myEventsLoading}
              participantEventsLoading={participantEventsLoading}
            />
          </SectionCard>
        )}

        {/* My Network (Friends) */}
        <SectionCard style={styles.sectionCardSpacing}>
          <View style={styles.networkHeader}>
            <Text style={styles.sectionTitle}>My Network</Text>
            <Text style={styles.friendCount}>{friends.length} friends</Text>
          </View>
          <View style={styles.networkButtons}>
            <TouchableOpacity
              style={styles.networkBtn}
              onPress={() => router.push('/friends/search')}
            >
              <UserPlus size={18} color={colors.accent} />
              <Text style={styles.networkBtnText}>Find Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.networkBtn, requestCount > 0 && styles.networkBtnBadged]}
              onPress={() => router.push('/friends/requests')}
            >
              <Users size={18} color={requestCount > 0 ? colors.textOnAccent : colors.accent} />
              <Text style={[styles.networkBtnText, requestCount > 0 && styles.networkBtnTextWhite]}>
                Requests{requestCount > 0 ? ` · ${requestCount}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* Event Invites */}
        <SectionCard style={styles.sectionCardSpacing}>
          <View style={styles.networkHeader}>
            <Text style={styles.sectionTitle}>Event Invites</Text>
            <Text style={styles.friendCount}>{inviteCount} pending</Text>
          </View>
          <TouchableOpacity
            style={[styles.networkBtn, inviteCount > 0 && styles.networkBtnBadged]}
            onPress={() => router.push('/event/invites')}
          >
            <Calendar size={18} color={inviteCount > 0 ? colors.textOnAccent : colors.accent} />
            <Text style={[styles.networkBtnText, inviteCount > 0 && styles.networkBtnTextWhite]}>
              Invites{inviteCount > 0 ? ` · ${inviteCount}` : ''}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Society Memberships */}
        <SectionCard style={styles.sectionCardSpacing}>
          <Text style={styles.sectionTitle}>Society Memberships</Text>
          {societiesLoading ? (
            <Text style={styles.helperText}>Loading societies…</Text>
          ) : memberships.length === 0 ? (
            <Text style={styles.helperText}>You haven't joined any societies yet.</Text>
          ) : (
            memberships.map((m) => (
              <View key={m.society_id} style={styles.societyCard}>
                <View style={styles.societyInfo}>
                  <View style={styles.societyLogo}>
                    <Text style={styles.societyInitial}>{m.societies.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.societyName}>{m.societies.name}</Text>
                    <Text style={styles.societyRole}>{m.role_id}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <item.icon size={20} color={colors.textMuted} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Log Out" variant="destructive" onPress={logout} style={styles.logoutButton} />
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        user={user ?? null}
        saving={saving}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  settingsButton: { padding: 8, borderRadius: 12, backgroundColor: colors.canvas },
  content: { flex: 1, paddingHorizontal: 20 },
  profileSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  userEmail: { fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  statusBadge: {
    backgroundColor: colors.successTone.bg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.successTone.text },
  editButton: { padding: 8, borderRadius: 12, backgroundColor: colors.warningTone.bg },
  sectionCardSpacing: {
    marginTop: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  helperText: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  societyCard: {
    backgroundColor: colors.canvas,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  societyInfo: { flexDirection: 'row', alignItems: 'center' },
  societyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  societyInitial: { fontSize: 16, fontWeight: '600', color: colors.textOnAccent },
  societyName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  societyRole: { fontSize: 14, color: colors.textMuted },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 16, color: colors.textPrimary, marginLeft: 12 },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  networkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  friendCount: { fontSize: 14, color: colors.textMuted },
  networkButtons: { flexDirection: 'row', gap: 10 },
  networkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.warningTone.bg,
    borderWidth: 1,
    borderColor: colors.warningTone.border,
  },
  networkBtnBadged: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  networkBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },
  networkBtnTextWhite: { color: colors.textOnAccent },
});
