import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, ShieldCheck, Calendar, ChevronRight, Users } from 'lucide-react-native';
import { Society, SocietyRoleIdEnum } from '@/types/societies';
import { Event } from '@/types/event';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/** The viewer's standing in a society, as the card displays it. */
export type SocietyRoleLabel = 'President' | 'Committee' | 'Member' | null;

export function roleLabelFor(roleId?: SocietyRoleIdEnum | string | null): SocietyRoleLabel {
  if (!roleId) return null;
  if (roleId === SocietyRoleIdEnum.OWNER || roleId === SocietyRoleIdEnum.PRESIDENT) {
    return 'President';
  }
  if (roleId === SocietyRoleIdEnum.EXEC || roleId === SocietyRoleIdEnum.MODERATOR) {
    return 'Committee';
  }
  return 'Member';
}

/**
 * Deterministic banner placeholder, used when `banner_url` is unset.
 *
 * Keyed off the society id so the same society always gets the same gradient
 * rather than one that reshuffles on every render.
 */
export function bannerGradientFor(id: string, theme: Theme): [string, string, ...string[]] {
  const tones = [
    theme.colors.accentTone,
    theme.colors.infoTone,
    theme.colors.successTone,
    theme.colors.warningTone,
    theme.colors.dangerTone,
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const tone = tones[hash % tones.length];
  return [tone.border, tone.bg];
}

interface AC_SocietyCardProps {
  society: Society;
  /** From `society_memberships`; the viewer is added client-side when joined. */
  memberCount?: number;
  /** The viewer's role, or null when they are not a member. */
  roleId?: SocietyRoleIdEnum | string | null;
  isJoined?: boolean;
  /** Soonest upcoming activity for this society, if known. */
  nextActivity?: Event | null;
  onPress?: () => void;
  onViewActivities?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  actionLoading?: boolean;
}

export function AC_SocietyCard({
  society,
  memberCount = 0,
  roleId,
  isJoined = false,
  nextActivity,
  onPress,
  onViewActivities,
  onJoin,
  onLeave,
  actionLoading = false,
}: AC_SocietyCardProps) {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { colors } = theme;

  const role = roleLabelFor(roleId);
  const isLeader = role === 'President' || role === 'Committee';
  const roleTone = isLeader ? colors.warningTone : colors.accentTone;

  const nextLabel = nextActivity
    ? `${new Date(nextActivity.start_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })} @ ${new Date(nextActivity.start_date).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={bannerGradientFor(society.id, theme)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.banner}
      >
        {/* A real banner covers the gradient; the gradient remains the fallback. */}
        {society.banner_url ? (
          <Image source={{ uri: society.banner_url }} style={StyleSheet.absoluteFill} />
        ) : null}

        {/* Scrim so the logo and name stay legible against any tone. */}
        <LinearGradient colors={theme.gradient.imageScrim} style={StyleSheet.absoluteFill} />

        <View style={s.bannerTopRight}>
          {role ? (
            <View style={[s.roleBadge, { backgroundColor: roleTone.bg, borderColor: roleTone.border }]}>
              {isLeader ? (
                <Crown size={11} color={roleTone.solid} />
              ) : (
                <ShieldCheck size={11} color={roleTone.solid} />
              )}
              <Text style={[s.roleBadgeText, { color: roleTone.text }]}>{role}</Text>
            </View>
          ) : society.category ? (
            <View style={s.categoryBadge}>
              <Text style={s.categoryBadgeText}>{society.category}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.bannerBottom}>
          {society.logo ? (
            <Image source={{ uri: society.logo }} style={s.logo} />
          ) : (
            <View style={[s.logo, s.logoFallback]}>
              <Text style={s.logoInitial}>{(society.name ?? '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.bannerText}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>
                {society.name ?? 'Untitled society'}
              </Text>
              {society.verified_official && (
                <ShieldCheck size={13} color={colors.successTone.solid} />
              )}
            </View>
            <View style={s.memberRow}>
              <Users size={11} color={colors.accentText} />
              <Text style={s.memberCount}>
                {memberCount + (isJoined ? 1 : 0)} active members
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={s.body}>
        {society.description ? (
          <Text style={s.description} numberOfLines={2}>
            {society.description}
          </Text>
        ) : null}

        <View style={s.nextBlock}>
          <View style={s.nextHeader}>
            <Calendar size={12} color={colors.accentHi} />
            <Text style={s.nextLabel}>Next activity:</Text>
          </View>
          {nextActivity ? (
            <Text style={s.nextValue} numberOfLines={1}>
              {nextActivity.name} <Text style={s.nextWhen}>({nextLabel})</Text>
            </Text>
          ) : (
            <Text style={s.nextEmpty}>No upcoming activities scheduled</Text>
          )}
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={[s.btn, s.btnNeutral]} onPress={onViewActivities}>
          <Text style={s.btnNeutralText}>View activities</Text>
        </TouchableOpacity>

        <View style={s.footerRight}>
          {isJoined ? (
            <TouchableOpacity style={[s.btn, s.btnLeave]} onPress={onLeave} disabled={actionLoading}>
              <Text style={s.btnLeaveText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.btn, s.btnJoin]} onPress={onJoin} disabled={actionLoading}>
              <Text style={s.btnJoinText}>+ Join</Text>
            </TouchableOpacity>
          )}
          <ChevronRight size={18} color={colors.textFaint} />
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
    banner: {
      height: 120,
      justifyContent: 'flex-end',
    },
    bannerTopRight: {
      position: 'absolute',
      top: t.spacing.md,
      right: t.spacing.md,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 3,
      borderRadius: t.radius.sm,
      borderWidth: 1,
    },
    roleBadgeText: {
      ...t.typography.microLabel,
      fontSize: 10,
    },
    categoryBadge: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 3,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    categoryBadgeText: {
      ...t.typography.badge,
      fontSize: 10,
      color: t.colors.textMuted,
    },
    bannerBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm + 2,
      padding: t.spacing.md,
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: t.radius.chip,
      borderWidth: 2,
      borderColor: t.colors.surface,
    },
    logoFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    logoInitial: {
      ...t.typography.h3,
      color: t.colors.textPrimary,
    },
    bannerText: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    name: {
      ...t.typography.cardTitle,
      fontSize: 14,
      flexShrink: 1,
    },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    memberCount: {
      ...t.typography.badge,
      fontSize: 10,
      color: t.colors.accentText,
    },
    body: {
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    description: {
      ...t.typography.caption,
      color: t.colors.textBody,
      lineHeight: 18,
    },
    nextBlock: {
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.sm + 2,
      gap: 3,
    },
    nextHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    nextLabel: {
      ...t.typography.microLabel,
      fontSize: 10,
      color: t.colors.accentHi,
    },
    nextValue: {
      ...t.typography.caption,
      fontFamily: t.typography.cardTitle.fontFamily,
      color: t.colors.textPrimary,
    },
    nextWhen: { color: t.colors.accentHi },
    nextEmpty: {
      ...t.typography.caption,
      color: t.colors.textMuted,
      fontStyle: 'italic',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
      padding: t.spacing.md,
      backgroundColor: t.colors.surfaceInset,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    footerRight: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    btn: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: 6,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    btnNeutral: {
      backgroundColor: t.colors.surfaceAlt,
      borderColor: t.colors.borderStrong,
    },
    btnNeutralText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.textPrimary,
    },
    btnJoin: { backgroundColor: t.colors.accent },
    btnJoinText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.textOnAccent,
    },
    btnLeave: {
      backgroundColor: t.colors.dangerTone.bg,
      borderColor: t.colors.dangerTone.border,
    },
    btnLeaveText: {
      ...t.typography.badge,
      fontSize: 12,
      color: t.colors.dangerTone.text,
    },
  });
