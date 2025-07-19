import React, { useEffect, useState } from 'react';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { Colors } from '../constants/theme';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { mockEvents } from '@/utils/mockData';
import { EventCard } from './EventCard';
import { MapPin, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';

interface Court {
  id: string;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'indoor' | 'outdoor';
  surface: string;
  address: string; // Added address to the interface
}

const courts: Court[] = [
  {
    id: '1',
    title: 'Milton Keynes Basketball Court',
    description: 'Main outdoor basketball court with 2 full-size courts',
    coordinate: { latitude: 52.0417, longitude: -0.7558 },
    type: 'outdoor',
    surface: 'Asphalt',
    address: 'Milton Keynes, MK1 1PT' // Added address
  },
  {
    id: '2',
    title: 'Bletchley Leisure Centre',
    description: 'Indoor basketball facility with professional courts',
    coordinate: { latitude: 51.9947, longitude: -0.7344 },
    type: 'indoor',
    surface: 'Wooden',
    address: 'Bletchley, MK2 2PT' // Added address
  },
  {
    id: '3',
    title: 'Stantonbury Campus Courts',
    description: 'School basketball courts available for public use',
    coordinate: { latitude: 52.0569, longitude: -0.7847 },
    type: 'outdoor',
    surface: 'Concrete',
    address: 'Stantonbury, MK13 0PT' // Added address
  },
  {
    id: '4',
    title: 'Wolverton Sports Ground',
    description: 'Community basketball court with lighting',
    coordinate: { latitude: 52.0647, longitude: -0.8239 },
    type: 'outdoor',
    surface: 'Asphalt',
    address: 'Wolverton, MK12 5PT' // Added address
  },
  {
    id: '5',
    title: 'Newport Pagnell Sports Centre',
    description: 'Multi-purpose sports facility with basketball courts',
    coordinate: { latitude: 52.0875, longitude: -0.7222 },
    type: 'indoor',
    surface: 'Synthetic',
    address: 'Newport Pagnell, MK16 0PT' // Added address
  }
];

const InteractiveMap = () => {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const handleMarkerPress = (court: Court) => {
    setSelectedCourt(court);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCourt(null);
  };

  const moveToUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // setRegion({
      //   latitude: loc.coords.latitude,
      //   longitude: loc.coords.longitude,
      //   latitudeDelta: 0.1,
      //   longitudeDelta: 0.1,
      // });
      // Hard code region around Milton Keynes
      setRegion({
        latitude: 52.0417,
        longitude: -0.7558,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        region={region || undefined}
        initialRegion={region || undefined}
      >
        {courts.map((court) => (
          <Marker
            key={court.id}
            coordinate={court.coordinate}
            title={court.title}
            description={court.description}
            onPress={() => handleMarkerPress(court)}
          >
            <View style={styles.customMarker}>
              <View style={styles.markerDot} />
            </View>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{court.title}</Text>
                <Text style={styles.calloutDescription}>{court.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
              </MapView>

        {/* Location Button */}
        <View style={styles.mapOverlay}>
          <TouchableOpacity style={styles.locationButton} onPress={moveToUserLocation}>
            <Navigation size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>



        <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cardPopup}>
            {selectedCourt && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <AntDesign name="close" size={24} color={Colors.DARK_CONTRAST} />
                  </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle}>{selectedCourt.title}</Text>

                <View style={styles.locationRow}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.address}>{selectedCourt.address}</Text>
                </View>

                {/* Court Image and Action Buttons */}
                <View style={styles.imageActionContainer}>
                  <Image 
                    source={require('../assets/images/court.png')} 
                    style={styles.courtImage}
                    resizeMode="cover"
                  />
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Check In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>RSVP</Text>
                    </TouchableOpacity>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Feather name="users" size={20} color={Colors.PRIMARY} />
                        <Text style={styles.statText}>7</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialIcons name="rsvp" size={24} color={Colors.PRIMARY} />
                        <Text style={styles.statText}>10</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.cardDescription}>{selectedCourt.description}</Text>

                {/* Court Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailTag}>
                    <Text style={styles.detailText}>
                      {selectedCourt.type === 'indoor' ? 'Indoor' : 'Outdoor'}
                    </Text>
                  </View>
                  <View style={styles.detailTag}>
                    <Text style={styles.detailText}>{selectedCourt.surface}</Text>
                  </View>
                </View>

                {/* Events Section */}
                <View style={styles.eventsSection}>
                  <Text style={styles.sectionTitle}>Upcoming Events</Text>
                  <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                    {mockEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onPress={() => {}} 
                      />
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default InteractiveMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    width: 200,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: Colors.TEXT,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    margin: 20,
    width: '100%',
    height: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 0,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  imageActionContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  courtImage: {
    width: '45%',
    height: 120,
    borderRadius: 16,
  },
  actionButtons: {
    flex: 1,
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.DARK_CONTRAST,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
  cardDescription: {
    fontSize: 16,
    color: Colors.TEXT,
    lineHeight: 24,
    marginBottom: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  detailTag: {
    backgroundColor: Colors.SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  eventsSection: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  eventsList: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },

  locationButton: {
    backgroundColor: Colors.PRIMARY,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.PRIMARY,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});