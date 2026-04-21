// Google Places (New) proxy edge function.
// Uses the Places API (New) endpoints:
//   - autocomplete: POST https://places.googleapis.com/v1/places:autocomplete
//   - details:      GET  https://places.googleapis.com/v1/places/{placeId}
//
// CORS-enabled, no JWT required (public address autocomplete).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface AutocompleteRequest {
  action: 'autocomplete';
  input: string;
  sessionToken?: string;
  country?: string;
}

interface DetailsRequest {
  action: 'details';
  placeId: string;
  sessionToken?: string;
}

type RequestBody = AutocompleteRequest | DetailsRequest;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    return json(500, { error: 'GOOGLE_MAPS_API_KEY is not configured' });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  try {
    if (body.action === 'autocomplete') {
      const input = (body.input || '').trim();
      if (input.length < 2) {
        return json(200, { predictions: [] });
      }

      const reqBody: Record<string, unknown> = {
        input,
        includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route'],
        regionCode: (body.country || 'us').toUpperCase(),
      };
      if (body.sessionToken) reqBody.sessionToken = body.sessionToken;

      const res = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify(reqBody),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        console.error('Google autocomplete error', res.status, data);
        return json(502, {
          error: data?.error?.message || `HTTP ${res.status}`,
        });
      }

      const predictions = (data.suggestions || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => {
          const p = s.placePrediction;
          return {
            placeId: p.placeId,
            description: p.text?.text || '',
            mainText: p.structuredFormat?.mainText?.text || p.text?.text || '',
            secondaryText: p.structuredFormat?.secondaryText?.text || '',
            types: p.types || [],
          };
        });
      return json(200, { predictions });
    }

    if (body.action === 'details') {
      if (!body.placeId) return json(400, { error: 'placeId required' });

      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
        body.placeId,
      )}${body.sessionToken ? `?sessionToken=${encodeURIComponent(body.sessionToken)}` : ''}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'id,formattedAddress,addressComponents,location,displayName,types',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Google details error', res.status, data);
        return json(502, {
          error: data?.error?.message || `HTTP ${res.status}`,
        });
      }

      const components: any[] = data.addressComponents || [];
      const get = (type: string) =>
        components.find((c: any) => c.types?.includes(type));

      const streetNumber = get('street_number')?.longText || '';
      const route = get('route')?.longText || '';
      const city =
        get('locality')?.longText ||
        get('postal_town')?.longText ||
        get('sublocality')?.longText ||
        get('administrative_area_level_2')?.longText ||
        '';
      const state = get('administrative_area_level_1')?.shortText || '';
      const postalCode = get('postal_code')?.longText || '';
      const country = get('country')?.shortText || '';
      const streetAddress = [streetNumber, route].filter(Boolean).join(' ');

      return json(200, {
        place: {
          placeId: data.id || body.placeId,
          formattedAddress: data.formattedAddress || '',
          streetAddress,
          streetNumber,
          streetName: route,
          city,
          state,
          postalCode,
          country,
          geometry: data.location
            ? { lat: data.location.latitude, lng: data.location.longitude }
            : null,
          types: data.types || [],
        },
      });
    }

    return json(400, { error: 'Unknown action' });
  } catch (err: any) {
    console.error('google-places error', err);
    return json(500, { error: err?.message || 'Unknown error' });
  }
});
