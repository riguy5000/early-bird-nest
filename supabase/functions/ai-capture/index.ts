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

    const systemPrompt = `You are a jewelry and precious metals identification expert with precise object localization skills. Analyze the image and identify each individual item visible.

For each item, determine:
1. The type/subcategory: Ring, Wedding Band, Earring (pair counts as 1 if matched, standalone earring is separate), Pendant, Chain, Necklace, Bracelet, Anklet, Brooch, Charm, Cufflinks, Pin, Watch, Bar, Coin, Round, Spoon, Fork, Knife, or other descriptive type
2. A count — always 1 per bounding box. If multiple items of the same type exist, list them separately with individual bounding boxes.
3. Visible color notes: describe the apparent color (yellow, white/silver, rose/pink, two-tone, mixed). Do NOT claim metal type or karat.
4. Brief distinguishing notes
5. The PRECISE bounding box expressed as normalized coordinates (0.0 to 1.0): x_min, y_min, x_max, y_max where (0,0) is top-left and (1,1) is bottom-right.
6. A detection_confidence between 0.0 and 1.0:
   - 0.9+ = clearly visible isolated item, very confident in type and location
   - 0.7-0.89 = visible but some ambiguity (partially occluded, close to another item)
   - 0.5-0.69 = low confidence (heavily overlapping, tangled, uncertain type)
   - below 0.5 = very uncertain, may be wrong
7. Whether the bounding box overlaps significantly with another item's box (overlap_flag true/false). If two items' boxes overlap by more than 30% of the smaller box area, set overlap_flag=true for BOTH items.

CRITICAL bounding box rules:
- ONE item per bounding box. Do NOT group multiple separate items into one box.
- The bounding box MUST tightly wrap the ENTIRE visible item with minimal margin.
- Do NOT cut off any part of the item. The full ring, bracelet arc, chain mass, earring with hooks — must be INSIDE the box.
- Do NOT make the box too large. The item should fill most of the bounding box area.
- For chains: wrap the entire visible chain mass.
- For rings: include the full circular body and any stone/setting.
- For earrings (pair): if they are physically close together, use ONE box covering both snugly. If far apart, use separate boxes.
- For watches: include only the watch body/dial/strap. Do NOT include nearby jewelry in the watch box.
- Estimate boundaries carefully by looking at where the actual item pixels start and end.

Other important rules:
- A pair of earrings = 1 item with count 1 (note "pair" in notes).
- A standalone single earring = 1 item with count 1 (note "single" in notes)
- Do NOT identify metal type, karat, or authenticity
- Be conservative: if unsure, describe what you see and lower the confidence
- Each item MUST have a bounding box.`;

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
                text: 'Identify all jewelry/precious metal items in this image. For EACH item provide a TIGHT bounding box as normalized coordinates (0.0-1.0). Provide detection_confidence and overlap_flag for each. ONE item per bounding box — do not group separate items together. Do not guess metal type or karat.',
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_items',
              description: 'Report detected jewelry items with bounding boxes, confidence scores, and overlap flags',
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
                          description: 'Item subcategory (Ring, Wedding Band, Earring, Chain, Watch, Pendant, Bracelet, Necklace, Brooch, Anklet, Charm, Cufflinks, Pin, Bar, Coin, Round, Spoon, Fork, Knife)',
                        },
                        count: {
                          type: 'number',
                          description: 'Always 1 per bounding box.',
                        },
                        color_notes: {
                          type: 'string',
                          description: 'Visible color description. Do NOT claim metal type.',
                        },
                        notes: {
                          type: 'string',
                          description: 'Brief distinguishing features',
                        },
                        detection_confidence: {
                          type: 'number',
                          description: 'Confidence 0.0-1.0 for the detection accuracy and type correctness',
                        },
                        overlap_flag: {
                          type: 'boolean',
                          description: 'True if this box overlaps significantly (>30%) with another item box',
                        },
                        bbox: {
                          type: 'object',
                          description: 'Bounding box as normalized coordinates (0.0-1.0).',
                          properties: {
                            x_min: { type: 'number' },
                            y_min: { type: 'number' },
                            x_max: { type: 'number' },
                            y_max: { type: 'number' },
                          },
                          required: ['x_min', 'y_min', 'x_max', 'y_max'],
                          additionalProperties: false,
                        },
                      },
                      required: ['type', 'count', 'bbox', 'detection_confidence', 'overlap_flag'],
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
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: 'AI did not return structured results' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Post-process: compute overlap between all pairs server-side for accuracy
    const items = result.items || [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i].bbox;
        const b = items[j].bbox;
        if (!a || !b) continue;
        const overlapX = Math.max(0, Math.min(a.x_max, b.x_max) - Math.max(a.x_min, b.x_min));
        const overlapY = Math.max(0, Math.min(a.y_max, b.y_max) - Math.max(a.y_min, b.y_min));
        const overlapArea = overlapX * overlapY;
        const areaA = (a.x_max - a.x_min) * (a.y_max - a.y_min);
        const areaB = (b.x_max - b.x_min) * (b.y_max - b.y_min);
        const minArea = Math.min(areaA, areaB);
        if (minArea > 0 && overlapArea / minArea > 0.3) {
          items[i].overlap_flag = true;
          items[j].overlap_flag = true;
        }
      }
    }

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
