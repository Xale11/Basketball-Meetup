import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Users,
  Pencil,
  Crown,
  ShieldCheck,
  Megaphone,
  Award,
  ChevronRight,
  Plus,
  CheckCircle2,
  UserCheck,
  UserMinus,
  Trash2,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFetchSocietyById } from '@/hooks/societies/useFetchSocietyById';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useJoinSociety } from '@/hooks/societies/useJoinSociety';
import { useLeaveSociety } from '@/hooks/societies/useLeaveSociety';
import { useUpdateSociety } from '@/hooks/societies/useUpdateSociety';
import { useSocietyMembers, useUpdateMemberRole } from '@/hooks/societies/useSocietyMembers';
import {
  useSocietyAnnouncements,
  useManageSocietyAnnouncements,
} from '@/hooks/societies/useSocietyAnnouncements';
import { useFetchEventsBySociety } from '@/hooks/events/useFetchEventsBySociety';
import { useFetchUniversities } from '@/hooks/universities/useFetchUniversities';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { ImagePicker } from '@/components/ImagePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { bannerGradientFor, roleLabelFor } from '@/components/societies/AC_SocietyCard';
import { SocietyMemberWithProfile } from '@/api/societies.api';
import { SOCIETY_CATEGORIES, SocietyRoleIdEnum, ADMIN_SOCIETY_ROLES } from '@/types/societies';
import { EventHostType } from '@/types/event';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

type SocietyTab = 'activities' | 'overview' | 'announcements' | 'members' | 'executive';
type ActivityFilter = 'all' | 'exec' | 'associate';

/**
 * `ADMIN_SOCIETY_ROLES` is a `readonly [OWNER, PRESIDENT, EXEC]` tuple, so
 * `.includes()` rejects the wider enum. Widening here keeps the call sites
 * readable and the constant as the single source of truth.
 */
const isAdminRole = (roleId?: SocietyRoleIdEnum | string | null): boolean =>
  !!roleId && (ADMIN_SOCIETY_ROLES as readonly string[]).includes(roleId);

/** Anyone with a role above plain MEMBER appears under Leadership. */
const isLeadershipRole = (roleId?: SocietyRoleIdEnum | string | null): boolean =>
  isAdminRole(roleId) || roleId === SocietyRoleIdEnum.MODERATOR;

const memberName = (m: SocietyMemberWithProfile) =>
  [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(' ') || 'Member';

const SOCIETY_TABS: SocietyTab[] = [
  'activities',
  'overview',
  'announcements',
  'members',
  'executive',
];

export default function SocietyProfileScreen() {
  // `tab` lets callers deep-link a specific tab — the society cards' "View
  // activities" action arrives here rather than filtering the list behind it.
  const { id, tab: requestedTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { colors } = theme;

  const { society, memberCount, loading: societyLoading } = useFetchSocietyById(id);
  const { memberships } = useFetchUserSocieties(user?.id);
  const { events, loading: eventsLoading } = useFetchEventsBySociety(id);
  const { members, loading: membersLoading } = useSocietyMembers(id);
  const { participationMap } = useUserParticipations(user?.id);
  const { universities } = useFetchUniversities();

  const { joinSociety, loading: joining } = useJoinSociety();
  const { leaveSociety, loading: leaving } = useLeaveSociety();
  const { updateSociety, loading: updating } = useUpdateSociety();
  const { updateRole, loading: rolePending } = useUpdateMemberRole(id);
  const { announcements, loading: announcementsLoading } = useSocietyAnnouncements(id);
  const { postAnnouncement, removeAnnouncement, posting } = useManageSocietyAnnouncements(id);

  const [tab, setTab] = useState<SocietyTab>(() =>
    SOCIETY_TABS.includes(requestedTab as SocietyTab)
      ? (requestedTab as SocietyTab)
      : 'activities',
  );
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  // ── Membership / permissions ──────────────────────────────────────────────
  const userMembership = useMemo(
    () => memberships.find((m) => m.society_id === id) ?? null,
    [memberships, id],
  );
  const isMember = !!userMembership;
  const isAdmin = isAdminRole(userMembership?.role_id);
  const viewerRole = roleLabelFor(userMembership?.role_id);

  /**
   * Executive is admin-only, but a deep link can still request it and `isAdmin`
   * only settles once memberships load. Falling back here keeps the tab bar and
   * the body in agreement instead of showing a selected tab with nothing under it.
   */
  const activeTab: SocietyTab = tab === 'executive' && !isAdmin ? 'activities' : tab;

  const societyNameMap = useMemo(
    () => (society ? new Map([[society.id, society.name ?? '']]) : new Map<string, string>()),
    [society],
  );
  const universityNameMap = useMemo(
    () => new Map(universities.map((u) => [u.id, u.name ?? ''])),
    [universities],
  );

  // ── Member split ──────────────────────────────────────────────────────────
  const { leadership, generalMembers } = useMemo(() => {
    const lead: SocietyMemberWithProfile[] = [];
    const general: SocietyMemberWithProfile[] = [];
    for (const m of members) {
      (isLeadershipRole(m.role_id) ? lead : general).push(m);
    }
    return { leadership: lead, generalMembers: general };
  }, [members]);

  /**
   * Society activities split by who hosts them: a SOCIETY-hosted event is
   * official (Executive), a USER-hosted event carrying this society's id is
   * member-led (Associate). Same derivation as the feed's organiser filter.
   */
  const filteredEvents = useMemo(() => {
    if (activityFilter === 'all') return events;
    const wanted =
      activityFilter === 'exec' ? EventHostType.SOCIETY : EventHostType.USER;
    return events.filter((e) => e.host_type === wanted);
  }, [events, activityFilter]);

  // ── Announcement composer (leadership only) ───────────────────────────────
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImportant, setAnnImportant] = useState(false);

  const resetAnnForm = () => {
    setShowAnnForm(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnImportant(false);
  };

  const handlePostAnnouncement = () => {
    if (!annTitle.trim() || !annContent.trim()) {
      Alert.alert('Validation', 'Give the announcement a title and a message.');
      return;
    }
    postAnnouncement(
      { title: annTitle.trim(), content: annContent.trim(), isImportant: annImportant },
      {
        onSuccess: resetAnnForm,
        onError: (err: Error) => Alert.alert('Could not post', err.message),
      },
    );
  };

  const handleDeleteAnnouncement = (announcementId: string, title: string) => {
    Alert.alert('Delete announcement', `Remove “${title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          removeAnnouncement(
            { id: announcementId },
            { onError: (err: Error) => Alert.alert('Could not delete', err.message) },
          ),
      },
    ]);
  };

  // ── Edit society modal ────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editLogoUri, setEditLogoUri] = useState<string | undefined>(undefined);
  const [editBannerUri, setEditBannerUri] = useState<string | undefined>(undefined);

  const openEdit = () => {
    setEditName(society?.name ?? '');
    setEditDescription(society?.description ?? '');
    setEditCategory(society?.category ?? null);
    setEditLogoUri(undefined);
    setEditBannerUri(undefined);
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Society name cannot be empty');
      return;
    }
    if (!id) return;
    updateSociety(
      {
        id,
        name: editName,
        description: editDescription,
        category: editCategory,
        logoUri: editLogoUri,
        bannerUri: editBannerUri,
      },
      {
        onSuccess: () => setShowEdit(false),
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  const handleJoin = () => {
    joinSociety(
      { societyId: id },
      {
        onSuccess: () => Alert.alert('Joined!', `Welcome to ${society?.name ?? 'the society'}`),
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  const handleLeave = () => {
    Alert.alert('Leave society', `Are you sure you want to leave ${society?.name ?? 'this society'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () =>
          leaveSociety({ societyId: id }, { onError: (err) => Alert.alert('Error', err.message) }),
      },
    ]);
  };

  /** Promote a member to Committee, or demote them back. RLS is the real gate. */
  const handleRoleChange = (m: SocietyMemberWithProfile, promote: boolean) => {
    const name = memberName(m);
    Alert.alert(
      promote ? 'Promote to committee' : 'Remove from committee',
      promote
        ? `Give ${name} committee privileges for this society?`
        : `Return ${name} to a general member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: promote ? 'Promote' : 'Demote',
          style: promote ? 'default' : 'destructive',
          onPress: () =>
            updateRole(
              {
                userId: m.user_id,
                roleId: promote ? SocietyRoleIdEnum.EXEC : SocietyRoleIdEnum.MEMBER,
              },
              { onError: (err: Error) => Alert.alert('Could not update role', err.message) },
            ),
        },
      ],
    );
  };

  if (societyLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.plainHeader}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!society) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.plainHeader}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.centred}>
          <Text style={s.errorText}>Society not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const actionLoading = joining || leaving;

  const TABS: { key: SocietyTab; label: string }[] = [
    { key: 'activities', label: 'Activities' },
    { key: 'overview', label: 'Overview' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'members', label: `Members (${members.length || memberCount})` },
    ...(isAdmin ? [{ key: 'executive' as const, label: 'Executive' }] : []),
  ];

  const renderMemberRow = (m: SocietyMemberWithProfile, showAdminControls: boolean) => {
    const label = roleLabelFor(m.role_id);
    const isLead = isLeadershipRole(m.role_id);
    const tone = isLead ? colors.warningTone : colors.neutralTone;
    const isOwner = m.role_id === SocietyRoleIdEnum.OWNER;
    const isSelf = m.user_id === user?.id;

    return (
      <View key={m.user_id} style={s.memberRow}>
        {m.profiles?.photo_url ? (
          <Image source={{ uri: m.profiles.photo_url }} style={s.memberAvatar} />
        ) : (
          <View style={[s.memberAvatar, s.memberAvatarFallback]}>
            <Text style={s.memberInitial}>{memberName(m).charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={s.memberText}>
          <Text style={s.memberName} numberOfLines={1}>
            {memberName(m)}
            {isSelf ? ' (you)' : ''}
          </Text>
          {m.profiles?.first_name ? null : (
            <Text style={s.memberMeta} numberOfLines={1}>
              Profile hidden
            </Text>
          )}
        </View>

        {/* Owners cannot be demoted — the RLS policy rejects it, so no button. */}
        {showAdminControls && !isOwner && !isSelf ? (
          <TouchableOpacity
            style={[s.roleAction, isLead ? s.roleActionDemote : s.roleActionPromote]}
            onPress={() => handleRoleChange(m, !isLead)}
            disabled={rolePending}
          >
            {isLead ? (
              <UserMinus size={12} color={colors.dangerTone.text} />
            ) : (
              <UserCheck size={12} color={colors.textOnAccent} />
            )}
            <Text style={[s.roleActionText, isLead && s.roleActionTextDemote]}>
              {isLead ? 'Demote' : 'Promote'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.rolePill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            {isLead && <Crown size={10} color={tone.solid} />}
            <Text style={[s.rolePillText, { color: tone.text }]}>{label ?? 'Member'}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['left', 'right']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={bannerGradientFor(society.id, theme)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.banner}
        >
          <LinearGradient colors={theme.gradient.imageScrim} style={StyleSheet.absoluteFill} />

          <SafeAreaView edges={['top']} style={s.bannerTop}>
            <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            {viewerRole && (
              <View
                style={[
                  s.viewerRolePill,
                  {
                    backgroundColor:
                      viewerRole === 'Member' ? colors.accentTone.bg : colors.warningTone.bg,
                    borderColor:
                      viewerRole === 'Member'
                        ? colors.accentTone.border
                        : colors.warningTone.border,
                  },
                ]}
              >
                <ShieldCheck
                  size={12}
                  color={viewerRole === 'Member' ? colors.accentTone.solid : colors.warningTone.solid}
                />
                <Text
                  style={[
                    s.viewerRoleText,
                    {
                      color:
                        viewerRole === 'Member'
                          ? colors.accentTone.text
                          : colors.warningTone.text,
                    },
                  ]}
                >
                  {viewerRole}
                </Text>
              </View>
            )}

            {isAdmin && (
              <TouchableOpacity style={s.editButton} onPress={openEdit}>
                <Pencil size={16} color={colors.accentHi} />
              </TouchableOpacity>
            )}
          </SafeAreaView>

          <View style={s.bannerBottom}>
            {society.logo ? (
              <Image source={{ uri: society.logo }} style={s.logo} />
            ) : (
              <View style={[s.logo, s.logoFallback]}>
                <Text style={s.logoInitial}>{(society.name ?? '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={s.bannerText}>
              <Text style={s.societyName} numberOfLines={2}>
                {society.name ?? 'Untitled society'}
              </Text>
              <Text style={s.societyMeta}>
                {[society.category, `${memberCount} members`].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Join / leave ─────────────────────────────────────────────── */}
        <View style={s.joinRow}>
          {actionLoading ? (
            <View style={[s.joinBtn, s.joinBtnBusy]}>
              <ActivityIndicator size="small" color={colors.textOnAccent} />
            </View>
          ) : isMember ? (
            <TouchableOpacity style={[s.joinBtn, s.joinBtnJoined]} onPress={handleLeave}>
              <CheckCircle2 size={16} color={colors.accentTone.text} />
              <Text style={s.joinBtnJoinedText}>Joined society</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.joinBtn, s.joinBtnPrimary]} onPress={handleJoin}>
              <Plus size={16} color={colors.textOnAccent} strokeWidth={3} />
              <Text style={s.joinBtnPrimaryText}>Join society</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsWrap}
          contentContainerStyle={s.tabsRow}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, activeTab === t.key && s.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabBtnText, activeTab === t.key && s.tabBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.body}>
          {/* ── Tab 1 · Activities ─────────────────────────────────────── */}
          {activeTab === 'activities' && (
            <>
              <SegmentedTabs
                tabs={[
                  { key: 'all' as const, label: `All (${events.length})` },
                  { key: 'exec' as const, label: 'Official' },
                  { key: 'associate' as const, label: 'Member-led' },
                ]}
                activeTab={activityFilter}
                onTabChange={setActivityFilter}
                style={s.filterTabs}
              />

              {eventsLoading ? (
                <ActivityIndicator color={colors.accent} style={s.inlineLoader} />
              ) : filteredEvents.length === 0 ? (
                <EmptyState
                  emoji="📅"
                  title="No activities yet"
                  subtitle={
                    activityFilter === 'all'
                      ? 'This society has nothing scheduled right now.'
                      : 'Nothing matches this filter — try “All”.'
                  }
                  primaryAction={
                    isAdmin
                      ? { label: 'Host an activity', onPress: () => router.push('/create') }
                      : undefined
                  }
                />
              ) : (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    societyNameMap={societyNameMap}
                    universityNameMap={universityNameMap}
                    participantStatus={participationMap.get(event.id) ?? null}
                  />
                ))
              )}
            </>
          )}

          {/* ── Tab 2 · Overview ───────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              <Text style={s.sectionLabel}>About {society.name}</Text>
              <View style={s.panel}>
                <Text style={s.panelBody}>
                  {society.description?.trim() || 'This society has not added a description yet.'}
                </Text>
              </View>

              <View style={s.sectionLabelRow}>
                <Crown size={13} color={colors.warningTone.solid} />
                <Text style={s.sectionLabel}>Executive committee ({leadership.length})</Text>
              </View>
              {membersLoading ? (
                <ActivityIndicator color={colors.accent} style={s.inlineLoader} />
              ) : leadership.length === 0 ? (
                <View style={s.panel}>
                  <Text style={s.panelMuted}>No committee members listed.</Text>
                </View>
              ) : (
                leadership.map((m) => renderMemberRow(m, false))
              )}

              <Text style={s.sectionLabel}>Society stats</Text>
              <View style={s.statsRow}>
                <View style={s.statCard}>
                  <Text style={[s.statValue, { color: colors.accentText }]}>{memberCount}</Text>
                  <Text style={s.statLabel}>Members</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statValue, { color: colors.successTone.text }]}>
                    {events.length}
                  </Text>
                  <Text style={s.statLabel}>Activities</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statValue, s.statValueSmall, { color: colors.infoTone.text }]}>
                    {society.category ?? '—'}
                  </Text>
                  <Text style={s.statLabel}>Category</Text>
                </View>
              </View>
            </>
          )}

          {/* ── Tab 3 · Announcements ──────────────────────────────────── */}
          {activeTab === 'announcements' && (
            <>
              {isAdmin && (
                <View style={s.panel}>
                  {showAnnForm ? (
                    <View style={s.annForm}>
                      <TextInputField
                        label="Title"
                        value={annTitle}
                        onChangeText={setAnnTitle}
                        placeholder="e.g. Kit orders close Friday"
                      />
                      <TextInputField
                        label="Message"
                        value={annContent}
                        onChangeText={setAnnContent}
                        placeholder="What do members need to know?"
                        multiline
                        numberOfLines={4}
                        multilineHeight={110}
                        style={s.fieldSpacing}
                      />
                      <TouchableOpacity
                        style={s.importantRow}
                        onPress={() => setAnnImportant((p) => !p)}
                        activeOpacity={0.8}
                      >
                        <View style={[s.checkbox, annImportant && s.checkboxOn]}>
                          {annImportant && (
                            <CheckCircle2 size={13} color={colors.textOnAccent} />
                          )}
                        </View>
                        <Text style={s.importantLabel}>Mark as important</Text>
                      </TouchableOpacity>

                      <View style={s.annFormActions}>
                        <TouchableOpacity onPress={resetAnnForm}>
                          <Text style={s.annCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Button
                          label={posting ? 'Posting…' : 'Post'}
                          onPress={handlePostAnnouncement}
                          disabled={posting}
                          style={s.annPostBtn}
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.annNewBtn}
                      onPress={() => setShowAnnForm(true)}
                      activeOpacity={0.85}
                    >
                      <Megaphone size={16} color={colors.accentHi} />
                      <Text style={s.annNewText}>Post an announcement</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {announcementsLoading ? (
                <ActivityIndicator color={colors.accent} style={s.inlineLoader} />
              ) : announcements.length === 0 ? (
                <EmptyState
                  emoji="📢"
                  title="No announcements yet"
                  subtitle={
                    isAdmin
                      ? 'Post one to keep members up to date.'
                      : 'This society has not posted anything yet.'
                  }
                />
              ) : (
                announcements.map((a) => {
                  const authorName =
                    [a.author?.first_name, a.author?.last_name].filter(Boolean).join(' ') ||
                    'Committee';
                  return (
                    <View
                      key={a.id}
                      style={[s.annCard, a.is_important && s.annCardImportant]}
                    >
                      <View style={s.annCardHeader}>
                        {a.is_important && (
                          <View style={s.annImportantPill}>
                            <Text style={s.annImportantPillText}>Important</Text>
                          </View>
                        )}
                        <Text style={s.annDate}>
                          {new Date(a.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                        {isAdmin && (
                          <TouchableOpacity
                            onPress={() => handleDeleteAnnouncement(a.id, a.title)}
                            hitSlop={8}
                          >
                            <Trash2 size={14} color={colors.dangerTone.text} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={s.annTitle}>{a.title}</Text>
                      <Text style={s.annBody}>{a.content}</Text>
                      <Text style={s.annAuthor}>— {authorName}</Text>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ── Tab 4 · Members ────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <>
              {membersLoading ? (
                <ActivityIndicator color={colors.accent} style={s.inlineLoader} />
              ) : members.length === 0 ? (
                <EmptyState
                  emoji="👥"
                  title="No members yet"
                  subtitle="Be the first to join this society."
                />
              ) : (
                <>
                  <View style={s.sectionLabelRow}>
                    <Crown size={13} color={colors.warningTone.solid} />
                    <Text style={s.sectionLabel}>
                      Officers &amp; committee ({leadership.length})
                    </Text>
                  </View>
                  {leadership.length === 0 ? (
                    <View style={s.panel}>
                      <Text style={s.panelMuted}>No committee members listed.</Text>
                    </View>
                  ) : (
                    leadership.map((m) => renderMemberRow(m, false))
                  )}

                  <Text style={s.sectionLabel}>General members ({generalMembers.length})</Text>
                  {generalMembers.length === 0 ? (
                    <View style={s.panel}>
                      <Text style={s.panelMuted}>No general members yet.</Text>
                    </View>
                  ) : (
                    generalMembers.map((m) => renderMemberRow(m, false))
                  )}
                </>
              )}
            </>
          )}

          {/* ── Tab 5 · Executive (admins only) ────────────────────────── */}
          {activeTab === 'executive' && isAdmin && (
            <>
              <LinearGradient
                colors={[colors.warningTone.bg, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.execBanner}
              >
                <View style={s.execBadge}>
                  <Crown size={18} color={colors.warningTone.solid} />
                </View>
                <View style={s.execBannerText}>
                  <Text style={s.execTitle}>Executive portal</Text>
                  <Text style={s.execSubtitle}>
                    Management tools for officers and committee members.
                  </Text>
                </View>
              </LinearGradient>

              <View style={s.sectionLabelRow}>
                <Award size={13} color={colors.accentHi} />
                <Text style={s.sectionLabel}>Quick actions</Text>
              </View>

              <TouchableOpacity style={s.execAction} onPress={() => router.push('/create')}>
                <Crown size={16} color={colors.warningTone.solid} />
                <View style={s.execActionText}>
                  <Text style={s.execActionTitle}>Host an official activity</Text>
                  <Text style={s.execActionSub}>Publish an event under this society</Text>
                </View>
                <ChevronRight size={16} color={colors.textFaint} />
              </TouchableOpacity>

              <TouchableOpacity style={s.execAction} onPress={openEdit}>
                <Pencil size={16} color={colors.accentHi} />
                <View style={s.execActionText}>
                  <Text style={s.execActionTitle}>Edit society profile</Text>
                  <Text style={s.execActionSub}>Name, description, category and logo</Text>
                </View>
                <ChevronRight size={16} color={colors.textFaint} />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.execAction}
                onPress={() => {
                  setShowAnnForm(true);
                  setTab('announcements');
                }}
              >
                <Megaphone size={16} color={colors.accentHi} />
                <View style={s.execActionText}>
                  <Text style={s.execActionTitle}>Post an announcement</Text>
                  <Text style={s.execActionSub}>Notify members of this society</Text>
                </View>
                <ChevronRight size={16} color={colors.textFaint} />
              </TouchableOpacity>

              <View style={s.sectionLabelRow}>
                <Users size={13} color={colors.accentHi} />
                <Text style={s.sectionLabel}>Manage members ({members.length})</Text>
              </View>
              <Text style={s.execHint}>
                Promote a member to committee, or return them to a general member. Only the
                owner and president can change roles — the database enforces it.
              </Text>

              {membersLoading ? (
                <ActivityIndicator color={colors.accent} style={s.inlineLoader} />
              ) : members.length === 0 ? (
                <View style={s.panel}>
                  <Text style={s.panelMuted}>No members to manage yet.</Text>
                </View>
              ) : (
                members.map((m) => renderMemberRow(m, true))
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Edit society modal (admins only) ───────────────────────────── */}
      <Modal
        visible={showEdit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEdit(false)}
      >
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit society</Text>
            <View style={s.modalHeaderSpacer} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={s.modalBody}
            contentContainerStyle={s.modalBodyContent}
          >
            <Text style={s.fieldLabel}>Society logo</Text>
            <ImagePicker
              selectedImage={editLogoUri ?? society.logo ?? undefined}
              onImageSelected={setEditLogoUri}
              onImageRemoved={() => setEditLogoUri(undefined)}
              placeholder="Add society logo"
            />

            <Text style={[s.fieldLabel, s.fieldSpacing]}>Banner image</Text>
            <Text style={s.fieldHint}>
              Shown behind the society name on cards and at the top of this page.
            </Text>
            <ImagePicker
              selectedImage={editBannerUri ?? society.banner_url ?? undefined}
              onImageSelected={setEditBannerUri}
              onImageRemoved={() => setEditBannerUri(undefined)}
              placeholder="Add a banner"
            />

            <TextInputField
              label="Society name *"
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Photography Society"
              style={s.fieldSpacing}
            />

            <TextInputField
              label="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="What's your society about?"
              multiline
              numberOfLines={4}
              multilineHeight={120}
              style={s.fieldSpacing}
            />

            <Text style={[s.fieldLabel, s.fieldSpacing]}>Category</Text>
            <View style={s.categoryChips}>
              {SOCIETY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, editCategory === cat && s.catChipActive]}
                  onPress={() => setEditCategory(editCategory === cat ? null : cat)}
                >
                  <Text style={[s.catChipText, editCategory === cat && s.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.modalFooter}>
            <Button label="Save changes" loading={updating} onPress={handleSaveEdit} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    scrollContent: { paddingBottom: t.spacing.xxl * 3 },
    plainHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
    },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    errorText: { ...t.typography.body, color: t.colors.textMuted },

    // ── Hero ────────────────────────────────────────────────────────────
    banner: { minHeight: 210, justifyContent: 'space-between' },
    bannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    viewerRolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
      paddingHorizontal: t.spacing.md,
      paddingVertical: 5,
      borderRadius: t.radius.pill,
      borderWidth: 1,
    },
    viewerRoleText: { ...t.typography.badge, fontSize: 10 },
    editButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    bannerBottom: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: t.spacing.md,
      padding: t.spacing.lg,
    },
    logo: {
      width: 64,
      height: 64,
      borderRadius: t.radius.card,
      borderWidth: 3,
      borderColor: t.colors.surface,
    },
    logoFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    logoInitial: { ...t.typography.h1, color: t.colors.textPrimary },
    bannerText: { flex: 1, gap: 3 },
    societyName: { ...t.typography.h2, color: t.colors.textPrimary },
    societyMeta: { ...t.typography.badge, fontSize: 11, color: t.colors.accentText },

    // ── Join row ────────────────────────────────────────────────────────
    joinRow: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.md },
    joinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    joinBtnPrimary: { backgroundColor: t.colors.accent, ...t.shadow.accentGlow },
    joinBtnPrimaryText: { ...t.typography.button, color: t.colors.textOnAccent },
    joinBtnJoined: {
      backgroundColor: t.colors.accentTone.bg,
      borderColor: t.colors.accentTone.border,
    },
    joinBtnJoinedText: { ...t.typography.button, color: t.colors.accentTone.text },
    joinBtnBusy: { backgroundColor: t.colors.accent },

    // ── Tabs ────────────────────────────────────────────────────────────
    tabsWrap: {
      flexGrow: 0,
      marginTop: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
    },
    tabBtn: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.chip,
    },
    tabBtnActive: { backgroundColor: t.colors.accent },
    tabBtnText: { ...t.typography.badge, fontSize: 12, color: t.colors.textMuted },
    tabBtnTextActive: { color: t.colors.textOnAccent },

    body: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg, gap: t.spacing.sm },
    filterTabs: { marginBottom: t.spacing.md },
    inlineLoader: { marginVertical: t.spacing.xl },

    sectionLabel: { ...t.typography.microLabel, color: t.colors.accentHi, marginTop: t.spacing.md },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: t.spacing.md,
    },

    panel: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.lg,
    },
    panelBody: { ...t.typography.body, color: t.colors.textBody },
    panelMuted: { ...t.typography.caption, color: t.colors.textMuted, fontStyle: 'italic' },

    // ── Announcements ───────────────────────────────────────────────────
    annNewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.sm,
      paddingVertical: t.spacing.sm,
    },
    annNewText: { ...t.typography.button, color: t.colors.accentText },
    annForm: { gap: t.spacing.sm },
    annFormActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: t.spacing.lg,
      marginTop: t.spacing.sm,
    },
    annCancel: { ...t.typography.button, color: t.colors.textMuted },
    annPostBtn: { paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.xl },
    importantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      marginTop: t.spacing.sm,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    importantLabel: { ...t.typography.label, color: t.colors.textBody },
    annCard: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.lg,
      gap: 6,
    },
    annCardImportant: { borderColor: t.colors.warningTone.border },
    annCardHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    annImportantPill: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 2,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.warningTone.bg,
      borderWidth: 1,
      borderColor: t.colors.warningTone.border,
    },
    annImportantPillText: {
      ...t.typography.badge,
      fontSize: 9,
      color: t.colors.warningTone.text,
    },
    annDate: { ...t.typography.caption, fontSize: 11, color: t.colors.textFaint, flex: 1 },
    annTitle: { ...t.typography.cardTitle, fontSize: 15 },
    annBody: { ...t.typography.body, color: t.colors.textBody },
    annAuthor: { ...t.typography.caption, fontSize: 11, color: t.colors.textMuted },

    // ── Stats ───────────────────────────────────────────────────────────
    statsRow: { flexDirection: 'row', gap: t.spacing.sm },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    statValue: { ...t.typography.h2 },
    statValueSmall: { fontSize: 14 },
    statLabel: { ...t.typography.microLabel, fontSize: 9, color: t.colors.textMuted },

    // ── Member rows ─────────────────────────────────────────────────────
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    memberAvatar: { width: 38, height: 38, borderRadius: 19 },
    memberAvatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    memberInitial: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    memberText: { flex: 1, gap: 1 },
    memberName: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    memberMeta: { ...t.typography.caption, fontSize: 11, color: t.colors.textFaint },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 3,
      borderRadius: t.radius.sm,
      borderWidth: 1,
    },
    rolePillText: { ...t.typography.badge, fontSize: 10 },
    roleAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 6,
      borderRadius: t.radius.sm,
      borderWidth: 1,
    },
    roleActionPromote: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    roleActionDemote: {
      backgroundColor: t.colors.dangerTone.bg,
      borderColor: t.colors.dangerTone.border,
    },
    roleActionText: { ...t.typography.badge, fontSize: 10, color: t.colors.textOnAccent },
    roleActionTextDemote: { color: t.colors.dangerTone.text },

    // ── Executive portal ────────────────────────────────────────────────
    execBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.lg,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.colors.warningTone.border,
    },
    execBadge: {
      width: 42,
      height: 42,
      borderRadius: t.radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.warningTone.bg,
      borderWidth: 1,
      borderColor: t.colors.warningTone.border,
    },
    execBannerText: { flex: 1, gap: 2 },
    execTitle: { ...t.typography.h3, color: t.colors.textPrimary },
    execSubtitle: { ...t.typography.caption, color: t.colors.textBody },
    execHint: { ...t.typography.caption, color: t.colors.textMuted, lineHeight: 17 },
    execAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    execActionDisabled: { opacity: 0.55 },
    execActionText: { flex: 1, gap: 2 },
    execActionTitle: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    execActionTitleDisabled: { color: t.colors.textFaint },
    execActionSub: { ...t.typography.caption, fontSize: 11, color: t.colors.textMuted },

    // ── Edit modal ──────────────────────────────────────────────────────
    modalContainer: { flex: 1, backgroundColor: t.colors.canvas },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    modalTitle: { ...t.typography.h3, color: t.colors.textPrimary },
    modalCancel: { ...t.typography.button, color: t.colors.accentText },
    modalHeaderSpacer: { width: 56 },
    modalBody: { flex: 1, paddingHorizontal: t.spacing.lg },
    modalBodyContent: { paddingTop: t.spacing.lg, paddingBottom: t.spacing.xxl },
    fieldLabel: { ...t.typography.label, color: t.colors.textPrimary, marginBottom: t.spacing.sm },
    fieldHint: {
      ...t.typography.caption,
      fontSize: 11,
      color: t.colors.textMuted,
      marginTop: -4,
      marginBottom: t.spacing.sm,
    },
    fieldSpacing: { marginTop: t.spacing.lg },
    categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    catChip: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    catChipActive: {
      backgroundColor: t.colors.accentTone.bg,
      borderColor: t.colors.accentTone.border,
    },
    catChipText: { ...t.typography.label, color: t.colors.textMuted },
    catChipTextActive: { color: t.colors.accentTone.text },
    modalFooter: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
  });
