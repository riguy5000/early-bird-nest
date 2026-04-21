// Google Places proxy edge function.
// Keeps the Google Maps API key server-side. Two actions:
//   - autocomplete: { input: string, sessionToken?: string } -> predictions
//   - details:      { placeId: string, sessionToken?: string } -> structured place
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
      const params = new URLSearchParams({
        input,
        key: apiKey,
        types: 'address',
        components: `country:${body.country || 'us'}`,
      });
      if (body.sessionToken) params.set('sessiontoken', body.sessionToken);

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google autocomplete error', data.status, data.error_message);
        return json(502, { error: data.error_message || data.status });
      }
      const predictions = (data.predictions || []).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
        types: p.types || [],
      }));
      return json(200, { predictions });
    }

    if (body.action === 'details') {
      if (!body.placeId) return json(400, { error: 'placeId required' });
      const params = new URLSearchParams({
        place_id: body.placeId,
        key: apiKey,
        fields: 'address_component,formatted_address,geometry,name,types',
      });
      if (body.sessionToken) params.set('sessiontoken', body.sessionToken);

      const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== 'OK') {
        console.error('Google details error', data.status, data.error_message);
        return json(502, { error: data.error_message || data.status });
      }

      const result = data.result || {};
      const components: any[] = result.address_components || [];
      const get = (type: string) =>
        components.find((c: any) => c.types?.includes(type));

      const streetNumber = get('street_number')?.long_name || '';
      const route = get('route')?.long_name || '';
      const city =
        get('locality')?.long_name ||
        get('postal_town')?.long_name ||
        get('sublocality')?.long_name ||
        get('administrative_area_level_2')?.long_name ||
        '';
      const state = get('administrative_area_level_1')?.short_name || '';
      const postalCode = get('postal_code')?.long_name || '';
      const country = get('country')?.short_name || '';
      const streetAddress = [streetNumber, route].filter(Boolean).join(' ');

      return json(200, {
        place: {
          placeId: body.placeId,
          formattedAddress: result.formatted_address || '',
          streetAddress,
          streetNumber,
          streetName: route,
          city,
          state,
          postalCode,
          country,
          geometry: result.geometry?.location || null,
          types: result.types || [],
        },
      });
    }

    return json(400, { error: 'Unknown action' });
  } catch (err: any) {
    console.error('google-places error', err);
    return json(500, { error: err?.message || 'Unknown error' });
  }
});
