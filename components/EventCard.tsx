import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Users, DollarSign, MapPin } from 'lucide-react-native';
import { Event } from '@/types/event';
import { findCheapestTicket } from '@/utils/findCheapTicket';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.priceTag}>
          <DollarSign size={16} color="#FFFFFF" />
          <Text style={styles.price}>
            {event.pricing.length === 0 ? 'Free' : `$${findCheapestTicket(event.pricing)?.price}`}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{event.description}</Text>

      <View style={styles.infoRow}>
        <Calendar size={16} color="#666" />
        <Text style={styles.infoText}>
          {new Date(event.startDate).toLocaleDateString('en-GB', {
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
          {event.currentParticipants}/{event.maxParticipants} participants
        </Text>
      </View>

      <View style={styles.footer}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(event.status) },
          ]}
        >
          <Text style={styles.statusText}>{event.status.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join Event</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return '#FF6B35';
    case 'live':
      return '#28A745';
    case 'completed':
      return '#6C757D';
    case 'cancelled':
      return '#DC3545';
    default:
      return '#FF6B35';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  statusBadge: {
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
