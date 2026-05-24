import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFriends } from '@/hooks/friends/useFriends';
import { useEventFriends } from '@/hooks/friends/useEventFriends';
import { useEventInvitees } from '@/hooks/friends/useEventInvitees';
import { useInviteFriendToEvent } from '@/hooks/friends/useInviteFriendToEvent';
import { FriendProfile } from '@/types/friends';

interface Props {
  visible: boolean;
  eventId: string;
  onClose: () => void;
}

export function InviteFriendsModal({ visible, eventId, onClose }: Props) {
  const { friends, loading: friendsLoading } = useFriends();
  const { friends: attending } = useEventFriends(eventId);
  const { inviteeIds } = useEventInvitees(eventId);
  const { invite, loading: inviting } = useInviteFriendToEvent();

  const attendingIds = new Set(attending.map((f) => f.id));

  const handleInvite = (friend: FriendProfile) => {
    invite(
      { eventId, invitedUserId: friend.id },
      {
        onSuccess: () =>
          Alert.alert('Invite sent', `${friend.first_name ?? 'Friend'} has been invited!`),
        onError: (err) =>
          Alert.alert('Could not invite', err.message),
      },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Invite Friends</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <AntDesign name="close" size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {friendsLoading ? (
            <ActivityIndicator color="#FF6B35" style={s.loader} />
          ) : friends.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>You have no friends to invite yet.</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const f = item.friend;
                const isAttending = attendingIds.has(f.id);
                const isInvited = inviteeIds.has(f.id);

                return (
                  <View style={s.row}>
                    {f.photo_url ? (
                      <Image source={{ uri: f.photo_url }} style={s.avatar} />
                    ) : (
                      <View style={[s.avatar, s.avatarFallback]}>
                        <Text style={s.avatarInitial}>
                          {(f.first_name ?? '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={s.nameCol}>
                      <Text style={s.name}>
                        {f.first_name} {f.last_name}
                      </Text>
                      {f.course && <Text style={s.sub}>{f.course}</Text>}
                    </View>
                    {isAttending ? (
                      <View style={[s.badge, s.badgeGoing]}>
                        <Text style={s.badgeTextGoing}>Going</Text>
                      </View>
                    ) : isInvited ? (
                      <View style={[s.badge, s.badgeInvited]}>
                        <Text style={s.badgeTextInvited}>Invited</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={s.inviteBtn}
                        onPress={() => handleInvite(f)}
                        disabled={inviting}
                      >
                        <Text style={s.inviteBtnText}>Invite</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  closeBtn: { padding: 6, borderRadius: 16, backgroundColor: '#F8F9FA' },
  loader: { marginTop: 32 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15, color: '#888' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  nameCol: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  inviteBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inviteBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  badge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  badgeGoing: { backgroundColor: '#F0FDF4' },
  badgeTextGoing: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  badgeInvited: { backgroundColor: '#F3F4F6' },
  badgeTextInvited: { fontSize: 13, fontWeight: '600', color: '#888' },
});
