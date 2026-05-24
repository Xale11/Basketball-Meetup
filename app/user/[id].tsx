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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, UserPlus, UserCheck, UserX, Clock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/api/users.api';
import { useFriendship } from '@/hooks/friends/useFriendship';
import { useSendFriendRequest } from '@/hooks/friends/useSendFriendRequest';
import { useRespondFriendRequest } from '@/hooks/friends/useRespondFriendRequest';
import { useRemoveFriend } from '@/hooks/friends/useRemoveFriend';
import { useAuth } from '@/hooks/useAuth';
import { FriendshipStatus } from '@/types/friends';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: () => getUserById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const { friendship, loading: friendshipLoading } = useFriendship(id);
  const { sendRequest, loading: sending } = useSendFriendRequest();
  const { respond, loading: responding } = useRespondFriendRequest();
  const { removeFriend, loading: removing } = useRemoveFriend();

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
            <ArrowLeft size={22} color="#1A1A1A" />
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
    if (actionBusy) return <ActivityIndicator color="#FF6B35" style={s.actionLoader} />;

    if (isFriends) {
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnGreen]} onPress={handleRemove}>
          <UserCheck size={18} color="#FFFFFF" />
          <Text style={s.actionBtnText}>Friends — Remove</Text>
        </TouchableOpacity>
      );
    }

    if (isSentByMe) {
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnGrey]} onPress={handleCancelRequest}>
          <Clock size={18} color="#555" />
          <Text style={[s.actionBtnText, s.actionBtnTextDark]}>Request Sent — Cancel</Text>
        </TouchableOpacity>
      );
    }

    if (isReceivedByMe) {
      return (
        <View style={s.respondRow}>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnGreen, { flex: 1 }]} onPress={handleAccept}>
            <UserCheck size={18} color="#FFFFFF" />
            <Text style={s.actionBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnRed, { flex: 1 }]} onPress={handleDecline}>
            <UserX size={18} color="#FFFFFF" />
            <Text style={s.actionBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity style={s.actionBtn} onPress={handleAddFriend}>
        <UserPlus size={18} color="#FFFFFF" />
        <Text style={s.actionBtnText}>Add Friend</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <User size={44} color="#9CA3AF" />
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#666' },
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
  body: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarFallback: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  course: { fontSize: 15, color: '#666' },
  actionSection: { marginBottom: 24 },
  actionLoader: { alignSelf: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  actionBtnTextDark: { color: '#555' },
  actionBtnGreen: { backgroundColor: '#16A34A' },
  actionBtnRed: { backgroundColor: '#DC2626' },
  actionBtnGrey: { backgroundColor: '#E5E7EB' },
  respondRow: { flexDirection: 'row', gap: 12 },
  bioSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bioTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  bio: { fontSize: 15, color: '#444', lineHeight: 22 },
});
