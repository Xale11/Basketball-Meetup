import { useQuery } from '@tanstack/react-query';
import { fetchEventsBySocietyId } from '@/api/events.api';
import { Event } from '@/types/event';
import { qk } from '@/lib/queryKeys';

export const useFetchEventsBySociety = (societyId: string | null | undefined) => {
  const query = useQuery<Event[]>({
    queryKey: qk.events.bySociety(societyId),
    queryFn: () => fetchEventsBySocietyId(societyId!),
    enabled: !!societyId,
  });

  return {
    events: query.data ?? [],
    loading: !!societyId && query.isPending,
    fetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
