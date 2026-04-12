import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Pencil as Edit, ChevronRight, CreditCard, Bell, Shield, X, Camera, User, MapPin, Clock } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import useUpdateProfilePhoto from '@/hooks/users/useUpdateProfilePhoto';
import useUpdateUser from '@/hooks/users/useUpdateUser';
import { appVariant } from '@/constants/appVariant';

type ActivityTab = 'upcoming' | 'created' | 'past';

const MOCK_MY_ACTIVITIES = {
  upcoming: [
    { id: '1', title: '5-a-side Football', time: 'Today · 5:30 PM', location: 'Sports Centre', status: 'joined' },
    { id: '2', title: 'Study Group — Calculus', time: 'Tomorrow · 3:00 PM', location: 'Library 4B', status: 'joined' },
  ],
  created: [
    { id: '3', title: 'Campus Social Run', time: 'Today · 5:30 PM', location: 'Main Quad', status: 'hosting' },
  ],
  past: [
    { id: '4', title: 'Board Games Night', time: 'Last Friday · 7:00 PM', location: 'SU Common Room', status: 'completed' },
    { id: '5', title: 'Basketball Pickup', time: 'Last Monday · 6:00 PM', location: 'Sports Hall B', status: 'completed' },
  ],
};

export default function ProfileScreen() {
  const { user, session, logout } = useAuth();
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);
  const { photoUploading, handlePhotoPress } = useUpdateProfilePhoto(user?.id);
  const { saving, updateProfile } = useUpdateUser(user?.id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [activityTab, setActivityTab] = useState<ActivityTab>('upcoming');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    course: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        bio: user.bio ?? '',
        course: user.course ?? '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile({
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        bio: editForm.bio.trim() || undefined,
        course: editForm.course.trim() || undefined,
      });
      setShowEditModal(false);
    } catch (e) {
      // error already logged in hook
    }
  };

  const menuItems = [
    { label: 'Edit Profile', icon: Edit, onPress: () => setShowEditModal(true) },
    { label: 'Payment Methods', icon: CreditCard, onPress: () => {} },
    { label: 'Notifications', icon: Bell, onPress: () => {} },
    { label: 'Privacy & Security', icon: Shield, onPress: () => {} },
    { label: 'Settings', icon: Settings, onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.avatarContainer} onPress={() => handlePhotoPress(!!user?.photo_url)} disabled={photoUploading}>
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


        {appVariant === 'activCampus' && (
          <View style={styles.clubSection}>
            <Text style={styles.sectionTitle}>My Activity</Text>
            <View style={styles.activityTabRow}>
              {(['upcoming', 'created', 'past'] as ActivityTab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.activityTabChip, activityTab === t && styles.activityTabChipActive]}
                  onPress={() => setActivityTab(t)}
                >
                  <Text style={[styles.activityTabText, activityTab === t && styles.activityTabTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {MOCK_MY_ACTIVITIES[activityTab].length === 0 ? (
              <Text style={styles.societyHelperText}>Nothing here yet.</Text>
            ) : (
              MOCK_MY_ACTIVITIES[activityTab].map((a) => (
                <View key={a.id} style={styles.activityItem}>
                  <View style={styles.activityItemInfo}>
                    <Text style={styles.activityItemTitle}>{a.title}</Text>
                    <View style={styles.activityItemMeta}>
                      <Clock size={12} color="#888" />
                      <Text style={styles.activityItemMetaText}>{a.time}</Text>
                      <MapPin size={12} color="#888" />
                      <Text style={styles.activityItemMetaText}>{a.location}</Text>
                    </View>
                  </View>
                  <View style={[styles.activityStatusBadge,
                    a.status === 'hosting' && styles.activityStatusHosting,
                    a.status === 'completed' && styles.activityStatusCompleted,
                  ]}>
                    <Text style={[styles.activityStatusText,
                      a.status === 'hosting' && styles.activityStatusTextHosting,
                      a.status === 'completed' && styles.activityStatusTextCompleted,
                    ]}>
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.clubSection}>
          <Text style={styles.sectionTitle}>Society Memberships</Text>
          {societiesLoading ? (
            <Text style={styles.societyHelperText}>Loading societies…</Text>
          ) : memberships.length === 0 ? (
            <Text style={styles.societyHelperText}>You haven't joined any societies yet.</Text>
          ) : (
            memberships.map((m) => (
              <View key={m.society_id} style={[styles.clubCard, styles.societyCard]}>
                <View style={styles.clubInfo}>
                  <View style={styles.clubLogo}>
                    <Text style={styles.clubInitial}>{m.societies.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.clubName}>{m.societies.name}</Text>
                    <Text style={styles.clubRole}>{m.role_id}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

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

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.first_name}
              onChangeText={(t) => setEditForm((p) => ({ ...p, first_name: t }))}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.last_name}
              onChangeText={(t) => setEditForm((p) => ({ ...p, last_name: t }))}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea]}
              value={editForm.bio}
              onChangeText={(t) => setEditForm((p) => ({ ...p, bio: t }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Course</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.course}
              onChangeText={(t) => setEditForm((p) => ({ ...p, course: t }))}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28A745',
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF4F0',
  },
  statsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  achievementsSection: {
    marginTop: 20,
  },
  achievementsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  clubSection: {
    marginTop: 20,
  },
  clubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clubInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  clubRole: {
    fontSize: 14,
    color: '#666',
  },
  clubButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clubButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
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
  societyHelperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  societyCard: {
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  fieldTextArea: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  activityTabChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  activityTabChipActive: {
    backgroundColor: '#FF6B35',
  },
  activityTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activityTabTextActive: {
    color: '#FFFFFF',
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  activityItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  activityItemMetaText: {
    fontSize: 12,
    color: '#888',
    marginRight: 6,
  },
  activityStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E8F5E8',
    marginLeft: 8,
  },
  activityStatusHosting: {
    backgroundColor: '#FFF4E8',
  },
  activityStatusCompleted: {
    backgroundColor: '#F0F0F0',
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28A745',
  },
  activityStatusTextHosting: {
    color: '#FF9F40',
  },
  activityStatusTextCompleted: {
    color: '#888',
  },
});