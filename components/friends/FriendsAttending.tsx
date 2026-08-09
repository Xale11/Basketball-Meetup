import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FriendProfile } from '@/types/friends';
import { Users } from 'lucide-react-native';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

interface Props {
  friends: FriendProfile[];
  maxVisible?: number;
}

const MAX_DEFAULT = 3;

export function FriendsAttending({ friends, maxVisible = MAX_DEFAULT }: Props) {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  if (friends.length === 0) return null;

  const visible = friends.slice(0, maxVisible);
  const overflow = friends.length - maxVisible;

  return (
    <View style={s.container}>
      <View style={s.titleRow}>
        <Users size={16} color={theme.colors.accentHi} />
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

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
      borderRadius: t.radius.card,
      padding: t.spacing.md + 2,
      marginBottom: t.spacing.lg,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    title: { ...t.typography.h3, fontSize: 14, color: t.colors.accentTone.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      // Ring in the card colour so overlapping avatars read as separate discs.
      borderColor: t.colors.surface,
      marginRight: -8,
    },
    avatarFallback: {
      backgroundColor: t.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: { ...t.typography.label, color: t.colors.textOnAccent },
    overflowBadge: {
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -8,
    },
    overflowText: { ...t.typography.badge, fontSize: 11, color: t.colors.textBody },
    label: {
      ...t.typography.caption,
      color: t.colors.textBody,
      marginLeft: t.spacing.lg,
      flex: 1,
      flexWrap: 'wrap',
    },
  });
