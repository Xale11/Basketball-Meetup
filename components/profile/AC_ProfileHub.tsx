import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User as UserIcon,
  Camera,
  UserPlus,
  Users,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Palette,
  LogOut,
  Pencil,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useFetchMyEvents } from '@/hooks/events/useFetchMyEvents';
import { useFetchParticipantEvents } from '@/hooks/events/useFetchParticipantEvents';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useFriends } from '@/hooks/friends/useFriends';
import { usePendingRequests } from '@/hooks/friends/usePendingRequests';
import { useReceivedEventInvites } from '@/hooks/events/useReceivedEventInvites';
import { useUpdateProfilePhoto } from '@/hooks/users/useUpdateProfilePhoto';
import { useUpdateUser } from '@/hooks/users/useUpdateUser';
import { useRefreshQueries } from '@/hooks/useRefreshQueries';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/api/supabase';
import { AC_AppHeader } from '@/components/activCampus/AC_AppHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventCard } from '@/components/events/EventCard';
import { TextInputField } from '@/components/ui/TextInputField';
import { Button } from '@/components/ui/Button';
import { Event } from '@/types/event';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/** The Interests tab needs `profile_interests`, which lands with AC-22. */
const SHOW_INTERESTS_TAB = false;

const BIO_LIMIT = 150;

type HubTab = 'activity' | 'friends' | 'interests' | 'settings';
type ActivitySubTab = 'upcoming' | 'created' | 'past';

export function AC_ProfileHub() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { user, session, logout } = useAuth();

  const [tab, setTab] = useState<HubTab>('activity');
  const [subTab, setSubTab] = useState<ActivitySubTab>('upcoming');

  const { events: myEvents, loading: myEventsLoading } = useFetchMyEvents(user?.id);
  const { events: participantEvents, loading: participantLoading } = useFetchParticipantEvents(
    user?.id,
  );
  const { memberships } = useFetchUserSocieties(user?.id);
  const { friends } = useFriends();
  const { count: requestCount } = usePendingRequests();
  const { count: inviteCount } = useReceivedEventInvites();
  const { photoUploading, handlePhotoPress } = useUpdateProfilePhoto(user?.id);
  const { updateProfile, saving } = useUpdateUser(user?.id);
  const { refreshing, onRefresh } = useRefreshQueries([
    qk.users.detail(user?.id),
    qk.events.all,
    qk.friends.all,
    qk.eventInvites.all,
    qk.societies.mine(user?.id),
  ]);

  // ── Bio / settings state ──────────────────────────────────────────────────
  // Shared by the header's inline editor and the Settings tab's editor, so a
  // change in one is reflected in the other.
  const [bio, setBio] = useState(user?.bio ?? '');
  const [editingBio, setEditingBio] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const now = Date.now();

  /** Attending, split by whether the event has finished. */
  const { upcoming, past } = useMemo(() => {
    const up: Event[] = [];
    const done: Event[] = [];
    for (const e of participantEvents) {
      (new Date(e.end_date).getTime() >= now ? up : done).push(e);
    }
    const byStart = (a: Event, b: Event) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    return { upcoming: up.sort(byStart), past: done.sort(byStart).reverse() };
  }, [participantEvents, now]);

  const SUB_TABS = [
    { key: 'upcoming' as const, label: `Upcoming (${upcoming.length})` },
    { key: 'created' as const, label: `Created (${myEvents.length})` },
    { key: 'past' as const, label: `Past (${past.length})` },
  ];

  const TABS = [
    { key: 'activity' as const, label: 'Activity' },
    { key: 'friends' as const, label: 'Friends' },
    ...(SHOW_INTERESTS_TAB ? [{ key: 'interests' as const, label: 'Interests' }] : []),
    { key: 'settings' as const, label: 'Settings' },
  ];

  const activityList =
    subTab === 'upcoming' ? upcoming : subTab === 'created' ? myEvents : past;
  const activityLoading = subTab === 'created' ? myEventsLoading : participantLoading;

  const handleSaveBio = async () => {
    try {
      await updateProfile({ bio: bio.trim() || undefined });
      setEditingBio(false);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please re-enter them.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Could not change password', error.message);
        return;
      }
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Password changed', 'Your password has been updated.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['left', 'right']}>
      <AC_AppHeader />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* ── Header card ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={theme.gradient.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.headerCard}
        >
          <TouchableOpacity
            onPress={() => handlePhotoPress(!!user?.photo_url)}
            disabled={photoUploading}
            style={s.avatarWrap}
          >
            {user?.photo_url ? (
              <Image source={{ uri: user.photo_url }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <UserIcon size={32} color={theme.colors.textMuted} />
              </View>
            )}
            <View style={s.avatarBadge}>
              {photoUploading ? (
                <ActivityIndicator size="small" color={theme.colors.textOnAccent} />
              ) : (
                <Camera size={13} color={theme.colors.textOnAccent} />
              )}
            </View>
          </TouchableOpacity>

          <View style={s.nameRow}>
            <Text style={s.name}>
              {user?.first_name} {user?.last_name}
            </Text>
            <View style={s.verifiedPill}>
              <ShieldCheck size={13} color={theme.colors.accentHi} />
              <Text style={s.verifiedText}>Verified Student</Text>
            </View>
          </View>

          {/* Degree and year of study join this line with AC-26. */}
          <Text style={s.email}>{session?.user?.email}</Text>

          {/* Student bio, editable inline. */}
          <View style={[s.bioBox, editingBio && s.bioBoxEditing]}>
            <View style={s.bioHeader}>
              <Text style={s.bioLabel}>Student Bio</Text>
              {editingBio ? (
                <Text style={s.bioCounter}>
                  {bio.length}/{BIO_LIMIT}
                </Text>
              ) : (
                <TouchableOpacity
                  style={s.bioEditBtn}
                  onPress={() => {
                    setBio(user?.bio ?? '');
                    setEditingBio(true);
                  }}
                >
                  <Pencil size={11} color={theme.colors.accentHi} />
                  <Text style={s.bioEditText}>Edit Bio</Text>
                </TouchableOpacity>
              )}
            </View>

            {editingBio ? (
              <>
                <TextInput
                  style={s.bioInput}
                  value={bio}
                  onChangeText={(t) => t.length <= BIO_LIMIT && setBio(t)}
                  placeholder="Write a short student bio..."
                  placeholderTextColor={theme.colors.textFaint}
                  multiline
                  autoFocus
                />
                <View style={s.bioActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setBio(user?.bio ?? '');
                      setEditingBio(false);
                    }}
                  >
                    <Text style={s.bioCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.bioSave}
                    onPress={handleSaveBio}
                    disabled={saving}
                  >
                    <Check size={12} color={theme.colors.textOnAccent} strokeWidth={3} />
                    <Text style={s.bioSaveText}>{saving ? 'Saving…' : 'Save Bio'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : user?.bio ? (
              <Text style={s.bioText}>“{user.bio}”</Text>
            ) : (
              <Text style={s.bioEmpty}>No bio added yet. Tap edit to introduce yourself!</Text>
            )}
          </View>

          <Text style={s.headerStats}>
            {memberships.length} Societies • {participantEvents.length} Activities Joined
          </Text>
        </LinearGradient>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsRow}
          style={s.tabsWrap}
        >
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[s.tabBtnText, tab === tb.key && s.tabBtnTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Tab 1 · My Activity ──────────────────────────────────────── */}
        {tab === 'activity' && (
          <View style={s.section}>
            <SegmentedTabs
              tabs={SUB_TABS}
              activeTab={subTab}
              onTabChange={setSubTab}
              style={s.subTabs}
            />
            {activityLoading ? (
              <ActivityIndicator color={theme.colors.accent} style={s.inlineLoader} />
            ) : activityList.length === 0 ? (
              <EmptyState
                emoji="📅"
                title={
                  subTab === 'upcoming'
                    ? 'Nothing coming up'
                    : subTab === 'created'
                    ? "You haven't hosted anything yet"
                    : 'No past activities'
                }
                subtitle={
                  subTab === 'created'
                    ? 'Create an activity and bring people together.'
                    : 'Join something from the Discover feed.'
                }
                primaryAction={{
                  label: subTab === 'created' ? 'Create an activity' : 'Browse activities',
                  onPress: () =>
                    subTab === 'created' ? router.push('/create') : router.push('/(tabs)'),
                }}
              />
            ) : (
              activityList.map((e) => <EventCard key={e.id} event={e} />)
            )}
          </View>
        )}

        {/* ── Tab 2 · Friends ──────────────────────────────────────────── */}
        {tab === 'friends' && (
          <View style={s.section}>
            <View style={s.rowActions}>
              <TouchableOpacity
                style={[s.rowAction, s.rowActionNeutral]}
                onPress={() => router.push('/friends/search')}
              >
                <UserPlus size={16} color={theme.colors.accentHi} />
                <Text style={s.rowActionText}>Find friends</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.rowAction, requestCount > 0 ? s.rowActionBadged : s.rowActionNeutral]}
                onPress={() => router.push('/friends/requests')}
              >
                <Users
                  size={16}
                  color={requestCount > 0 ? theme.colors.textOnAccent : theme.colors.accentHi}
                />
                <Text style={[s.rowActionText, requestCount > 0 && s.rowActionTextBadged]}>
                  Requests{requestCount > 0 ? ` · ${requestCount}` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.settingRow, inviteCount > 0 && s.settingRowHighlighted]}
              onPress={() => router.push('/event/invites')}
            >
              <Calendar size={18} color={theme.colors.accentHi} />
              <Text style={s.settingLabel}>Event invites</Text>
              <Text style={s.settingValue}>{inviteCount} pending</Text>
              <ChevronRight size={18} color={theme.colors.textFaint} />
            </TouchableOpacity>

            <Text style={s.sectionLabel}>Connections ({friends.length})</Text>
            {friends.length === 0 ? (
              <EmptyState
                emoji="👋"
                title="No connections yet"
                subtitle="Find people you know and send them a request."
                primaryAction={{
                  label: 'Find friends',
                  onPress: () => router.push('/friends/search'),
                }}
              />
            ) : (
              <View style={s.grid}>
                {friends.map((f) => (
                  <TouchableOpacity
                    key={f.friend.id}
                    style={s.gridItem}
                    onPress={() =>
                      router.push({ pathname: '/user/[id]', params: { id: f.friend.id } })
                    }
                  >
                    {f.friend.photo_url ? (
                      <Image source={{ uri: f.friend.photo_url }} style={s.gridAvatar} />
                    ) : (
                      <View style={[s.gridAvatar, s.avatarFallback]}>
                        <UserIcon size={20} color={theme.colors.textMuted} />
                      </View>
                    )}
                    <Text style={s.gridName} numberOfLines={1}>
                      {f.friend.first_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Tab 4 · Settings ─────────────────────────────────────────── */}
        {tab === 'settings' && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Bio</Text>
            <TextInputField
              value={bio}
              onChangeText={(t) => t.length <= BIO_LIMIT && setBio(t)}
              placeholder="Tell people a bit about you..."
              multiline
              numberOfLines={3}
              multilineHeight={90}
            />
            <Text style={s.counter}>
              {bio.length}/{BIO_LIMIT}
            </Text>
            <Button
              label={saving ? 'Saving…' : 'Save bio'}
              onPress={handleSaveBio}
              disabled={saving}
            />

            <Text style={s.sectionLabel}>Account</Text>
            <View style={s.settingRow}>
              <ShieldCheck size={18} color={theme.colors.successTone.solid} />
              <Text style={s.settingLabel}>Email</Text>
              <Text style={s.settingValue} numberOfLines={1}>
                {session?.user?.email_confirmed_at ? 'Verified' : 'Unverified'}
              </Text>
            </View>

            <View style={s.settingRow}>
              <Text style={s.settingLabel}>Push notifications</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: theme.colors.surfaceAlt, true: theme.colors.accent }}
                thumbColor={theme.colors.textPrimary}
              />
            </View>

            <View style={s.settingRow}>
              <Palette size={18} color={theme.colors.textFaint} />
              <Text style={[s.settingLabel, s.settingLabelDisabled]}>Theme</Text>
              {/* Enabled by AC-27, which adds the second palette and the provider. */}
              <Text style={s.settingValue}>Dark</Text>
            </View>

            <Text style={s.sectionLabel}>Change password</Text>
            <TextInputField
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              secureTextEntry
              autoComplete="new-password"
            />
            <TextInputField
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              autoComplete="new-password"
              style={s.fieldSpacing}
            />
            <Button
              label={changingPassword ? 'Updating…' : 'Update password'}
              onPress={handleChangePassword}
              disabled={changingPassword || !password}
            />

            <TouchableOpacity style={s.logout} onPress={logout}>
              <LogOut size={18} color={theme.colors.dangerTone.text} />
              <Text style={s.logoutText}>Log out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.xxl * 3,
    },
    // Gradient banner card, matching the Societies hero treatment.
    headerCard: {
      alignItems: 'center',
      gap: t.spacing.sm,
      padding: t.spacing.xl,
      marginTop: t.spacing.lg,
      marginBottom: t.spacing.lg,
      borderRadius: t.radius.hero,
      borderWidth: 1,
      borderColor: t.colors.chromeBorder,
      ...t.shadow.lg,
    },
    avatarWrap: { marginBottom: t.spacing.sm },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2,
      borderColor: t.colors.accent,
    },
    avatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
      borderWidth: 2,
      borderColor: t.colors.canvas,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: t.spacing.sm,
    },
    name: { ...t.typography.h2, color: t.colors.textPrimary },
    verifiedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm + 2,
      paddingVertical: 2,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    verifiedText: { ...t.typography.badge, fontSize: 11, color: t.colors.accentTone.text },
    email: { ...t.typography.caption, color: t.colors.textBody },

    // Student bio box — reads as recessed inside the gradient card.
    bioBox: {
      alignSelf: 'stretch',
      padding: t.spacing.md,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surfaceInset,
      borderWidth: 1,
      borderColor: t.colors.border,
      gap: 6,
    },
    bioBoxEditing: { borderColor: t.colors.accent },
    bioHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bioLabel: { ...t.typography.microLabel, fontSize: 10, color: t.colors.textMuted },
    bioCounter: { ...t.typography.caption, fontSize: 10, color: t.colors.textFaint },
    bioEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 2,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    bioEditText: { ...t.typography.badge, fontSize: 11, color: t.colors.accentText },
    bioText: {
      ...t.typography.caption,
      color: t.colors.textBody,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    bioEmpty: { ...t.typography.caption, color: t.colors.textFaint },
    bioInput: {
      ...t.typography.caption,
      color: t.colors.textPrimary,
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
      padding: t.spacing.sm + 2,
      minHeight: 64,
      textAlignVertical: 'top',
    },
    bioActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: t.spacing.md,
    },
    bioCancel: { ...t.typography.badge, fontSize: 11, color: t.colors.textMuted },
    bioSave: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 5,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.accent,
    },
    bioSaveText: { ...t.typography.badge, fontSize: 11, color: t.colors.textOnAccent },

    headerStats: { ...t.typography.badge, fontSize: 12, color: t.colors.accentText },

    // Scrolling pill tabs with a divider beneath, per the reference.
    tabsWrap: {
      flexGrow: 0,
      marginBottom: t.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    tabsRow: { flexDirection: 'row', gap: 6, paddingBottom: t.spacing.md },
    tabBtn: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.chip,
    },
    tabBtnActive: { backgroundColor: t.colors.accent },
    tabBtnText: { ...t.typography.badge, fontSize: 13, color: t.colors.textMuted },
    tabBtnTextActive: { color: t.colors.textOnAccent },
    subTabs: { marginBottom: t.spacing.md },
    section: { gap: t.spacing.sm },
    sectionLabel: {
      ...t.typography.microLabel,
      color: t.colors.textMuted,
      marginTop: t.spacing.md,
    },
    inlineLoader: { marginVertical: t.spacing.xl },
    rowActions: { flexDirection: 'row', gap: t.spacing.sm },
    rowAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.chip,
      borderWidth: 1,
    },
    rowActionNeutral: {
      backgroundColor: t.colors.surface,
      borderColor: t.colors.border,
    },
    rowActionBadged: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
    rowActionText: { ...t.typography.badge, fontSize: 12, color: t.colors.textPrimary },
    rowActionTextBadged: { color: t.colors.textOnAccent },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    settingRowHighlighted: { borderColor: t.colors.accentTone.border },
    settingLabel: { ...t.typography.bodyStrong, color: t.colors.textPrimary, flex: 1 },
    settingLabelDisabled: { color: t.colors.textFaint },
    settingValue: { ...t.typography.caption, color: t.colors.textMuted },
    counter: {
      ...t.typography.caption,
      fontSize: 11,
      color: t.colors.textFaint,
      textAlign: 'right',
    },
    fieldSpacing: { marginTop: t.spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    gridItem: { width: 72, alignItems: 'center', gap: 4 },
    gridAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
    },
    gridName: { ...t.typography.caption, fontSize: 11, color: t.colors.textBody },
    logout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: t.spacing.xl,
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.dangerTone.bg,
      borderWidth: 1,
      borderColor: t.colors.dangerTone.border,
    },
    logoutText: { ...t.typography.badge, fontSize: 13, color: t.colors.dangerTone.text },
  });
