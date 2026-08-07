import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * Google Places proxy.
 *
 * The Places web service cannot be restricted by Android package name or iOS
 * bundle id — only by IP or HTTP referrer, neither of which a mobile app has.
 * A key shipped in the bundle is therefore extractable and billable by anyone.
 * This function keeps the key server-side; the app calls here instead.
 *
 * JWT verification is enabled, so only signed-in users of the app can spend
 * quota. Requests are allowlisted to the endpoints the app actually uses, so
 * this cannot be repurposed as a general-purpose Google API relay.
 *
 * Supports both the legacy Places web service and Places API (New) — the
 * client picks via the `isNewPlacesAPI` prop on GooglePlacesAutocomplete.
 */

const LEGACY_HOST = 'https://maps.googleapis.com/maps/api';
const NEW_HOST = 'https://places.googleapis.com';

// Paths the app is permitted to reach, matched after the function name.
const ALLOWED_LEGACY = ['/place/autocomplete/json', '/place/details/json'];
const NEW_AUTOCOMPLETE = '/v1/places:autocomplete';
const NEW_DETAILS = /^\/v1\/places\/[^/]+$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

function isAllowed(path: string, method: string): boolean {
  if (method === 'GET') {
    return ALLOWED_LEGACY.includes(path) || NEW_DETAILS.test(path);
  }
  if (method === 'POST') {
    return path === NEW_AUTOCOMPLETE;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY is not set');
    return json({ error: 'Places proxy is not configured' }, 500);
  }

  const incoming = new URL(req.url);

  // Runtime may or may not include the /functions/v1 prefix; strip both it and
  // the function name to recover the Google path the client asked for.
  const path = incoming.pathname
    .replace(/^\/functions\/v1/, '')
    .replace(/^\/google-places/, '');

  if (!isAllowed(path, req.method)) {
    return json({ error: `Unsupported path: ${req.method} ${path}` }, 404);
  }

  const isNewApi = path.startsWith('/v1/');
  const target = new URL((isNewApi ? NEW_HOST : LEGACY_HOST) + path);

  // Forward client params, but never let the caller supply its own key.
  incoming.searchParams.forEach((value, name) => {
    if (name !== 'key') target.searchParams.set(name, value);
  });

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (isNewApi) {
    headers['X-Goog-Api-Key'] = apiKey;
    // Places API (New) expects a field mask; the client sends it as `fields`.
    const fields = target.searchParams.get('fields');
    if (fields) headers['X-Goog-FieldMask'] = fields;
  } else {
    target.searchParams.set('key', apiKey);
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: req.method,
      headers,
      body: req.method === 'POST' ? await req.text() : undefined,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...CORS,
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (error) {
    // Log the failure but never echo the upstream URL back — it carries the key.
    console.error('Places upstream request failed', error);
    return json({ error: 'Upstream request failed' }, 502);
  }
});
