import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search, Filter, Plus, Users, Calendar, DollarSign, Settings, Crown, MapPin, Clock } from 'lucide-react-native';
import { ClubCard } from '@/components/ClubCard';
import { mockClubs } from '@/utils/mockData';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/firebase/firebase';
import { useEffect } from 'react';

export default function ClubsScreen() {
  const { user, checkAuth } = useAuth();
  useEffect(() => {
    checkAuth();
  }, [auth.currentUser]);

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
    if (!clubName.trim() || !clubDescription.trim()) {
      return;
    }
    
    // Here you would create the club in your backend
    console.log('Creating club:', {
      name: clubName,
      description: clubDescription,
      monthlyFee: parseFloat(monthlyFee) || 0,
      sessionFee: parseFloat(sessionFee) || 0,
    });
    
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
          <TouchableOpacity style={styles.iconButton}>
            <Search size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Filter size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateClub(true)}
          >
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
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'discover' && (
          <View>
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Featured Clubs</Text>
              {mockClubs.map((club) => (
                <ClubCard 
                  key={club.id} 
                  club={club} 
                  onPress={() => {}} 
                  showJoinButton={true}
                />
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'my-clubs' && (
          <View>
            <Text style={styles.sectionTitle}>Your Memberships</Text>
            {mockClubs.slice(0, 1).map((club) => (
              <ClubCard 
                key={club.id} 
                club={club} 
                onPress={() => {}} 
                showJoinButton={false}
                isMember={true}
              />
            ))}
          </View>
        )}

        {selectedTab === 'managed' && (
          <View>
            <Text style={styles.sectionTitle}>Clubs You Manage</Text>
            {user?.isClubAdmin ? (
              mockClubs.filter(club => club.adminId === user.id).map((club) => (
                <ClubCard 
                  key={club.id} 
                  club={club} 
                  onPress={() => {}} 
                  showJoinButton={false}
                  isAdmin={true}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Crown size={48} color="#CCC" />
                <Text style={styles.emptyTitle}>No Clubs Managed</Text>
                <Text style={styles.emptyDescription}>
                  Create a club to start managing players and training sessions
                </Text>
                <TouchableOpacity 
                  style={styles.createClubButton}
                  onPress={() => setShowCreateClub(true)}
                >
                  <Text style={styles.createClubButtonText}>Create Your First Club</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateClub}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateClub(false)}
      >
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
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Club Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={clubName}
                  onChangeText={setClubName}
                  placeholder="e.g., Downtown Ballers"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={clubDescription}
                  onChangeText={setClubDescription}
                  placeholder="Tell players about your club's mission and values..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Membership Fees</Text>
              
              <View style={styles.feeRow}>
                <View style={styles.feeInput}>
                  <Text style={styles.inputLabel}>Monthly Fee</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={20} color="#666" />
                    <TextInput
                      style={styles.priceInput}
                      value={monthlyFee}
                      onChangeText={setMonthlyFee}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.feeInput}>
                  <Text style={styles.inputLabel}>Per Session</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={20} color="#666" />
                    <TextInput
                      style={styles.priceInput}
                      value={sessionFee}
                      onChangeText={setSessionFee}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Club Features</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Users size={24} color="#FF6B35" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Player Management</Text>
                    <Text style={styles.featureDescription}>Manage team rosters and player profiles</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <Calendar size={24} color="#FF6B35" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Training Sessions</Text>
                    <Text style={styles.featureDescription}>Schedule and manage training sessions</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <DollarSign size={24} color="#FF6B35" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Payment Processing</Text>
                    <Text style={styles.featureDescription}>Handle membership and session payments</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateClub}>
              <Text style={styles.createButtonText}>Create Club</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  createButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  featuredSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createClubButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createClubButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  feeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  feeInput: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});