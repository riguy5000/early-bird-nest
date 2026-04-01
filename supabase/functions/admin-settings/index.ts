import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, table, data } = await req.json()

    // Only allow specific tables
    if (!['metal_api_keys', 'kv_store_62d2b480'].includes(table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let result

    switch (action) {
      case 'select': {
        const query = supabase.from(table).select('*')
        if (data?.eq) {
          for (const [col, val] of Object.entries(data.eq)) {
            query.eq(col, val)
          }
        }
        if (data?.order) query.order(data.order)
        if (data?.single) {
          result = await query.maybeSingle()
        } else {
          result = await query
        }
        break
      }
      case 'insert': {
        result = await supabase.from(table).insert(data.row)
        break
      }
      case 'upsert': {
        result = await supabase.from(table).upsert(data.row)
        break
      }
      case 'update': {
        const updateQuery = supabase.from(table).update(data.row)
        if (data?.eq) {
          for (const [col, val] of Object.entries(data.eq)) {
            updateQuery.eq(col, val)
          }
        }
        result = await updateQuery
        break
      }
      case 'delete': {
        const deleteQuery = supabase.from(table).delete()
        if (data?.eq) {
          for (const [col, val] of Object.entries(data.eq)) {
            deleteQuery.eq(col, val)
          }
        }
        result = await deleteQuery
        break
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ data: result.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
