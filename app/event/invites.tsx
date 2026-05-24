import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, User, X } from 'lucide-react-native';
import { useReceivedEventInvites } from '@/hooks/events/useReceivedEventInvites';
import { useRespondEventInvite } from '@/hooks/events/useRespondEventInvite';
import { EventInviteStatus, ReceivedEventInvite } from '@/types/event';

export default function EventInvitesScreen() {
  const { invites, loading } = useReceivedEventInvites();
  const { respond, loading: responding } = useRespondEventInvite();

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const renderInvite = ({ item }: { item: ReceivedEventInvite }) => {
    const inviter = item.invited_by;
    const event = item.event;
    const start = new Date(event.start_date);

    return (
      <View style={s.card}>
        {/* Event info */}
        <TouchableOpacity
          style={s.eventInfo}
          onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        >
          <Text style={s.eventName} numberOfLines={2}>{event.name}</Text>
          <View style={s.metaRow}>
            <Calendar size={13} color="#888" />
            <Text style={s.metaText}>{fmtDate(event.start_date)} · {fmtTime(event.start_date)}</Text>
          </View>
          {event.address ? (
            <View style={s.metaRow}>
              <MapPin size={13} color="#888" />
              <Text style={s.metaText} numberOfLines={1}>{event.address}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Inviter */}
        <View style={s.inviterRow}>
          {inviter.photo_url ? (
            <Image source={{ uri: inviter.photo_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <User size={14} color="#9CA3AF" />
            </View>
          )}
          <Text style={s.inviterText}>
            Invited by <Text style={s.inviterName}>{inviter.first_name} {inviter.last_name}</Text>
          </Text>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.viewBtn}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
          >
            <Text style={s.viewBtnText}>View Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.declineBtn}
            disabled={responding}
            onPress={() =>
              respond({ inviteId: item.id, eventId: event.id, status: EventInviteStatus.DECLINED })
            }
          >
            {responding ? (
              <ActivityIndicator size="small" color="#888" />
            ) : (
              <X size={18} color="#888" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Event Invites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#FF6B35" /></View>
      ) : invites.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>No pending invites</Text>
          <Text style={s.emptySubtitle}>
            When a friend invites you to an event, it'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={renderInvite}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  eventInfo: { marginBottom: 10 },
  eventName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  metaText: { fontSize: 13, color: '#666', flex: 1 },
  inviterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 12,
  },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarFallback: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviterText: { fontSize: 13, color: '#888' },
  inviterName: { fontWeight: '600', color: '#444' },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  viewBtn: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  declineBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
