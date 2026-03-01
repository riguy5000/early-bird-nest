import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const JEWELRY_CATEGORIES = [
  'Ring', 'Earring', 'Bracelet', 'Necklace', 'Chain', 'Pendant',
  'Watch', 'Brooch', 'Anklet', 'Charm', 'Cufflinks', 'Pin',
  'Bar', 'Coin', 'Round', 'Spoon', 'Fork', 'Knife'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a jewelry identification expert. Analyze the image and identify each jewelry or precious metal item visible.

For each item, determine:
1. The type from this list: ${JEWELRY_CATEGORIES.join(', ')}
2. A count if there are multiples of the same type

Return your analysis using the detect_items tool. Be precise about counts - count each individual piece.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${image_base64}` },
              },
              {
                type: 'text',
                text: 'Please identify and count all jewelry/precious metal items in this image.',
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_items',
              description: 'Report detected jewelry items from the image',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          description: 'Item type (e.g. Ring, Earring, Bracelet, Necklace, Chain, Pendant, Watch, Brooch, Anklet, Charm, Cufflinks, Pin, Bar, Coin, Round, Spoon, Fork, Knife)',
                        },
                        count: {
                          type: 'number',
                          description: 'Number of this item type detected',
                        },
                        notes: {
                          type: 'string',
                          description: 'Brief description or distinguishing features',
                        },
                      },
                      required: ['type', 'count'],
                      additionalProperties: false,
                    },
                  },
                  total_count: {
                    type: 'number',
                    description: 'Total number of all items detected',
                  },
                },
                required: ['items', 'total_count'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'detect_items' } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: 'AI did not return structured results' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-capture error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
