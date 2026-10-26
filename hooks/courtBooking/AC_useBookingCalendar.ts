import { useQuery } from '@tanstack/react-query'
import { fetchBookingCalendar } from '@/api/AC_courtBooking.api'
import { CalendarBooking } from '@/types/AC_courtBooking'
import { qk } from '@/lib/queryKeys'
import { demoMode, DEMO_REFRESH_MS } from '@/constants/AC_demoMode'

/** Monday 00:00 (local time) of the week containing `date`. */
export const startOfWeek = (date: Date): Date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const offset = (d.getDay() + 6) % 7 // Mon = 0 … Sun = 6
  d.setDate(d.getDate() - offset)
  return d
}

/** Reserved and confirmed court bookings for the week starting `weekStart`. */
export const AC_useBookingCalendar = (weekStart: Date) => {
  const from = startOfWeek(weekStart)
  const to = new Date(from)
  to.setDate(to.getDate() + 7)

  const query = useQuery<CalendarBooking[], Error>({
    queryKey: qk.courtBooking.calendar(from.toISOString()),
    queryFn: () => fetchBookingCalendar(from, to),
    staleTime: 0,
    // In demo mode, blocks turn from amber to green while you watch.
    refetchInterval: demoMode ? DEMO_REFRESH_MS : 30_000,
  })

  return {
    ...query,
    loading: query.isPending,
    fetching: query.isFetching,
    bookings: query.data ?? [],
    weekStart: from,
  }
}
