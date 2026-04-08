import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const systemPrompt = `You are a jewelry and precious metals identification expert. Analyze the image and identify each individual item visible.

For each item, determine:
1. The type/subcategory: Ring, Wedding Band, Earring (pair counts as 1 if matched, standalone earring is separate), Pendant, Chain, Necklace, Bracelet, Anklet, Brooch, Charm, Cufflinks, Pin, Watch, Bar, Coin, Round, Spoon, Fork, Knife, or other descriptive type
2. A count if there are multiples of the same type
3. Visible color notes: describe the apparent color (yellow, white/silver, rose/pink, two-tone, mixed). Do NOT claim metal type or karat — only describe what color you see.
4. Brief distinguishing notes

Important rules:
- Count each individual piece carefully
- A pair of earrings = 1 item with count 1 (note "pair" in notes)
- A standalone single earring = 1 item with count 1 (note "single" in notes)
- Watches are a separate category
- Do NOT identify metal type, karat, or authenticity — only visible appearance
- Be conservative: if unsure, describe what you see`;

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
                text: 'Please identify, count, and describe the visible color of all jewelry/precious metal items in this image. Do not guess metal type or karat.',
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_items',
              description: 'Report detected jewelry items from the image with visible color descriptions',
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
                          description: 'Item subcategory (e.g. Ring, Wedding Band, Earring, Chain, Watch, Pendant, Bracelet, Necklace, Brooch, Anklet, Charm, Cufflinks, Pin, Bar, Coin, Round, Spoon, Fork, Knife)',
                        },
                        count: {
                          type: 'number',
                          description: 'Number of this item type detected',
                        },
                        color_notes: {
                          type: 'string',
                          description: 'Visible color description (e.g. yellow color, white/silver color, rose/pink color, two-tone). Do NOT claim metal type.',
                        },
                        notes: {
                          type: 'string',
                          description: 'Brief distinguishing features (e.g. pair, single, large, small, with stones)',
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
