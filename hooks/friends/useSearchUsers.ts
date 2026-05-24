import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/api/friends.api';
import { useAuth } from '@/hooks/useAuth';

export const useSearchUsers = (query: string) => {
  const { user } = useAuth();

  const result = useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => searchUsers(query, user?.id ?? ''),
    enabled: !!user?.id && query.trim().length > 0,
    staleTime: 1000 * 30, // 30 s — search results can go stale quickly
    refetchOnWindowFocus: false,
  });

  return {
    results: result.data ?? [],
    loading: result.isPending,
    error: result.error,
  };
};
