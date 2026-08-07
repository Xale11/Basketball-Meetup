import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Clock, MapPin, Users, CircleCheck as CheckCircle2, CirclePlus as PlusCircle } from 'lucide-react-native';
import {
  Event,
  EventBookingMode,
  EventHostType,
  EventJoinPolicy,
  EventParticipantStatus,
} from '@/types/event';
import { useJoinEvent } from '@/hooks/events/useJoinEvent';
import { useLeaveEvent } from '@/hooks/events/useLeaveEvent';
import { getClassification } from '@/lib/eventClassification';
import { AC_ClassificationBadge } from '@/components/activCampus/AC_ClassificationBadge';
import { CostBadge } from '@/components/ui/CostBadge';
import { AvatarStack, StackedAvatar } from '@/components/ui/AvatarStack';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/** Fewer than this many places left switches the availability text to a warning. */
const LOW_AVAILABILITY = 3;

interface EventCardProps {
  event: Event;
  societyNameMap?: Map<string, string>;
  universityNameMap?: Map<string, string>;
  participantStatus?: EventParticipantStatus | null;
  /** Confirmed attendees, used with `max_participants` for availability (AC-11). */
  goingCount?: number;
  /** The viewer's accepted friends attending, shown as an avatar stack (AC-11). */
  friendsAttending?: StackedAvatar[];
  /** Legacy count-only form, still used by Basketball Meetup surfaces. */
  friendsAttendingCount?: number;
  onPress?: () => void;
}

const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** "Today" / "Tomorrow" / "Thu 7 Aug", matching the redesign's date labels. */
function formatDateLabel(date: Date): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = day(new Date());
  const target = day(date);
  const oneDay = 86400000;
  if (target === today) return 'Today';
  if (target === today + oneDay) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function EventCard({
  event,
  societyNameMap,
  universityNameMap,
  participantStatus,
  goingCount,
  friendsAttending,
  friendsAttendingCount,
  onPress,
}: EventCardProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const s = useThemedStyles(makeStyles);

  const isFree = event.booking_mode === EventBookingMode.FREE;
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  const timeLabel = isSameDay
    ? `${formatDateLabel(startDate)} · ${fmtTime(startDate)}–${fmtTime(endDate)}`
    : `${formatDateLabel(startDate)} ${fmtTime(startDate)} – ${formatDateLabel(endDate)} ${fmtTime(endDate)}`;

  // Organiser line: the society or university name when we have a lookup for it.
  const organiser = (() => {
    if (event.host_type === EventHostType.SOCIETY && event.society_id) {
      return societyNameMap?.get(event.society_id) ?? 'Society';
    }
    if (event.host_type === EventHostType.UNIVERSITY && event.university_id) {
      return universityNameMap?.get(event.university_id) ?? 'University';
    }
    return 'Student hosted';
  })();

  const { joinEvent, loading: joining } = useJoinEvent();
  const { leaveEvent, loading: leaving } = useLeaveEvent();
  const actionLoading = joining || leaving;

  const isInviteOnly = event.join_policy === EventJoinPolicy.INVITE_ONLY;
  const isJoined = participantStatus === EventParticipantStatus.GOING;
  const isPending = participantStatus === EventParticipantStatus.REQUESTED;

  const placesRemaining =
    event.max_participants != null && goingCount != null
      ? Math.max(0, event.max_participants - goingCount)
      : null;
  const isFull = placesRemaining === 0;

  const handleJoin = () => {
    joinEvent(
      { eventId: event.id, joinPolicy: event.join_policy },
      {
        onSuccess: (participant) => {
          const msg =
            participant.status === EventParticipantStatus.REQUESTED
              ? "Your request has been sent. You'll be notified when approved."
              : "You're going! See you there.";
          Alert.alert('Joined!', msg);
        },
        onError: (err) => Alert.alert('Could not join', err.message),
      },
    );
  };

  const handleLeave = () => {
    Alert.alert(
      isPending ? 'Cancel Request' : 'Leave Activity',
      isPending ? 'Cancel your join request?' : 'Are you sure you want to leave this activity?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: isPending ? 'Cancel Request' : 'Leave',
          style: 'destructive',
          onPress: () =>
            leaveEvent({ eventId: event.id }, { onError: (err) => Alert.alert('Error', err.message) }),
        },
      ],
    );
  };

  const openDetails = () =>
    onPress ? onPress() : router.push({ pathname: '/event/[id]', params: { id: event.id } });

  const renderJoinButton = () => {
    // Invite-only events the viewer has no invite to expose no join affordance.
    if (isInviteOnly && !participantStatus) return null;

    if (actionLoading) {
      return (
        <View style={[s.actionBtn, s.actionBtnPrimary]}>
          <ActivityIndicator size="small" color={colors.textOnAccent} />
        </View>
      );
    }
    if (isJoined) {
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnJoined]} onPress={handleLeave}>
          <CheckCircle2 size={14} color={colors.accentText} />
          <Text style={s.actionBtnJoinedText}>Joined</Text>
        </TouchableOpacity>
      );
    }
    if (isPending) {
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnNeutral]} onPress={handleLeave}>
          <Text style={s.actionBtnNeutralText}>Requested</Text>
        </TouchableOpacity>
      );
    }
    if (isFull) {
      return (
        <View style={[s.actionBtn, s.actionBtnNeutral]}>
          <Text style={s.actionBtnDisabledText}>Full</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={handleJoin}>
        <PlusCircle size={14} color={colors.textOnAccent} strokeWidth={2.5} />
        <Text style={s.actionBtnPrimaryText}>{isFree ? 'Join' : `Join · £${event.price_from ?? ''}`}</Text>
      </TouchableOpacity>
    );
  };

  const friends = friendsAttending ?? [];

  return (
    <TouchableOpacity style={[s.card, isJoined && s.cardJoined]} onPress={openDetails} activeOpacity={0.85}>
      {event.banner_image_url ? (
        <View style={s.banner}>
          <Image source={{ uri: event.banner_image_url }} style={s.bannerImage} resizeMode="cover" />
          {/* Scrim so the badges stay legible over any image. */}
          <LinearGradient colors={theme.gradient.imageScrim} style={StyleSheet.absoluteFill} />
          <View style={s.bannerTopLeft}>
            <AC_ClassificationBadge classification={getClassification(event)} />
          </View>
          <View style={s.bannerTopRight}>
            <CostBadge price={isFree ? 0 : event.price_from} currency={event.currency} variant="solid" />
          </View>
        </View>
      ) : null}

      <View style={s.body}>
        {/* Without a banner the badges sit inline above the title instead. */}
        {!event.banner_image_url && (
          <View style={s.badgeRow}>
            <AC_ClassificationBadge classification={getClassification(event)} />
            <CostBadge price={isFree ? 0 : event.price_from} currency={event.currency} />
          </View>
        )}

        <Text style={s.title} numberOfLines={2}>
          {event.name}
        </Text>

        <View style={s.organiserRow}>
          <Users size={13} color={colors.accentHi} />
          <Text style={s.organiserText} numberOfLines={1}>
            {organiser}
          </Text>
        </View>

        {/* Inset info block — darker than the card so it reads as recessed. */}
        <View style={s.infoBlock}>
          <View style={s.infoRow}>
            <Clock size={13} color={colors.accentHi} />
            <Text style={s.infoTextStrong} numberOfLines={1}>
              {timeLabel}
            </Text>
          </View>
          {event.address ? (
            <View style={s.infoRow}>
              <MapPin size={13} color={colors.successTone.solid} />
              <Text style={s.infoText} numberOfLines={1}>
                {event.address}
              </Text>
            </View>
          ) : null}
        </View>

        {friends.length > 0 && (
          <View style={s.friendsRow}>
            <Text style={s.friendsLabel}>Friends attending:</Text>
            <AvatarStack avatars={friends} size={20} max={4} />
          </View>
        )}
        {friends.length === 0 && !!friendsAttendingCount && friendsAttendingCount > 0 && (
          <View style={s.friendsRow}>
            <Text style={s.friendsLabel}>
              {friendsAttendingCount} friend{friendsAttendingCount > 1 ? 's' : ''} going
            </Text>
          </View>
        )}

        <View style={s.footer}>
          <Text
            style={[
              s.availability,
              placesRemaining !== null && placesRemaining <= LOW_AVAILABILITY && s.availabilityLow,
              placesRemaining === null && s.availabilityOpen,
            ]}
            numberOfLines={1}
          >
            {placesRemaining === null
              ? 'Open spots'
              : placesRemaining > 0
              ? `${placesRemaining} places remaining`
              : 'Fully booked'}
          </Text>

          <View style={s.actions}>
            <TouchableOpacity style={[s.actionBtn, s.actionBtnNeutral]} onPress={openDetails}>
              <Text style={s.actionBtnNeutralText}>View details</Text>
            </TouchableOpacity>
            {renderJoinButton()}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.hero,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginBottom: t.spacing.md,
      overflow: 'hidden',
      ...t.shadow.md,
    },
    cardJoined: {
      borderColor: t.colors.accent,
    },
    banner: {
      height: 140,
      width: '100%',
      backgroundColor: t.colors.surfaceInset,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    bannerTopLeft: {
      position: 'absolute',
      top: t.spacing.md,
      left: t.spacing.md,
    },
    bannerTopRight: {
      position: 'absolute',
      top: t.spacing.md,
      right: t.spacing.md,
    },
    body: {
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    title: {
      ...t.typography.cardTitle,
      fontSize: 16,
    },
    organiserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    organiserText: {
      ...t.typography.caption,
      fontFamily: t.typography.bodyStrong.fontFamily,
      color: t.colors.accentHi,
      flex: 1,
    },
    infoBlock: {
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.sm + 2,
      gap: 6,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    infoTextStrong: {
      ...t.typography.caption,
      fontFamily: t.typography.cardTitle.fontFamily,
      color: t.colors.textPrimary,
      flex: 1,
    },
    infoText: {
      ...t.typography.caption,
      color: t.colors.textBody,
      flex: 1,
    },
    friendsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingTop: t.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    friendsLabel: {
      ...t.typography.caption,
      fontSize: 11,
      color: t.colors.textMuted,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
      paddingTop: t.spacing.md,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    availability: {
      ...t.typography.caption,
      color: t.colors.textBody,
      flexShrink: 1,
    },
    availabilityLow: {
      color: t.colors.warningTone.text,
    },
    availabilityOpen: {
      color: t.colors.accentText,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    actionBtnPrimary: {
      backgroundColor: t.colors.accent,
      ...t.shadow.sm,
    },
    actionBtnPrimaryText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.textOnAccent,
    },
    actionBtnNeutral: {
      backgroundColor: t.colors.surfaceAlt,
      borderColor: t.colors.borderStrong,
    },
    actionBtnNeutralText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.textPrimary,
    },
    actionBtnDisabledText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.textFaint,
    },
    actionBtnJoined: {
      backgroundColor: t.colors.accentTone.bg,
      borderColor: t.colors.accentTone.border,
    },
    actionBtnJoinedText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.accentText,
    },
  });
