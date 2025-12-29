import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Navigation, Users, Clock, Maximize2, Minimize2 } from 'lucide-react-native';
import { CourtCard } from '@/components/CourtCard';
import { mockCourts } from '@/utils/mockData';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/api/firebase';
import InteractiveMap from '@/components/InteractiveMap';

export default function MapScreen() {
  const {  } = useAuth();
  
  const [showCourtDetails, setShowCourtDetails] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(mockCourts[0]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const handleCourtPress = (court: any) => {
    setSelectedCourt(court);
    setShowCourtDetails(true);
  };

  const handleCheckIn = () => {
    setIsCheckedIn(!isCheckedIn);
  };

  // Dynamic styles based on state
  const mapContainerStyle: ViewStyle = {
    height: showFullScreen ? 700 : 300,
    backgroundColor: '#E9ECEF',
    position: 'relative',
  };

  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Basketball Courts</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Filter size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={mapContainerStyle}>
          {/* Map placeholder */}
          <InteractiveMap />

          <View style={styles.fullScreenButton}>
            <TouchableOpacity onPress={() => setShowFullScreen(prev => !prev)} style={styles.locationButton}>
              {!showFullScreen ? <Maximize2 size={20} color="#FFFFFF" /> : <Minimize2 size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.courtsList}>
          <Text style={styles.courtsListTitle}>Courts Near You</Text>
          {mockCourts.map((court) => (
            <CourtCard 
              key={court.id} 
              court={court} 
              onPress={() => handleCourtPress(court)} 
            />
          ))}
        </View>

        <Modal
          visible={showCourtDetails}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCourtDetails(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCourt.name}</Text>
              <TouchableOpacity onPress={() => setShowCourtDetails(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.courtInfo}>
                <View style={styles.infoRow}>
                  <MapPin size={20} color="#666" />
                  <Text style={styles.infoText}>{selectedCourt.location.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Users size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {selectedCourt.checkedInUsers.length} players checked in
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Clock size={20} color="#666" />
                  <Text style={styles.infoText}>Open 24/7</Text>
                </View>
              </View>

              <View style={styles.amenitiesSection}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {selectedCourt.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.amenityChip}>
                      <Text style={styles.amenityText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.playersSection}>
                <Text style={styles.sectionTitle}>Players Currently Here</Text>
                {selectedCourt.checkedInUsers.length > 0 ? (
                  <View style={styles.playersList}>
                    {selectedCourt.checkedInUsers.map((userId: string, index: number) => (
                      <View key={index} style={styles.playerItem}>
                        <View style={styles.playerAvatar}>
                          <Text style={styles.playerInitial}>J</Text>
                        </View>
                        <Text style={styles.playerName}>Player {index + 1}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No players checked in</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.checkInButton, isCheckedIn && styles.checkedInButton]}
                onPress={handleCheckIn}
              >
                <Text style={[styles.checkInText, isCheckedIn && styles.checkedInText]}>
                  {isCheckedIn ? 'Check Out' : 'Check In'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  courtsList: {
    flex: 1,
    padding: 20,
  },
  courtsListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
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
  courtInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  amenitiesSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  amenityChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  playersSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  playersList: {
    gap: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checkInButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkedInButton: {
    backgroundColor: '#28A745',
  },
  checkInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkedInText: {
    color: '#FFFFFF',
  },
});