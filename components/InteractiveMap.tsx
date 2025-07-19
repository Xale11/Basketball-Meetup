import React, { useState } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../constants/theme';

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
}

const courts: Court[] = [
  {
    id: '1',
    title: 'Milton Keynes Basketball Court',
    description: 'Main outdoor basketball court with 2 full-size courts',
    coordinate: { latitude: 52.0417, longitude: -0.7558 },
    type: 'outdoor',
    surface: 'Asphalt'
  },
  {
    id: '2',
    title: 'Bletchley Leisure Centre',
    description: 'Indoor basketball facility with professional courts',
    coordinate: { latitude: 51.9947, longitude: -0.7344 },
    type: 'indoor',
    surface: 'Wooden'
  },
  {
    id: '3',
    title: 'Stantonbury Campus Courts',
    description: 'School basketball courts available for public use',
    coordinate: { latitude: 52.0569, longitude: -0.7847 },
    type: 'outdoor',
    surface: 'Concrete'
  },
  {
    id: '4',
    title: 'Wolverton Sports Ground',
    description: 'Community basketball court with lighting',
    coordinate: { latitude: 52.0647, longitude: -0.8239 },
    type: 'outdoor',
    surface: 'Asphalt'
  },
  {
    id: '5',
    title: 'Newport Pagnell Sports Centre',
    description: 'Multi-purpose sports facility with basketball courts',
    coordinate: { latitude: 52.0875, longitude: -0.7222 },
    type: 'indoor',
    surface: 'Synthetic'
  }
];

const InteractiveMap = () => {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleMarkerPress = (court: Court) => {
    setSelectedCourt(court);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCourt(null);
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: 52.0417,
          longitude: -0.7558,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {courts.map((court) => (
          <Marker
            key={court.id}
            coordinate={court.coordinate}
            title={court.title}
            description={court.description}
            onPress={() => handleMarkerPress(court)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{court.title}</Text>
                <Text style={styles.calloutDescription}>{court.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

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
                {/* Title and subtitle */}
                <Text style={styles.cardTitle}>{selectedCourt.title}</Text>
                <Text style={styles.cardSubtitle}>{selectedCourt.description}</Text>

                {/* Details row */}
                <View style={styles.cardDetailsRow}>
                  <View style={styles.cardDetailItem}>
                    <Text style={styles.cardDetailIcon}>{selectedCourt.type === 'indoor' ? '🏠' : '🌳'}</Text>
                    <Text style={styles.cardDetailText}>{selectedCourt.type === 'indoor' ? 'Indoor' : 'Outdoor'}</Text>
                  </View>
                  <View style={styles.cardDetailItem}>
                    <Text style={styles.cardDetailIcon}>🛣️</Text>
                    <Text style={styles.cardDetailText}>{selectedCourt.surface}</Text>
                  </View>
                </View>

                {/* Button */}
                <TouchableOpacity style={styles.cardButton} onPress={closeModal}>
                  <Text style={styles.cardButtonText}>Join Game</Text>
                </TouchableOpacity>
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
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPopup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 24,
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetailIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  cardDetailText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  cardButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});