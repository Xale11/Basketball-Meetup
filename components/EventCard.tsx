import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Calendar, Users, DollarSign } from 'lucide-react-native';
import { Event, EventHostType } from '@/types/event';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {event.banner_image_url && (
        <View style={styles.bannerContainer}>
          <Image source={{ uri: event.banner_image_url }} style={styles.bannerImage} />
          <View style={styles.priceTagOverlay}>
            <DollarSign size={16} color="#FFFFFF" />
            <Text style={styles.price}>
              {event.booking_mode === 'FREE' ? 'Free' : `$${event.price_from ?? ''}`}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>{event.name}</Text>
          {!event.banner_image_url && (
            <View style={styles.priceTag}>
              <DollarSign size={16} color="#FFFFFF" />
              <Text style={styles.price}>
                {event.booking_mode === 'FREE' ? 'Free' : `$${event.price_from ?? ''}`}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoRow}>
          <Calendar size={16} color="#666" />
          <Text style={styles.infoText}>
            {new Date(event.start_date).toLocaleDateString('en-GB', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Users size={16} color="#666" />
          <Text style={styles.infoText}>
            {event.max_participants ?? '∞'} max participants
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: event.is_cancelled ? '#DC3545' : '#FF6B35' },
              ]}
            >
              <Text style={styles.statusText}>{event.is_cancelled ? 'CANCELLED' : 'UPCOMING'}</Text>
            </View>
            {event.host_type === EventHostType.UNIVERSITY && (
              <View style={[styles.hostBadge, { backgroundColor: '#1D6FA4' }]}>
                <Text style={styles.statusText}>UNIVERSITY</Text>
              </View>
            )}
            {event.host_type === EventHostType.SOCIETY && (
              <View style={[styles.hostBadge, { backgroundColor: '#7B5EA7' }]}>
                <Text style={styles.statusText}>SOCIETY</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Event</Text>
          </TouchableOpacity>
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
    overflow: 'hidden',
  },
  bannerContainer: {
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  priceTagOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  body: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
