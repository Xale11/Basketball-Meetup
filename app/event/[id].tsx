import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';
import { ArrowLeft, Clock, MapPin, Users, Globe, Calendar, Building2, User, UserPlus, ShieldCheck, Sparkles, Coins, Share2 } from 'lucide-react-native';
import { useFetchEvent } from '@/hooks/events/useFetchEvent';
import { useFetchSocietiesByUniId } from '@/hooks/societies/useFetchSocietiesByUniId';
import { useFetchUniversities } from '@/hooks/universities/useFetchUniversities';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { useJoinEvent } from '@/hooks/events/useJoinEvent';
import { useLeaveEvent } from '@/hooks/events/useLeaveEvent';
import { useAuth } from '@/hooks/useAuth';
import { useEventFriends } from '@/hooks/friends/useEventFriends';
import { useUserEventInvite } from '@/hooks/events/useUserEventInvite';
import { useRespondEventInvite } from '@/hooks/events/useRespondEventInvite';
import { useEventAttendees } from '@/hooks/events/useEventAttendees';
import { FriendsAttending } from '@/components/friends/FriendsAttending';
import { InviteFriendsModal } from '@/components/friends/InviteFriendsModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EventBookingMode, EventHostType, EventInviteStatus, EventJoinPolicy, EventParticipantStatus, EventVisibility } from '@/types/event';
import { useMemo, useState, type ReactNode } from 'react';

export default function EventDetailScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const detail = useThemedStyles(makeDetailStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event, participantCount, loading } = useFetchEvent(id);

  const { user } = useAuth();
  const { participationMap } = useUserParticipations(user?.id);
  const { joinEvent, loading: joining } = useJoinEvent();
  const { leaveEvent, loading: leaving } = useLeaveEvent();

  const { societies } = useFetchSocietiesByUniId(event?.university_id ?? null);
  const { universities } = useFetchUniversities();
  const { friends: eventFriends } = useEventFriends(id);
  const { invite: userInvite } = useUserEventInvite(id);
  const { respond: respondEventInvite } = useRespondEventInvite();
  const { attendees } = useEventAttendees(id);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const societyName = useMemo(() => {
    if (!event?.society_id) return null;
    return societies.find((s) => s.id === event.society_id)?.name ?? null;
  }, [societies, event?.society_id]);

  const universityName = useMemo(() => {
    if (!event?.university_id) return null;
    return universities.find((u) => u.id === event.university_id)?.name ?? null;
  }, [universities, event?.university_id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><LoadingSpinner /></View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const participantStatus = id ? (participationMap.get(id) ?? null) : null;
  const isJoined = participantStatus === EventParticipantStatus.GOING;
  const isPending = participantStatus === EventParticipantStatus.REQUESTED;
  const isInviteOnly = event.join_policy === EventJoinPolicy.INVITE_ONLY;
  const actionLoading = joining || leaving;

  const handleJoin = () => {
    joinEvent(
      { eventId: event.id, joinPolicy: event.join_policy },
      {
        onSuccess: (participant) => {
          // If user joined via an event invite, mark the invite as accepted
          if (userInvite) {
            respondEventInvite({
              inviteId: userInvite.id,
              eventId: event.id,
              status: EventInviteStatus.ACCEPTED,
            });
          }
          const msg = participant.status === EventParticipantStatus.REQUESTED
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
            leaveEvent(
              { eventId: event.id },
              { onError: (err) => Alert.alert('Error', err.message) },
            ),
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      const when = new Date(event.start_date).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const where = event.is_online ? 'Online' : event.address ?? '';
      await Share.share({
        title: event.name,
        message: [event.name, when, where].filter(Boolean).join(' · '),
      });
    } catch {
      // The user dismissing the share sheet is not an error worth surfacing.
    }
  };

  const isFree = event.booking_mode === EventBookingMode.FREE;
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const fmt = (d: Date) => {
    const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const tz = d.toLocaleTimeString('en-GB', { timeZoneName: 'short' }).split(' ').pop();
    return `${date} · ${time} (${tz})`;
  };

  const startLabel = fmt(startDate);
  const endLabel = fmt(endDate);

  const activityType = getActivityType(event.host_type, event.join_policy, event.visibility, theme);
  const organiser = getOrganiser(event.host_type, societyName, universityName, theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed back button over banner */}
      <View style={styles.backOverlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        {event.banner_image_url ? (
          <Image source={{ uri: event.banner_image_url }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Calendar size={40} color={theme.colors.textFaint} />
          </View>
        )}

        {/* Hero: classification pill, title, organiser line. */}
        <LinearGradient
          colors={theme.gradient.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hero}
        >
          <View style={[styles.typePill, activityType.style]}>
            {activityType.icon}
            <Text style={[styles.typePillText, activityType.textStyle]}>
              {activityType.label}
            </Text>
          </View>

          <Text style={styles.title}>{event.name}</Text>

          {organiser.name ? (
            <Text style={styles.organisedBy}>
              Organised by <Text style={styles.organisedByName}>{organiser.name}</Text>
            </Text>
          ) : null}
        </LinearGradient>

        <View style={styles.body}>
          {/* Stat grid: date, duration, cost. */}
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Calendar size={13} color={theme.colors.accentHi} />
                <Text style={styles.statLabel}>Date &amp; Time</Text>
              </View>
              <Text style={styles.statValue}>{startLabel}</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Clock size={13} color={theme.colors.accentHi} />
                <Text style={styles.statLabel}>Ends</Text>
              </View>
              <Text style={styles.statValue}>{endLabel}</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Coins size={13} color={theme.colors.accentHi} />
                <Text style={styles.statLabel}>Cost</Text>
              </View>
              <Text style={styles.statValue}>
                {isFree ? 'FREE' : `£${event.price_from ?? ''}`}
              </Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Users size={13} color={theme.colors.accentHi} />
                <Text style={styles.statLabel}>Attendees</Text>
              </View>
              <Text style={styles.statValue}>
                {event.max_participants != null
                  ? `${participantCount} / ${event.max_participants}`
                  : `${participantCount} joined`}
              </Text>
            </View>
          </View>

          {/* Location, with a tinted icon chip. */}
          <View style={styles.locationBox}>
            <View style={styles.locationIcon}>
              {event.is_online ? (
                <Globe size={18} color={theme.colors.accentHi} />
              ) : (
                <MapPin size={18} color={theme.colors.accentHi} />
              )}
            </View>
            <View style={styles.locationText}>
              <Text style={styles.statLabel}>Location</Text>
              <Text style={styles.locationValue}>
                {event.is_online ? 'Online event' : event.address ?? 'To be announced'}
              </Text>
            </View>
          </View>

          {/* About — always shown, with a placeholder when empty. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Activity</Text>
            <View style={styles.aboutBox}>
              <Text style={event.description ? styles.description : styles.descriptionEmpty}>
                {event.description || 'No description was added for this activity.'}
              </Text>
            </View>
          </View>

          {/* Organiser */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organiser</Text>
            <View style={styles.organiserCard}>
              <View style={styles.organiserIcon}>{organiser.icon}</View>
              <View style={styles.organiserText}>
                <Text style={styles.organiserName}>{organiser.name}</Text>
                <Text style={styles.statLabel}>
                  {event.host_type === EventHostType.USER ? 'Student hosted' : 'Verified organiser'}
                </Text>
              </View>
            </View>
          </View>

          {/* Friends attending */}
          {eventFriends.length > 0 && (
            <View style={styles.section}>
              <FriendsAttending friends={eventFriends} />
            </View>
          )}

          {/* Attendees */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Attendees ({participantCount}
              {event.max_participants != null ? ` / ${event.max_participants}` : ''})
            </Text>
            {attendees.length === 0 ? (
              <Text style={styles.descriptionEmpty}>
                No one has joined yet — be the first.
              </Text>
            ) : (
              <View style={styles.attendeeWrap}>
                {attendees.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.attendeeChip}
                    onPress={() => router.push({ pathname: '/user/[id]', params: { id: a.id } })}
                  >
                    {a.photo_url ? (
                      <Image source={{ uri: a.photo_url }} style={styles.attendeeAvatar} />
                    ) : (
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatarFallback]}>
                        <User size={11} color={theme.colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.attendeeName} numberOfLines={1}>
                      {a.first_name ?? 'Student'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Invite Friends modal */}
      {id && (
        <InviteFriendsModal
          visible={showInviteModal}
          eventId={id}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Share / Invite / Join CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare} accessibilityLabel="Share">
          <Share2 size={18} color={theme.colors.textBody} />
        </TouchableOpacity>
        {isJoined && (
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => setShowInviteModal(true)}
          >
            <UserPlus size={18} color={theme.colors.accent} />
            <Text style={styles.inviteBtnText}>Invite</Text>
          </TouchableOpacity>
        )}
        {actionLoading ? (
          <View style={[styles.joinButton, styles.joinButtonLoading]}>
            <ActivityIndicator color={theme.colors.textOnAccent} />
          </View>
        ) : isInviteOnly && !participantStatus ? (
          userInvite ? (
            <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
              <Text style={styles.joinButtonText}>Accept & Join</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.joinButton, styles.joinButtonDisabled]}>
              <Text style={styles.joinButtonText}>Invite Only</Text>
            </View>
          )
        ) : isJoined ? (
          <TouchableOpacity style={[styles.joinButton, styles.joinButtonJoined]} onPress={handleLeave}>
            <Text style={styles.joinButtonText}>Joined ✓  ·  Leave</Text>
          </TouchableOpacity>
        ) : isPending ? (
          <TouchableOpacity style={[styles.joinButton, styles.joinButtonPending]} onPress={handleLeave}>
            <Text style={[styles.joinButtonText, styles.joinButtonTextDark]}>Request Sent  ·  Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.joinButton, !isFree && styles.joinButtonPaid]} onPress={handleJoin}>
            <Text style={styles.joinButtonText}>
              {isFree ? 'Join Free' : `Join · £${event.price_from ?? ''}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  // A component, so it can resolve its own themed styles.
  const detail = useThemedStyles(makeDetailStyles);
  return (
    <View style={[detail.row, !isLast && detail.rowBorder]}>
      <View style={detail.iconWrap}>{icon}</View>
      <View style={detail.text}>
        <Text style={detail.label}>{label}</Text>
        <Text style={detail.value}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// Plain functions, so the theme is passed in rather than read from a hook.
function getActivityType(
  hostType: EventHostType,
  joinPolicy: EventJoinPolicy | null,
  visibility: EventVisibility,
  theme: Theme,
) {
  // Labels, icons and tones follow the reference's three classification pills.
  if (hostType === EventHostType.UNIVERSITY) {
    return {
      label: 'Official Society Event',
      icon: <ShieldCheck size={14} color={theme.colors.successTone.solid} />,
      style: {
        backgroundColor: theme.colors.successTone.bg,
        borderColor: theme.colors.successTone.border,
      } as const,
      textStyle: { color: theme.colors.successTone.text } as const,
    };
  }
  if (hostType === EventHostType.SOCIETY || joinPolicy === EventJoinPolicy.APPROVAL_REQUIRED || visibility === EventVisibility.SOCIETY_ONLY) {
    return {
      label: 'Society Member Run',
      icon: <Users size={14} color={theme.colors.accentTone.solid} />,
      style: {
        backgroundColor: theme.colors.accentTone.bg,
        borderColor: theme.colors.accentTone.border,
      } as const,
      textStyle: { color: theme.colors.accentTone.text } as const,
    };
  }
  return {
    label: 'Student Open Activity',
    icon: <Sparkles size={14} color={theme.colors.infoTone.solid} />,
    style: {
      backgroundColor: theme.colors.infoTone.bg,
      borderColor: theme.colors.infoTone.border,
    } as const,
    textStyle: { color: theme.colors.infoTone.text } as const,
  };
}

function getOrganiser(
  hostType: EventHostType,
  societyName: string | null,
  universityName: string | null,
  theme: Theme,
): { name: string; icon: ReactNode } {
  if (hostType === EventHostType.SOCIETY && societyName) {
    return { name: societyName, icon: <Users size={18} color={theme.colors.accent} /> };
  }
  if (hostType === EventHostType.UNIVERSITY && universityName) {
    return { name: universityName, icon: <Building2 size={18} color={theme.colors.accent} /> };
  }
  return { name: 'Student Hosted', icon: <User size={18} color={theme.colors.accent} /> };
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.canvas },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: t.colors.textMuted },
  backOverlay: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: t.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },

  // Gradient hero beneath the banner.
  hero: {
    paddingHorizontal: 20,
    paddingVertical: t.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.chromeBorder,
    gap: t.spacing.sm,
    alignItems: 'flex-start',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 5,
    borderRadius: t.radius.pill,
    borderWidth: 1,
  },
  typePillText: { ...t.typography.badge, fontSize: 12 },
  title: { ...t.typography.h1, color: t.colors.textPrimary },
  organisedBy: { ...t.typography.caption, color: t.colors.accentHi },
  organisedByName: { fontFamily: t.typography.cardTitle.fontFamily },

  // Two-up stat grid: date, ends, cost, attendees.
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
    marginBottom: t.spacing.lg,
  },
  statBox: {
    flexGrow: 1,
    flexBasis: '46%',
    padding: t.spacing.md,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    gap: 4,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { ...t.typography.caption, fontSize: 11, color: t.colors.textMuted },
  statValue: { ...t.typography.caption, fontFamily: t.typography.cardTitle.fontFamily, color: t.colors.textPrimary },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.md,
    padding: t.spacing.lg,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    marginBottom: t.spacing.lg,
  },
  locationIcon: {
    padding: 10,
    borderRadius: t.radius.chip,
    backgroundColor: t.colors.accentTone.bg,
    borderWidth: 1,
    borderColor: t.colors.accentTone.border,
  },
  locationText: { flex: 1, gap: 2 },
  locationValue: { ...t.typography.bodyStrong, color: t.colors.textPrimary },

  aboutBox: {
    padding: t.spacing.lg,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surfaceInset,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  organiserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    padding: t.spacing.md,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  },
  organiserIcon: {
    padding: 10,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: 2,
    borderColor: t.colors.accent,
  },
  organiserText: { flex: 1, gap: 2 },
  organiserName: { ...t.typography.cardTitle, fontSize: 15 },

  // Attendee pill chips.
  attendeeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  attendeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: t.spacing.md,
    paddingVertical: 4,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  },
  attendeeAvatar: { width: 22, height: 22, borderRadius: 11 },
  attendeeAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceInset,
  },
  attendeeName: { ...t.typography.caption, fontSize: 12, color: t.colors.textBody, maxWidth: 110 },

  // Secondary action in the footer (share). The footer is a column, so this
  // stretches full width — the icon needs centring explicitly, and its own
  // bottom margin to match the spacing `inviteBtn` sets below itself.
  iconBtn: {
    padding: 11,
    borderRadius: t.radius.chip,
    backgroundColor: t.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detailsCard: {
    backgroundColor: t.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: t.colors.textPrimary, marginBottom: 10 },
  description: { ...t.typography.body, color: t.colors.textBody, lineHeight: 22 },
  descriptionEmpty: { ...t.typography.body, color: t.colors.textFaint, fontStyle: 'italic' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: t.colors.surface,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  joinButton: {
    backgroundColor: t.colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonPaid: { backgroundColor: t.colors.surfaceAlt },
  joinButtonJoined: { backgroundColor: t.colors.successTone.solid },
  joinButtonPending: { backgroundColor: t.colors.surfaceAlt },
  joinButtonDisabled: { backgroundColor: t.colors.surfaceAlt },
  joinButtonLoading: { backgroundColor: t.colors.accent },
  joinButtonText: { ...t.typography.button, color: t.colors.textOnAccent },
  joinButtonTextDark: { color: t.colors.textBody },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: t.colors.warningTone.bg,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: t.colors.warningTone.border,
  },
  inviteBtnText: { fontSize: 15, fontWeight: '600', color: t.colors.accent },
});

const makeDetailStyles = (t: Theme) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  iconWrap: { marginTop: 1 },
  text: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: t.colors.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: t.colors.textPrimary, lineHeight: 22 },
});
