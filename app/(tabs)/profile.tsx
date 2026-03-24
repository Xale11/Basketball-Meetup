import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CreditCard as Edit, Calendar, MapPin, Trophy, Star, ChevronRight, CreditCard, Bell, Shield, X, Camera, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';
import useUpdateProfilePhoto from '@/hooks/users/useUpdateProfilePhoto';
import useUpdateUser from '@/hooks/users/useUpdateUser';

export default function ProfileScreen() {
  const { user, session, logout } = useAuth();
  const { memberships, isLoading: societiesLoading } = useFetchUserSocieties(user?.id);
  const { photoUploading, handlePhotoPress } = useUpdateProfilePhoto(user?.id);
  const { saving, updateProfile } = useUpdateUser(user?.id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    course: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        bio: user.bio ?? '',
        course: user.course ?? '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        bio: editForm.bio.trim() || undefined,
        course: editForm.course.trim() || undefined,
      });
      setShowEditModal(false);
    } catch (e) {
      // error already logged in hook
    }
  };

  const stats = [
    { label: 'Events Joined', value: '12', icon: Calendar },
    { label: 'Courts Visited', value: '8', icon: MapPin },
    { label: 'Games Played', value: '45', icon: Trophy },
    { label: 'Rating', value: '4.8', icon: Star },
  ];

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
            <TouchableOpacity style={styles.avatarContainer} onPress={() => handlePhotoPress(!!user?.photoUrl)} disabled={photoUploading}>
              {user?.photoUrl
                ? <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
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
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
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

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <stat.icon size={24} color="#FF6B35" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.clubSection}>
          <Text style={styles.sectionTitle}>Society Memberships</Text>
          {societiesLoading ? (
            <Text style={styles.societyHelperText}>Loading societies…</Text>
          ) : memberships.length === 0 ? (
            <Text style={styles.societyHelperText}>You haven't joined any societies yet.</Text>
          ) : (
            memberships.map((m) => (
              <View key={m.societyId} style={[styles.clubCard, styles.societyCard]}>
                <View style={styles.clubInfo}>
                  <View style={styles.clubLogo}>
                    <Text style={styles.clubInitial}>{m.societies.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.clubName}>{m.societies.name}</Text>
                    <Text style={styles.clubRole}>{m.roleId}</Text>
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
              value={editForm.firstName}
              onChangeText={(t) => setEditForm((p) => ({ ...p, firstName: t }))}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.lastName}
              onChangeText={(t) => setEditForm((p) => ({ ...p, lastName: t }))}
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
});