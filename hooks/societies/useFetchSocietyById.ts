import { useQuery } from '@tanstack/react-query';
import { getSocietyById } from '@/api/societies.api';
import { Society } from '@/types/societies';
import { qk } from '@/lib/queryKeys';

const useFetchSocietyById = (societyId: string | null | undefined) => {
  const query = useQuery<{ society: Society; memberCount: number } | null>({
    queryKey: qk.societies.detail(societyId),
    queryFn: () => getSocietyById(societyId!),
    enabled: !!societyId,
  });

  return {
    society: query.data?.society ?? null,
    memberCount: query.data?.memberCount ?? 0,
    loading: !!societyId && query.isPending,
    fetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useFetchSocietyById;
