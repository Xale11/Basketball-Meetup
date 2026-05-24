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

export default function FriendSearchScreen() {
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
          <User size={20} color="#9CA3AF" />
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
          <ArrowLeft size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Find People</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.searchBar}>
        <Search size={18} color="#888" style={s.searchIcon} />
        <TextInput
          style={s.input}
          placeholder="Search by name…"
          placeholderTextColor="#AAA"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color="#FF6B35" style={s.loader} />}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  loader: { marginLeft: 8 },
  hint: { flex: 1, alignItems: 'center', paddingTop: 60 },
  hintText: { fontSize: 15, color: '#888', textAlign: 'center' },
  list: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
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
  name: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  sub: { fontSize: 13, color: '#888' },
});
