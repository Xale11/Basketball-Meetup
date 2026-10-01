import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedRefreshControl } from '@/components/ui/ThemedRefreshControl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, UserCheck, UserX, User } from 'lucide-react-native';
import { usePendingRequests } from '@/hooks/friends/usePendingRequests';
import { useRespondFriendRequest } from '@/hooks/friends/useRespondFriendRequest';
import { FriendshipStatus, FriendshipWithRequester } from '@/types/friends';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';
import { useRefreshQueries } from '@/hooks/useRefreshQueries';
import { qk } from '@/lib/queryKeys';

export default function FriendRequestsScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { requests, loading } = usePendingRequests();
  const { respond, loading: responding } = useRespondFriendRequest();
  const { refreshing, onRefresh } = useRefreshQueries([qk.friends.all]);

  const renderRequest = ({ item }: { item: FriendshipWithRequester }) => {
    const req = item.requester;
    return (
      <View style={s.row}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: req.id } })}
        >
          {req.photo_url ? (
            <Image source={{ uri: req.photo_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <User size={20} color={theme.colors.textMuted} />
            </View>
          )}
        </TouchableOpacity>

        <View style={s.info}>
          <Text style={s.name}>{req.first_name} {req.last_name}</Text>
          {req.course && <Text style={s.sub}>{req.course}</Text>}
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, s.btnAccept]}
            disabled={responding}
            onPress={() =>
              respond({ friendshipId: item.id, status: FriendshipStatus.ACCEPTED })
            }
          >
            {responding ? (
              <ActivityIndicator size="small" color={theme.colors.textOnAccent} />
            ) : (
              <UserCheck size={18} color={theme.colors.textOnAccent} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, s.btnDecline]}
            disabled={responding}
            onPress={() =>
              respond({ friendshipId: item.id, status: FriendshipStatus.DECLINED })
            }
          >
            <UserX size={18} color={theme.colors.textBody} />
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
        <Text style={s.headerTitle}>Friend Requests</Text>
        <View style={s.headerSpacer} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={theme.colors.accent} /></View>
      ) : requests.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>No pending requests</Text>
          <Text style={s.emptySubtitle}>Friend requests you receive will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    headerSpacer: { width: 40 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing.xxl,
    },
    emptyTitle: { ...t.typography.h3, color: t.colors.textPrimary, marginBottom: t.spacing.sm },
    emptySubtitle: { ...t.typography.body, color: t.colors.textMuted, textAlign: 'center' },
    list: { padding: t.spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      padding: t.spacing.md + 2,
      marginBottom: 10,
      gap: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      ...t.shadow.sm,
    },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarFallback: {
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    info: { flex: 1 },
    name: { ...t.typography.bodyStrong, fontSize: 15, color: t.colors.textPrimary, marginBottom: 2 },
    sub: { ...t.typography.caption, color: t.colors.textMuted },
    actions: { flexDirection: 'row', gap: t.spacing.sm },
    btn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    btnAccept: { backgroundColor: t.colors.successTone.solid },
    // Declining is the quieter action, so it stays a neutral surface rather
    // than taking the danger tone.
    btnDecline: {
      backgroundColor: t.colors.surfaceAlt,
      borderColor: t.colors.borderStrong,
    },
  });
