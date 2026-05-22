import { useQuery } from '@tanstack/react-query';
import { fetchEventsBySocietyId } from '@/api/events.api';
import { Event } from '@/types/event';

const useFetchEventsBySociety = (societyId: string | null | undefined) => {
  const { data, error, isLoading, isError } = useQuery<Event[]>({
    queryKey: ['societyEvents', societyId],
    queryFn: () => fetchEventsBySocietyId(societyId!),
    enabled: !!societyId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    events: data ?? [],
    loading: isLoading,
    isError,
    error,
  };
};

export default useFetchEventsBySociety;
