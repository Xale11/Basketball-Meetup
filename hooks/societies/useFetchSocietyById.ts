import { useQuery } from '@tanstack/react-query';
import { getSocietyById } from '@/api/societies.api';
import { Society } from '@/types/societies';

const useFetchSocietyById = (societyId: string | null | undefined) => {
  const { data, error, isLoading, isError, refetch } = useQuery<{
    society: Society;
    memberCount: number;
  } | null>({
    queryKey: ['society', societyId],
    queryFn: () => getSocietyById(societyId!),
    enabled: !!societyId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    society: data?.society ?? null,
    memberCount: data?.memberCount ?? 0,
    loading: isLoading,
    isError,
    error,
    refetch,
  };
};

export default useFetchSocietyById;
