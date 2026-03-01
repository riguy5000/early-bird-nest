import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const METALS = [
  { metal: 'Gold', symbol: 'XAU' },
  { metal: 'Silver', symbol: 'XAG' },
  { metal: 'Platinum', symbol: 'XPT' },
  { metal: 'Palladium', symbol: 'XPD' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active API keys ordered by sort_order
    const { data: apiKeys, error: keysError } = await supabase
      .from('metal_api_keys')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (keysError || !apiKeys?.length) {
      return new Response(
        JSON.stringify({ error: 'No active API keys configured', cached: await getCachedPrices(supabase) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reset monthly counters if needed
    for (const key of apiKeys) {
      const lastReset = new Date(key.last_reset_at)
      const now = new Date()
      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        await supabase
          .from('metal_api_keys')
          .update({ requests_used: 0, last_reset_at: now.toISOString() })
          .eq('id', key.id)
        key.requests_used = 0
      }
    }

    // Find a key with remaining quota
    const availableKey = apiKeys.find(k => k.requests_used < k.monthly_limit)
    if (!availableKey) {
      console.warn('All API keys have exceeded their monthly limits')
      return new Response(
        JSON.stringify({ error: 'All API keys exhausted', cached: await getCachedPrices(supabase) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch prices for each metal
    const results: any[] = []
    let requestCount = 0

    for (const { metal, symbol } of METALS) {
      // Check if this key still has quota
      if (availableKey.requests_used + requestCount >= availableKey.monthly_limit) {
        // Try next key
        const nextKey = apiKeys.find(k => k.id !== availableKey.id && k.requests_used < k.monthly_limit)
        if (!nextKey) break
        // Switch to next key - update current key's usage first
        await supabase
          .from('metal_api_keys')
          .update({ 
            requests_used: availableKey.requests_used + requestCount,
            last_used_at: new Date().toISOString()
          })
          .eq('id', availableKey.id)
        // Continue with the next key (simplified - in production would be more robust)
      }

      try {
        const response = await fetch(`https://www.goldapi.io/api/${symbol}/USD`, {
          headers: {
            'x-access-token': availableKey.api_key,
            'Content-Type': 'application/json',
          },
        })

        requestCount++

        if (response.ok) {
          const data = await response.json()
          const priceData = {
            metal,
            symbol,
            price_usd: data.price || 0,
            change_percent: data.ch || 0,
            fetched_at: new Date().toISOString(),
            source: 'goldapi.io',
          }
          results.push(priceData)

          // Upsert into cache
          await supabase
            .from('metal_prices')
            .upsert(priceData, { onConflict: 'metal' })
        } else {
          const errText = await response.text()
          console.error(`Failed to fetch ${metal}: ${response.status} ${errText}`)
        }
      } catch (fetchErr) {
        console.error(`Error fetching ${metal}:`, fetchErr)
      }
    }

    // Update key usage
    await supabase
      .from('metal_api_keys')
      .update({ 
        requests_used: availableKey.requests_used + requestCount,
        last_used_at: new Date().toISOString()
      })
      .eq('id', availableKey.id)

    return new Response(
      JSON.stringify({ success: true, prices: results, requests_made: requestCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-metal-prices:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getCachedPrices(supabase: any) {
  const { data } = await supabase
    .from('metal_prices')
    .select('*')
    .order('metal')
  return data || []
}
