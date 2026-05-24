import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FriendProfile } from '@/types/friends';
import { Users } from 'lucide-react-native';

interface Props {
  friends: FriendProfile[];
  maxVisible?: number;
}

const MAX_DEFAULT = 3;

export function FriendsAttending({ friends, maxVisible = MAX_DEFAULT }: Props) {
  if (friends.length === 0) return null;

  const visible = friends.slice(0, maxVisible);
  const overflow = friends.length - maxVisible;

  return (
    <View style={s.container}>
      <View style={s.titleRow}>
        <Users size={16} color="#FF6B35" />
        <Text style={s.title}>Friends Going</Text>
      </View>

      <View style={s.row}>
        {visible.map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: f.id } })}
          >
            {f.photo_url ? (
              <Image source={{ uri: f.photo_url }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>
                  {(f.first_name ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {overflow > 0 && (
          <View style={[s.avatar, s.overflowBadge]}>
            <Text style={s.overflowText}>+{overflow}</Text>
          </View>
        )}

        <Text style={s.label}>
          {visible.map((f) => f.first_name ?? 'Someone').join(', ')}
          {overflow > 0 ? ` +${overflow} more` : ''}
          {friends.length === 1 ? ' is going' : ' are going'}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFF4EE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#FF6B35' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: -8,
  },
  avatarFallback: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  overflowBadge: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  overflowText: { fontSize: 11, fontWeight: '700', color: '#555' },
  label: { fontSize: 13, color: '#444', marginLeft: 16, flex: 1, flexWrap: 'wrap' },
});
