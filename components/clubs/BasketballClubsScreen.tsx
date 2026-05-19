import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search, Filter, Plus, Users, Calendar, DollarSign, Crown } from 'lucide-react-native';
import { ClubCard } from '@/components/ClubCard';
import { mockClubs } from '@/utils/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';

export default function BasketballClubsScreen() {
  const { user } = useAuth();

  const [showCreateClub, setShowCreateClub] = useState(false);
  const [selectedTab, setSelectedTab] = useState('discover');
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [sessionFee, setSessionFee] = useState('');

  const tabs = [
    { key: 'discover', label: 'Discover' },
    { key: 'my-clubs', label: 'My Clubs' },
    { key: 'managed', label: 'Managed' },
  ];

  const handleCreateClub = () => {
    if (!clubName.trim() || !clubDescription.trim()) return;
    console.log('Creating club:', { name: clubName, description: clubDescription, monthlyFee: parseFloat(monthlyFee) || 0, sessionFee: parseFloat(sessionFee) || 0 });
    setShowCreateClub(false);
    setClubName('');
    setClubDescription('');
    setMonthlyFee('');
    setSessionFee('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Basketball Clubs</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}><Search size={24} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}><Filter size={24} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateClub(true)}>
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
        {selectedTab === 'discover' && (
          <View>
            <Text style={styles.sectionTitle}>Featured Clubs</Text>
            {mockClubs.map((club) => (
              <ClubCard key={club.id} club={club} onPress={() => {}} showJoinButton={true} />
            ))}
          </View>
        )}
        {selectedTab === 'my-clubs' && (
          <View>
            <Text style={styles.sectionTitle}>Your Memberships</Text>
            {mockClubs.slice(0, 1).map((club) => (
              <ClubCard key={club.id} club={club} onPress={() => {}} showJoinButton={false} isMember={true} />
            ))}
          </View>
        )}
        {selectedTab === 'managed' && (
          <View>
            <Text style={styles.sectionTitle}>Clubs You Manage</Text>
            {mockClubs.filter(c => c.admin_id === user?.id).length > 0 ? (
              mockClubs.filter(c => c.admin_id === user?.id).map((club) => (
                <ClubCard key={club.id} club={club} onPress={() => {}} showJoinButton={false} isAdmin={true} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Crown size={48} color="#CCC" />
                <Text style={styles.emptyTitle}>No Clubs Managed</Text>
                <Text style={styles.emptyDescription}>Create a club to start managing players and training sessions</Text>
                <Button label="Create Your First Club" onPress={() => setShowCreateClub(true)} style={styles.createClubButton} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreateClub} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateClub(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Club</Text>
            <TouchableOpacity onPress={() => setShowCreateClub(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Club Information</Text>
              <TextInputField label="Club Name *" value={clubName} onChangeText={setClubName} placeholder="e.g., Downtown Ballers" style={styles.inputGroup} />
              <TextInputField label="Description *" value={clubDescription} onChangeText={setClubDescription} placeholder="Tell players about your club..." multiline numberOfLines={4} multilineHeight={100} />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Membership Fees</Text>
              <View style={styles.feeRow}>
                <View style={styles.feeInput}>
                  <Text style={styles.inputLabel}>Monthly Fee</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={20} color="#666" />
                    <TextInputField style={styles.priceInput} value={monthlyFee} onChangeText={setMonthlyFee} placeholder="0" placeholderTextColor="#999" keyboardType="numeric" />
                  </View>
                </View>
                <View style={styles.feeInput}>
                  <Text style={styles.inputLabel}>Per Session</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={20} color="#666" />
                    <TextInputField style={styles.priceInput} value={sessionFee} onChangeText={setSessionFee} placeholder="0" placeholderTextColor="#999" keyboardType="numeric" />
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Club Features</Text>
              <View style={styles.featuresList}>
                {[
                  { icon: Users, title: 'Player Management', desc: 'Manage team rosters and player profiles' },
                  { icon: Calendar, title: 'Training Sessions', desc: 'Schedule and manage training sessions' },
                  { icon: DollarSign, title: 'Payment Processing', desc: 'Handle membership and session payments' },
                ].map(({ icon: Icon, title, desc }) => (
                  <View key={title} style={styles.featureItem}>
                    <Icon size={24} color="#FF6B35" />
                    <View style={styles.featureText}>
                      <Text style={styles.featureTitle}>{title}</Text>
                      <Text style={styles.featureDescription}>{desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button label="Create Club" onPress={handleCreateClub} />
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
  createButton: { padding: 8, borderRadius: 12, backgroundColor: '#FF6B35' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 16, borderRadius: 20 },
  activeTab: { backgroundColor: '#FF6B35' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  createClubButton: { paddingHorizontal: 24 },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  closeButton: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  formSection: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  formLabel: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  feeRow: { flexDirection: 'row', gap: 16 },
  feeInput: { flex: 1 },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#E9ECEF' },
  priceInput: { flex: 1, fontSize: 16, color: '#1A1A1A', marginLeft: 8 },
  featuresList: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16 },
  featureText: { flex: 1, marginLeft: 16 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  featureDescription: { fontSize: 14, color: '#666' },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
});
