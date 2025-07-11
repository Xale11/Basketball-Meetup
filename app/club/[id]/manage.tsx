import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, Calendar, DollarSign, Plus, Settings, Mail, Phone, Crown, X } from 'lucide-react-native';
import { mockClubs } from '@/utils/mockData';
import { useAuth } from '@/hooks/useAuth';

export default function ClubManageScreen() {
  const { user, loading } = useAuth();
  const { id } = useLocalSearchParams();
  const club = mockClubs.find(c => c.id === id);
  const [selectedTab, setSelectedTab] = useState('players');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [playerEmail, setPlayerEmail] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionPrice, setSessionPrice] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading]);

  if (loading) {
    return null; // or a loading spinner
  }

  if (!club) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Club not found</Text>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: 'players', label: 'Players', icon: Users },
    { key: 'sessions', label: 'Sessions', icon: Calendar },
    { key: 'payments', label: 'Payments', icon: DollarSign },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleInvitePlayer = () => {
    if (!playerEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    // Here you would send an invitation
    Alert.alert('Success', `Invitation sent to ${playerEmail}`);
    setPlayerEmail('');
    setShowAddPlayer(false);
  };

  const handleCreateSession = () => {
    if (!sessionTitle.trim()) {
      Alert.alert('Error', 'Please enter a session title');
      return;
    }
    
    // Here you would create the training session
    Alert.alert('Success', 'Training session created successfully');
    setSessionTitle('');
    setSessionPrice('');
    setShowAddSession(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{club.name}</Text>
          <Text style={styles.subtitle}>Club Management</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <tab.icon size={20} color={selectedTab === tab.key ? '#FFFFFF' : '#666'} />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'players' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Club Members ({club.members.length})</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddPlayer(true)}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.playersList}>
              {club.members.map((memberId, index) => (
                <View key={memberId} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitial}>P</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>Player {index + 1}</Text>
                    <Text style={styles.playerEmail}>player{index + 1}@example.com</Text>
                    <Text style={styles.playerStatus}>Active Member</Text>
                  </View>
                  <View style={styles.playerActions}>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Mail size={16} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Phone size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'sessions' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training Sessions</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddSession(true)}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.sessionsList}>
              {club.trainingSchedule.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionPrice}>${session.price}</Text>
                  </View>
                  <Text style={styles.sessionTime}>
                    {session.recurringDays.join(', ')} • {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={styles.sessionStat}>
                      {session.currentParticipants}/{session.maxParticipants} players
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'payments' && (
          <View>
            <Text style={styles.sectionTitle}>Payment Overview</Text>
            
            <View style={styles.paymentStats}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>$2,450</Text>
                <Text style={styles.statLabel}>Monthly Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>$180</Text>
                <Text style={styles.statLabel}>Session Revenue</Text>
              </View>
            </View>

            <View style={styles.recentPayments}>
              <Text style={styles.subsectionTitle}>Recent Payments</Text>
              {[1, 2, 3].map((payment) => (
                <View key={payment} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentPlayer}>Player {payment}</Text>
                    <Text style={styles.paymentType}>Monthly Membership</Text>
                  </View>
                  <Text style={styles.paymentAmount}>$150</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'settings' && (
          <View>
            <Text style={styles.sectionTitle}>Club Settings</Text>
            
            <View style={styles.settingsList}>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingLabel}>Edit Club Information</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingLabel}>Manage Training Locations</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingLabel}>Payment Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingLabel}>Notification Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddPlayer(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Player</Text>
            <TouchableOpacity onPress={() => setShowAddPlayer(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Send an invitation to a player to join your club
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={playerEmail}
                onChangeText={setPlayerEmail}
                placeholder="player@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.inviteButton} onPress={handleInvitePlayer}>
              <Text style={styles.inviteButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Session Modal */}
      <Modal
        visible={showAddSession}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddSession(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Training Session</Text>
            <TouchableOpacity onPress={() => setShowAddSession(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Session Title</Text>
              <TextInput
                style={styles.textInput}
                value={sessionTitle}
                onChangeText={setSessionTitle}
                placeholder="e.g., Skills Training"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price per Session</Text>
              <View style={styles.priceInputContainer}>
                <DollarSign size={20} color="#666" />
                <TextInput
                  style={styles.priceInput}
                  value={sessionPrice}
                  onChangeText={setSessionPrice}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.createSessionButton} onPress={handleCreateSession}>
              <Text style={styles.createSessionButtonText}>Create Session</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  placeholder: {
    width: 40,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersList: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playerInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  playerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  playerStatus: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
  },
  playerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sessionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sessionStats: {
    flexDirection: 'row',
  },
  sessionStat: {
    fontSize: 14,
    color: '#666',
  },
  paymentStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  recentPayments: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentPlayer: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 12,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28A745',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
  inviteButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createSessionButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createSessionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});