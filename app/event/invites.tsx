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
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

export default function EventInvitesScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
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
            <Calendar size={13} color={theme.colors.textMuted} />
            <Text style={s.metaText}>{fmtDate(event.start_date)} · {fmtTime(event.start_date)}</Text>
          </View>
          {event.address ? (
            <View style={s.metaRow}>
              <MapPin size={13} color={theme.colors.textMuted} />
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
              <User size={14} color={theme.colors.textMuted} />
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
              <ActivityIndicator size="small" color={theme.colors.textMuted} />
            ) : (
              <X size={18} color={theme.colors.textMuted} />
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
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Event Invites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={theme.colors.accent} /></View>
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

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.chromeBorder,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: { ...t.typography.h3, color: t.colors.textPrimary },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing.xxl,
    },
    emptyTitle: { ...t.typography.h3, color: t.colors.textPrimary, marginBottom: t.spacing.sm },
    emptySubtitle: { ...t.typography.body, color: t.colors.textMuted, textAlign: 'center' },
    list: { padding: t.spacing.lg },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      ...t.shadow.md,
    },
    eventInfo: { marginBottom: 10 },
    eventName: { ...t.typography.cardTitle, fontSize: 15, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
    metaText: { ...t.typography.caption, color: t.colors.textMuted, flex: 1 },
    inviterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      marginBottom: t.spacing.md,
    },
    avatar: { width: 28, height: 28, borderRadius: 14 },
    avatarFallback: {
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inviterText: { ...t.typography.caption, color: t.colors.textMuted },
    inviterName: { color: t.colors.textPrimary, fontFamily: t.typography.label.fontFamily },
    actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    viewBtn: {
      flex: 1,
      backgroundColor: t.colors.accent,
      borderRadius: t.radius.chip,
      paddingVertical: 10,
      alignItems: 'center',
    },
    viewBtnText: { ...t.typography.button, fontSize: 13, color: t.colors.textOnAccent },
    declineBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
