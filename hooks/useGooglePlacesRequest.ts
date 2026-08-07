import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Routes GooglePlacesAutocomplete through the `google-places` edge function so
 * the Places key never ships in the bundle. See supabase/functions/google-places.
 *
 * Spread onto the component and omit `key` from its `query` prop — the proxy
 * injects the key server-side and strips any client-supplied one.
 */
const PLACES_PROXY_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/google-places`;

export const useGooglePlacesRequest = () => {
  const { session } = useAuth();

  return useMemo(
    () => ({
      requestUrl: {
        useOnPlatform: 'all' as const,
        url: PLACES_PROXY_URL,
        headers: {
          // The function verifies this JWT, so only signed-in users spend quota.
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
      },
    }),
    [session?.access_token]
  );
};
