import { useQuery } from '@tanstack/react-query';
import { getSocietiesByUniversityId, SocietyWithCount } from '@/api/societies.api';

const useFetchSocietiesByUniId = (universityId: string | null | undefined) => {
  const { data, error, isLoading, isFetching, isError, refetch } = useQuery<SocietyWithCount[]>({
    queryKey: ['societies', universityId],
    queryFn: () => getSocietiesByUniversityId(universityId!),
    enabled: !!universityId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    societies: data ?? [],
    error,
    loading: isLoading,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchSocieties: refetch, // backwards-compat alias
  };
};

export default useFetchSocietiesByUniId;
