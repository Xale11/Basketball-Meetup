import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';
import { qk } from '@/lib/queryKeys';

export const useSearchUsers = (query: string) => {
  const { user } = useAuth();
  const enabled = !!user?.id && query.trim().length > 0;

  const result = useQuery({
    queryKey: qk.friends.search(query),
    queryFn: () => searchUsers(query, user?.id ?? ''),
    enabled,
    staleTime: 1000 * 30, // 30 s — search results can go stale quickly
  });

  return {
    results: result.data ?? [],
    loading: enabled && result.isPending,
    fetching: result.isFetching,
    error: result.error,
  };
};
