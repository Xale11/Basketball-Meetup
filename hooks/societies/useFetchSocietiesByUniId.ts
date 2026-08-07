import { useQuery } from '@tanstack/react-query';
import { getSocietiesByUniversityId, SocietyWithCount } from '@/api/societies.api';
import { qk } from '@/lib/queryKeys';

export const useFetchSocietiesByUniId = (universityId: string | null | undefined) => {
  const query = useQuery<SocietyWithCount[]>({
    queryKey: qk.societies.byUniversity(universityId),
    queryFn: () => getSocietiesByUniversityId(universityId!),
    enabled: !!universityId,
  });

  return {
    societies: query.data ?? [],
    error: query.error,
    loading: !!universityId && query.isPending,
    isLoading: !!universityId && query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    fetchSocieties: query.refetch, // backwards-compat alias
  };
};
