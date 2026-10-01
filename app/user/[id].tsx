import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedRefreshControl } from '@/components/ui/ThemedRefreshControl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, UserPlus, UserCheck, UserX, Clock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/api/users.api';
import { qk } from '@/lib/queryKeys';
import { useFriendship } from '@/hooks/friends/useFriendship';
import { useSendFriendRequest } from '@/hooks/friends/useSendFriendRequest';
import { useRespondFriendRequest } from '@/hooks/friends/useRespondFriendRequest';
import { useRemoveFriend } from '@/hooks/friends/useRemoveFriend';
import { useAuth } from '@/hooks/useAuth';
import { FriendshipStatus } from '@/types/friends';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';
import { useRefreshQueries } from '@/hooks/useRefreshQueries';

export default function UserProfileScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  // Shares a key with useFetchById so a profile edit refreshes this screen too;
  // it previously used its own `userProfile` key that nothing ever invalidated.
  const { data: profile, isPending: profileLoading } = useQuery({
    queryKey: qk.users.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });

  const { friendship, loading: friendshipLoading } = useFriendship(id);
  const { sendRequest, loading: sending } = useSendFriendRequest();
  const { respond, loading: responding } = useRespondFriendRequest();
  const { removeFriend, loading: removing } = useRemoveFriend();
  const { refreshing, onRefresh } = useRefreshQueries([qk.users.detail(id), qk.friends.all]);

  if (profileLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingWrap}><LoadingSpinner /></View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.loadingWrap}>
          <Text style={s.errorText}>User not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSelf = currentUser?.id === id;

  // Determine the relationship state
  const isFriends    = friendship?.status === FriendshipStatus.ACCEPTED;
  const isSentByMe   = friendship?.status === FriendshipStatus.PENDING && friendship.requester_id === currentUser?.id;
  const isReceivedByMe = friendship?.status === FriendshipStatus.PENDING && friendship.addressee_id === currentUser?.id;

  const actionBusy = sending || responding || removing || friendshipLoading;

  const handleAddFriend = () => {
    if (!id) return;
    sendRequest(
      { addresseeId: id },
      {
        onSuccess: () => Alert.alert('Request sent!', `Friend request sent to ${profile.first_name}.`),
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  const handleAccept = () => {
    if (!friendship) return;
    respond(
      { friendshipId: friendship.id, status: FriendshipStatus.ACCEPTED },
      { onError: (err) => Alert.alert('Error', err.message) },
    );
  };

  const handleDecline = () => {
    if (!friendship) return;
    respond(
      { friendshipId: friendship.id, status: FriendshipStatus.DECLINED },
      { onError: (err) => Alert.alert('Error', err.message) },
    );
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${profile.first_name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            removeFriend(
              { targetId: id! },
              { onError: (err) => Alert.alert('Error', err.message) },
            ),
        },
      ],
    );
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Cancel your friend request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: () =>
            removeFriend(
              { targetId: id! },
              { onError: (err) => Alert.alert('Error', err.message) },
            ),
        },
      ],
    );
  };

  const renderFriendButton = () => {
    if (isSelf) return null;
    if (actionBusy) return <ActivityIndicator color={theme.colors.accent} style={s.actionLoader} />;

    if (isFriends) {
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnGreen]} onPress={handleRemove}>
          <UserCheck size={18} color={theme.colors.textOnAccent} />
          <Text style={s.actionBtnText}>Friends — Remove</Text>
        </TouchableOpacity>
      );
    }

    if (isSentByMe) {
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnGrey]} onPress={handleCancelRequest}>
          <Clock size={18} color={theme.colors.textBody} />
          <Text style={[s.actionBtnText, s.actionBtnTextDark]}>Request Sent — Cancel</Text>
        </TouchableOpacity>
      );
    }

    if (isReceivedByMe) {
      return (
        <View style={s.respondRow}>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnGreen, s.actionBtnFlex]} onPress={handleAccept}>
            <UserCheck size={18} color={theme.colors.textOnAccent} />
            <Text style={s.actionBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnRed, s.actionBtnFlex]} onPress={handleDecline}>
            <UserX size={18} color={theme.colors.textOnAccent} />
            <Text style={s.actionBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity style={s.actionBtn} onPress={handleAddFriend}>
        <UserPlus size={18} color={theme.colors.textOnAccent} />
        <Text style={s.actionBtnText}>Add Friend</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <User size={44} color={theme.colors.textMuted} />
            </View>
          )}
          <Text style={s.name}>{profile.first_name} {profile.last_name}</Text>
          {profile.course && <Text style={s.course}>{profile.course}</Text>}
        </View>

        {/* Friend action */}
        <View style={s.actionSection}>{renderFriendButton()}</View>

        {/* Bio */}
        {profile.bio && (
          <View style={s.bioSection}>
            <Text style={s.bioTitle}>About</Text>
            <Text style={s.bio}>{profile.bio}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { ...t.typography.body, color: t.colors.textMuted },
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
    headerSpacer: { width: 40 },
    body: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.xxl,
      paddingBottom: 60,
    },
    avatarSection: { alignItems: 'center', marginBottom: t.spacing.xl },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: t.spacing.lg,
      borderWidth: 2,
      borderColor: t.colors.accent,
    },
    avatarFallback: {
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    name: { ...t.typography.h1, color: t.colors.textPrimary, marginBottom: 4 },
    course: { ...t.typography.body, color: t.colors.textMuted },
    actionSection: { marginBottom: t.spacing.xl },
    actionLoader: { alignSelf: 'center' },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.sm,
      backgroundColor: t.colors.accent,
      borderRadius: t.radius.card,
      paddingVertical: 14,
      paddingHorizontal: t.spacing.lg,
    },
    actionBtnFlex: { flex: 1 },
    actionBtnText: { ...t.typography.button, fontSize: 15, color: t.colors.textOnAccent },
    actionBtnTextDark: { color: t.colors.textBody },
    actionBtnGreen: { backgroundColor: t.colors.successTone.solid },
    actionBtnRed: { backgroundColor: t.colors.dangerTone.solid },
    // "Request sent" is a pending, cancellable state — a neutral surface, so it
    // does not compete with the primary action's accent fill.
    actionBtnGrey: { backgroundColor: t.colors.surfaceAlt },
    respondRow: { flexDirection: 'row', gap: t.spacing.md },
    bioSection: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      ...t.shadow.md,
    },
    bioTitle: { ...t.typography.h3, fontSize: 15, color: t.colors.textPrimary, marginBottom: t.spacing.sm },
    bio: { ...t.typography.body, color: t.colors.textBody, lineHeight: 22 },
  });
