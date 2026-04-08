import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Stage 3: Classify a single cropped item image independently.
 * Input: { crop_base64: string, original_type_hint?: string }
 * Output: { type, category, color_notes, notes, confidence, is_mixed_crop }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crops } = await req.json();

    if (!crops || !Array.isArray(crops) || crops.length === 0) {
      return new Response(JSON.stringify({ error: 'No crops provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a jewelry and precious metals classification expert. You will receive one or more cropped images of individual items. For EACH image, determine:

1. The primary item type visible: Ring, Wedding Band, Earring, Earrings (pair), Pendant, Chain, Necklace, Bracelet, Anklet, Brooch, Charm, Cufflinks, Pin, Watch, Bar, Coin, Round, Spoon, Fork, Knife
2. The category: Jewelry, Watch, Bullion, or Silverware
3. Visible color notes (yellow, white/silver, rose/pink, two-tone, mixed). Do NOT claim metal type or karat.
4. Brief distinguishing notes
5. classification_confidence (0.0-1.0): how confident you are that the crop shows exactly one item of the stated type
6. is_mixed_crop (boolean): true if the crop clearly contains more than one distinct item (e.g. a watch AND a bracelet in the same crop), or if the primary subject is ambiguous

RULES:
- Classify ONLY from what you see in THIS cropped image, not from context
- If the crop is mostly background with a tiny item, set confidence lower
- If multiple distinct items are visible, set is_mixed_crop=true and classify the LARGEST/most prominent one
- For watches: only classify as Watch if a watch dial/face/strap is clearly the primary subject
- For earring pairs: if two matching earrings are visible, classify as "Earrings" with note "pair"
- Do NOT guess metal type or karat`;

    // Build messages with all crop images
    const userContent: any[] = [];
    for (let i = 0; i < crops.length; i++) {
      const crop = crops[i];
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${crop.crop_base64}` },
      });
      userContent.push({
        type: 'text',
        text: `Crop #${i + 1}${crop.original_type_hint ? ` (detection hint: ${crop.original_type_hint})` : ''}: Classify this cropped item image independently. What item type is shown?`,
      });
    }

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
          { role: 'user', content: userContent },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'classify_crops',
              description: 'Classify each cropped item image',
              parameters: {
                type: 'object',
                properties: {
                  classifications: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        crop_index: { type: 'number', description: '0-based index of the crop' },
                        type: { type: 'string', description: 'Item type (Ring, Watch, Chain, etc.)' },
                        category: { type: 'string', enum: ['Jewelry', 'Watch', 'Bullion', 'Silverware'], description: 'Item category' },
                        color_notes: { type: 'string' },
                        notes: { type: 'string' },
                        classification_confidence: { type: 'number', description: '0.0-1.0 confidence' },
                        is_mixed_crop: { type: 'boolean', description: 'True if crop contains multiple distinct items' },
                      },
                      required: ['crop_index', 'type', 'category', 'classification_confidence', 'is_mixed_crop'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['classifications'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'classify_crops' } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI classify error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Classification failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: 'AI did not return classifications' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-classify-crop error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
