import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, UserCheck, UserX, User } from 'lucide-react-native';
import { usePendingRequests } from '@/hooks/friends/usePendingRequests';
import { useRespondFriendRequest } from '@/hooks/friends/useRespondFriendRequest';
import { FriendshipStatus, FriendshipWithRequester } from '@/types/friends';

export default function FriendRequestsScreen() {
  const { requests, loading } = usePendingRequests();
  const { respond, loading: responding } = useRespondFriendRequest();

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
              <User size={20} color="#9CA3AF" />
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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <UserCheck size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, s.btnDecline]}
            disabled={responding}
            onPress={() =>
              respond({ friendshipId: item.id, status: FriendshipStatus.DECLINED })
            }
          >
            <UserX size={18} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Friend Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#FF6B35" /></View>
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
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  sub: { fontSize: 13, color: '#888' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAccept: { backgroundColor: '#16A34A' },
  btnDecline: { backgroundColor: '#F3F4F6' },
});
