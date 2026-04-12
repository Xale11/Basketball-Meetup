import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search, Filter, Plus, Users, Crown, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import useFetchUserSocieties from '@/hooks/societies/useFetchUserSocieties';

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
  const { memberships, isLoading } = useFetchUserSocieties(user?.id);

  const [selectedTab, setSelectedTab] = useState<'discover' | 'my-societies' | 'managed'>('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [societyName, setSocietyName] = useState('');
  const [societyDescription, setSocietyDescription] = useState('');

  const tabs = [
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

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

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
            {isLoading ? (
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  addButton: { padding: 8, borderRadius: 12, backgroundColor: '#FF6B35' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 12, borderRadius: 20 },
  activeTab: { backgroundColor: '#FF6B35' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
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
