import { useQuery } from '@tanstack/react-query'
import { fetchVenues } from '@/api/AC_courtBooking.api'
import { Venue } from '@/types/AC_courtBooking'
import { qk } from '@/lib/queryKeys'

/** Bookable courts, optionally for one university. */
export const AC_useVenues = (universityId: string | null) => {
  const query = useQuery<Venue[], Error>({
    queryKey: qk.courtBooking.venues(universityId),
    queryFn: () => fetchVenues(universityId),
    // Venues change rarely.
    staleTime: 1000 * 60 * 10,
  })

  return {
    ...query,
    loading: query.isPending,
    venues: query.data ?? [],
  }
}
