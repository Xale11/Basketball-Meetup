import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Users, Star } from 'lucide-react-native';
import { Court } from '@/types';

interface CourtCardProps {
  court: Court;
  onPress: () => void;
}

export function CourtCard({ court, onPress }: CourtCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image 
        source={{ uri: court.images[0] }} 
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name}>{court.name}</Text>
        <View style={styles.locationRow}>
          <MapPin size={16} color="#666" />
          <Text style={styles.address}>{court.address}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Star size={16} color="#FFD700" />
            <Text style={styles.statText}>{court.rating}</Text>
          </View>
          <View style={styles.stat}>
            <Users size={16} color="#FF6B35" />
            <Text style={styles.statText}>{court.checkedInUsers.length}</Text>
          </View>
        </View>
        <View style={styles.amenitiesRow}>
          {court.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});