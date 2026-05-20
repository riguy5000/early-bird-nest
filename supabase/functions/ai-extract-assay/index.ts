// Extract refiner assay fields from an uploaded report image/PDF using Lovable AI Gateway.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const SYSTEM = `You read refiner assay/settlement reports for a jewelry buyer.
Extract numeric values when present. Use grams for weights and US dollars for money.
If a field is not present, set it to null. Never invent data.`;

const TOOL = {
  type: 'function',
  function: {
    name: 'record_assay',
    description: 'Record extracted assay values from a refiner report.',
    parameters: {
      type: 'object',
      properties: {
        refiner_reference: { type: ['string', 'null'] },
        gold_recovered: { type: ['number', 'null'] },
        silver_recovered: { type: ['number', 'null'] },
        platinum_recovered: { type: ['number', 'null'] },
        palladium_recovered: { type: ['number', 'null'] },
        purity_breakdown: { type: ['string', 'null'] },
        refiner_fee_actual: { type: ['number', 'null'] },
        loss_notes: { type: ['string', 'null'] },
        final_settlement_amount: { type: ['number', 'null'] },
      },
      required: [],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { image_data_url } = await req.json();
    if (!image_data_url || typeof image_data_url !== 'string') {
      return new Response(JSON.stringify({ error: 'image_data_url required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract assay/settlement values from this refiner report.' },
              { type: 'image_url', image_url: { url: image_data_url } },
            ],
          },
        ],
        tools: [TOOL],
        tool_choice: { type: 'function', function: { name: 'record_assay' } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${resp.status} ${text}` }), {
        status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
    return new Response(JSON.stringify({ extracted: args }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
