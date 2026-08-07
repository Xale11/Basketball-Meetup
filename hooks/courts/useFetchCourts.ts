import { useQuery } from '@tanstack/react-query';
import { fetchCourts } from '@/api/courts.api';
import { Court } from '@/types/courts';
import { qk } from '@/lib/queryKeys';

export const useFetchCourts = () => {
  const query = useQuery<Court[], Error>({
    queryKey: qk.courts.list(),
    queryFn: fetchCourts,
  });

  return {
    ...query,
    loading: query.isPending,
    fetching: query.isFetching,
    courts: query.data ?? [],
    refetchCourts: query.refetch,
  };
};
