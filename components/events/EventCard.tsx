import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Clock, MapPin, Users } from 'lucide-react-native';
import { Event, EventBookingMode, EventHostType } from '@/types/event';

type HostTagType = 'user' | 'society' | 'university';
type HostTag = { label: string; type: HostTagType };

function getHostTag(
  event: Event,
  societyNameMap: Map<string, string>,
  universityNameMap: Map<string, string>,
): HostTag {
  if (event.host_type === EventHostType.SOCIETY && event.society_id) {
    const name = societyNameMap.get(event.society_id) ?? event.society_id;
    return { label: `Hosted by ${name}`, type: 'society' };
  }
  if (event.host_type === EventHostType.UNIVERSITY && event.university_id) {
    const name = universityNameMap.get(event.university_id) ?? event.university_id;
    return { label: `Hosted by ${name}`, type: 'university' };
  }
  return { label: 'Student Hosted', type: 'user' };
}

const hostBadgeColors: Record<HostTagType, { bg: { backgroundColor: string }; text: { color: string } }> = {
  user:       { bg: { backgroundColor: '#F0FDF4' }, text: { color: '#16A34A' } },
  society:    { bg: { backgroundColor: '#EEF2FF' }, text: { color: '#4A6CF7' } },
  university: { bg: { backgroundColor: '#FFF7ED' }, text: { color: '#EA6C00' } },
};

interface EventCardProps {
  event: Event;
  societyNameMap?: Map<string, string>;
  universityNameMap?: Map<string, string>;
  isJoined?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onPress?: () => void;
}

export function EventCard({ event, societyNameMap, universityNameMap, isJoined, onJoin, onLeave, onPress }: EventCardProps) {
  const isFree = event.booking_mode === EventBookingMode.FREE;
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const now = new Date();
  const isLive = startDate <= now && endDate >= now;
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const timeLabel = isSameDay
    ? `${fmtDate(startDate)} ${fmtTime(startDate)} - ${fmtTime(endDate)}`
    : `${fmtDate(startDate)} ${fmtTime(startDate)} - ${fmtDate(endDate)} ${fmtTime(endDate)}`;

  const hostTag =
    societyNameMap && universityNameMap
      ? getHostTag(event, societyNameMap, universityNameMap)
      : null;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onPress ? onPress() : router.push({ pathname: '/event/[id]', params: { id: event.id } })}
    >
      <View style={s.cardTop}>
        {isLive && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>Live</Text>
          </View>
        )}
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={2}>{event.name}</Text>
          {hostTag ? (
            <View style={[s.badge, hostBadgeColors[hostTag.type].bg]}>
              <Text style={[s.badgeText, hostBadgeColors[hostTag.type].text]}>{hostTag.label}</Text>
            </View>
          ) : (
            <View style={[s.badge, isFree ? s.badgeFree : s.badgePaid]}>
              <Text style={[s.badgeText, isFree ? s.badgeTextFree : s.badgeTextPaid]}>
                {isFree ? 'Free' : `£${event.price_from ?? ''}`}
              </Text>
            </View>
          )}
        </View>
        <View style={s.metaCol}>
          <View style={s.metaItem}>
            <Clock size={13} color="#888" />
            <Text style={s.metaText}>{timeLabel}</Text>
          </View>
          {event.address && (
            <View style={s.metaItem}>
              <MapPin size={13} color="#888" />
              <Text style={s.metaText} numberOfLines={1}>{event.address}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={s.cardBottom}>
        {event.max_participants != null ? (
          <View style={s.attendeesRow}>
            <Users size={14} color="#666" />
            <Text style={s.attendeesText}>Up to {event.max_participants}</Text>
          </View>
        ) : (
          <View style={s.attendeesRow}>
            <Users size={14} color="#666" />
            <Text style={s.attendeesText}>Open</Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.joinButton, isJoined && s.joinButtonJoined]}
          onPress={(e) => {
            e.stopPropagation?.();
            isJoined ? onLeave?.() : onJoin?.();
          }}
        >
          <Text style={[s.joinButtonText, isJoined && s.joinButtonTextJoined]}>
            {isJoined ? 'Leave' : isFree ? 'Join Free' : `Join · £${event.price_from ?? ''}`}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexShrink: 0 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeFree: { backgroundColor: '#F0FDF4' },
  badgePaid: { backgroundColor: '#FFF7ED' },
  badgeTextFree: { color: '#16A34A' },
  badgeTextPaid: { color: '#EA6C00' },
  metaCol: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#666', flex: 1 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attendeesText: { fontSize: 13, color: '#666' },
  joinButton: { backgroundColor: '#FF6B35', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  joinButtonJoined: { backgroundColor: '#F0F0F0' },
  joinButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  joinButtonTextJoined: { color: '#555' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53E3E' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#E53E3E', letterSpacing: 0.5 },
});
