import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

interface Props {
  visible: boolean;
  eventId: string;
  onClose: () => void;
}

export function InviteFriendsModal({ visible, eventId, onClose }: Props) {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
        <TouchableWithoutFeedback>
          <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Invite Friends</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <AntDesign name="close" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {friendsLoading ? (
            <ActivityIndicator color={theme.colors.accent} style={s.loader} />
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
        </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: t.colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius.hero,
      borderTopRightRadius: t.radius.hero,
      borderTopWidth: 1,
      borderColor: t.colors.chromeBorder,
      padding: t.spacing.lg,
      paddingBottom: t.spacing.xxl,
      maxHeight: '70%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: t.spacing.lg,
    },
    title: { ...t.typography.h2, color: t.colors.textPrimary },
    closeBtn: {
      padding: 6,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    loader: { marginTop: t.spacing.xxl },
    empty: { alignItems: 'center', paddingVertical: t.spacing.xxl },
    emptyText: { ...t.typography.body, color: t.colors.textMuted },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: t.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      gap: t.spacing.md,
    },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarFallback: {
      backgroundColor: t.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: { ...t.typography.h3, fontSize: 15, color: t.colors.textOnAccent },
    nameCol: { flex: 1 },
    name: { ...t.typography.bodyStrong, fontSize: 15, color: t.colors.textPrimary },
    sub: { ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 },
    inviteBtn: {
      backgroundColor: t.colors.accent,
      borderRadius: t.radius.chip,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
    },
    inviteBtnText: { ...t.typography.button, fontSize: 13, color: t.colors.textOnAccent },
    badge: {
      borderRadius: t.radius.chip,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 6,
      borderWidth: 1,
    },
    badgeGoing: {
      backgroundColor: t.colors.successTone.bg,
      borderColor: t.colors.successTone.border,
    },
    badgeTextGoing: { ...t.typography.badge, fontSize: 12, color: t.colors.successTone.text },
    badgeInvited: {
      backgroundColor: t.colors.neutralTone.bg,
      borderColor: t.colors.neutralTone.border,
    },
    badgeTextInvited: { ...t.typography.badge, fontSize: 12, color: t.colors.neutralTone.text },
  });
