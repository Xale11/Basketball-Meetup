import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, User } from 'lucide-react-native';
import { useState } from 'react';
import { useSearchUsers } from '@/hooks/friends/useSearchUsers';
import { User as UserType } from '@/types/user';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

export default function FriendSearchScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [query, setQuery] = useState('');
  const { results, loading } = useSearchUsers(query);

  const renderUser = ({ item }: { item: UserType }) => (
    <TouchableOpacity
      style={s.row}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.id } })}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <User size={20} color={theme.colors.textMuted} />
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name}>{item.first_name} {item.last_name}</Text>
        {item.course && <Text style={s.sub}>{item.course}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Find People</Text>
        <View style={s.headerSpacer} />
      </View>

      <View style={s.searchBar}>
        <Search size={18} color={theme.colors.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.input}
          placeholder="Search by name…"
          placeholderTextColor={theme.colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={theme.colors.accent} style={s.loader} />}
      </View>

      {query.trim().length === 0 ? (
        <View style={s.hint}>
          <Text style={s.hintText}>Type a name to find students on ActivCampus.</Text>
        </View>
      ) : results.length === 0 && !loading ? (
        <View style={s.hint}>
          <Text style={s.hintText}>No users found for "{query}".</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceInset,
      marginHorizontal: t.spacing.lg,
      marginVertical: t.spacing.md,
      borderRadius: t.radius.card,
      paddingHorizontal: t.spacing.md + 2,
      paddingVertical: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
    },
    searchIcon: { marginRight: t.spacing.sm },
    input: {
      flex: 1,
      ...t.typography.body,
      fontSize: 15,
      color: t.colors.textPrimary,
    },
    loader: { marginLeft: t.spacing.sm },
    hint: { flex: 1, alignItems: 'center', paddingTop: 60 },
    hintText: { ...t.typography.body, color: t.colors.textMuted, textAlign: 'center' },
    list: { paddingHorizontal: t.spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      padding: t.spacing.md + 2,
      marginBottom: 10,
      gap: t.spacing.md + 2,
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
  });
