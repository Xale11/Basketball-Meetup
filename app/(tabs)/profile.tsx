import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Pencil as Edit, ChevronRight, CreditCard, Bell, Shield, User, Camera } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import useUpdateProfilePhoto from '@/hooks/users/useUpdateProfilePhoto';
import useUpdateUser from '@/hooks/users/useUpdateUser';
import { useFetchMyEvents } from '@/hooks/events/useFetchMyEvents';
import { useFetchParticipantEvents } from '@/hooks/events/useFetchParticipantEvents';
import { appVariant } from '@/constants/appVariant';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ActivitySection } from '@/components/profile/ActivitySection';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { useState } from 'react';

export default function ProfileScreen() {
  const { user, session, logout } = useAuth();
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);
  const { photoUploading, handlePhotoPress } = useUpdateProfilePhoto(user?.id);
  const { saving, updateProfile } = useUpdateUser(user?.id);
  const { events: myEvents, loading: myEventsLoading } = useFetchMyEvents(user?.id);
  const { events: participantEvents, loading: participantEventsLoading } = useFetchParticipantEvents(user?.id);

  const [showEditModal, setShowEditModal] = useState(false);

  const menuItems = [
    { label: 'Edit Profile', icon: Edit, onPress: () => setShowEditModal(true) },
    { label: 'Payment Methods', icon: CreditCard, onPress: () => {} },
    { label: 'Notifications', icon: Bell, onPress: () => {} },
    { label: 'Privacy & Security', icon: Shield, onPress: () => {} },
    { label: 'Settings', icon: Settings, onPress: () => {} },
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                : <View style={styles.avatarPlaceholder}><User size={36} color="#9CA3AF" /></View>
              }
              <View style={styles.avatarBadge}>
                {photoUploading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Camera size={14} color="#FFFFFF" />
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
              <Edit size={20} color="#FF6B35" />
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
                <item.icon size={20} color="#666" />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color="#666" />
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
  settingsButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  content: { flex: 1, paddingHorizontal: 20 },
  profileSection: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 8 },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#28A745' },
  editButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF4F0' },
  sectionCardSpacing: {
    marginTop: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  helperText: { fontSize: 14, color: '#666', marginTop: 4 },
  societyCard: {
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  societyInitial: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  societyName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  societyRole: { fontSize: 14, color: '#666' },
  menuSection: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 16, color: '#1A1A1A', marginLeft: 12 },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
