import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { front_image_base64, back_image_base64 } = await req.json();

    if (!front_image_base64) {
      return new Response(
        JSON.stringify({ error: "Front image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageContents: any[] = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${front_image_base64}` },
      },
      {
        type: "text",
        text: "This is the FRONT of the driver's license.",
      },
    ];

    if (back_image_base64) {
      imageContents.push(
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${back_image_base64}` },
        },
        {
          type: "text",
          text: "This is the BACK of the driver's license.",
        }
      );
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert at reading driver's licenses and government-issued IDs. Extract all visible information accurately. Also assess whether the front image is clear and readable or hazy/blurry.",
            },
            {
              role: "user",
              content: imageContents,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_license_data",
                description:
                  "Extract structured data from a driver's license or government ID",
                parameters: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Full name as shown on the license",
                    },
                    dateOfBirth: {
                      type: "string",
                      description: "Date of birth in YYYY-MM-DD format",
                    },
                    address: {
                      type: "string",
                      description: "Full address as shown on the license",
                    },
                    gender: {
                      type: "string",
                      enum: ["M", "F", "Other"],
                      description: "Gender as shown on the license",
                    },
                    licenseNumber: {
                      type: "string",
                      description: "Driver license number",
                    },
                    email: {
                      type: "string",
                      description:
                        "Email address if visible anywhere on the ID, otherwise empty string",
                    },
                    phone: {
                      type: "string",
                      description:
                        "Phone number if visible anywhere on the ID, otherwise empty string",
                    },
                    image_quality: {
                      type: "string",
                      enum: ["clear", "slightly_blurry", "very_blurry"],
                      description:
                        "Assessment of front image quality/clarity",
                    },
                    image_quality_note: {
                      type: "string",
                      description:
                        "Brief note about image quality issues if any",
                    },
                  },
                  required: [
                    "name",
                    "dateOfBirth",
                    "address",
                    "gender",
                    "licenseNumber",
                    "image_quality",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_license_data" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze license image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Could not extract data from the license image" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-license error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
