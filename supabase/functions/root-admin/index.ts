import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Authenticate caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing authorization' }, 401)

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser()
    if (authError || !caller) return jsonResponse({ error: 'Unauthorized' }, 401)

    // Verify platform admin
    const { data: pa } = await adminClient
      .from('platform_admins')
      .select('id, role, is_active')
      .eq('auth_user_id', caller.id)
      .single()

    if (!pa || !pa.is_active) return jsonResponse({ error: 'Not a platform admin' }, 403)

    const body = await req.json()
    const { action } = body

    switch (action) {
      // ── Overview Stats ──
      case 'get-overview': {
        // Total stores
        const { count: totalStores } = await adminClient
          .from('stores')
          .select('*', { count: 'exact', head: true })

        // Active stores (status = active)
        const { count: activeStores } = await adminClient
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // Total employees
        const { count: totalEmployees } = await adminClient
          .from('employee_profiles')
          .select('*', { count: 'exact', head: true })

        // Stores by status
        const { data: allStores } = await adminClient
          .from('stores')
          .select('id, status, created_at')

        const statusCounts: Record<string, number> = {}
        const monthlyOnboarding: Record<string, number> = {}
        for (const s of allStores || []) {
          statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
          const month = s.created_at.substring(0, 7) // YYYY-MM
          monthlyOnboarding[month] = (monthlyOnboarding[month] || 0) + 1
        }

        // Recent stores (last 10)
        const { data: recentStores } = await adminClient
          .from('stores')
          .select('id, name, type, status, address, created_at, owner_auth_user_id')
          .order('created_at', { ascending: false })
          .limit(10)

        // Enrich recent stores with employee count
        const recentEnriched = []
        for (const store of recentStores || []) {
          const { count: empCount } = await adminClient
            .from('employee_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)

          // Get owner name
          const { data: ownerProfile } = await adminClient
            .from('employee_profiles')
            .select('first_name, last_name, email')
            .eq('store_id', store.id)
            .eq('role', 'store_admin')
            .limit(1)
            .single()

          recentEnriched.push({
            ...store,
            employeeCount: empCount || 0,
            owner: ownerProfile
              ? { name: `${ownerProfile.first_name} ${ownerProfile.last_name}`.trim(), email: ownerProfile.email }
              : null,
          })
        }

        // Recent employee additions (last 5)
        const { data: recentEmployees } = await adminClient
          .from('employee_profiles')
          .select('id, first_name, last_name, email, role, created_at, store_id')
          .order('created_at', { ascending: false })
          .limit(5)

        // Enrich with store name
        const recentEmpEnriched = []
        for (const emp of recentEmployees || []) {
          const { data: store } = await adminClient
            .from('stores')
            .select('name')
            .eq('id', emp.store_id)
            .single()
          recentEmpEnriched.push({
            ...emp,
            storeName: store?.name || 'Unknown',
          })
        }

        return jsonResponse({
          totalStores: totalStores || 0,
          activeStores: activeStores || 0,
          totalEmployees: totalEmployees || 0,
          statusCounts,
          monthlyOnboarding,
          recentStores: recentEnriched,
          recentEmployees: recentEmpEnriched,
        })
      }

      // ── List Stores ──
      case 'list-stores': {
        const { search, status, sortBy, sortDir, page, pageSize } = body
        const sz = pageSize || 20
        const pg = page || 1
        const from = (pg - 1) * sz
        const to = from + sz - 1

        let query = adminClient
          .from('stores')
          .select('*', { count: 'exact' })

        if (search) {
          query = query.ilike('name', `%${search}%`)
        }
        if (status && status !== 'all') {
          query = query.eq('status', status)
        }

        const col = sortBy || 'created_at'
        const asc = sortDir === 'asc'
        query = query.order(col, { ascending: asc }).range(from, to)

        const { data: stores, count, error } = await query
        if (error) throw error

        // Enrich each store
        const enriched = []
        for (const store of stores || []) {
          const { count: empCount } = await adminClient
            .from('employee_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)

          const { data: ownerProfile } = await adminClient
            .from('employee_profiles')
            .select('first_name, last_name, email, last_login_at')
            .eq('store_id', store.id)
            .eq('role', 'store_admin')
            .limit(1)
            .single()

          enriched.push({
            ...store,
            employeeCount: empCount || 0,
            owner: ownerProfile
              ? {
                  name: `${ownerProfile.first_name} ${ownerProfile.last_name}`.trim(),
                  email: ownerProfile.email,
                  lastLogin: ownerProfile.last_login_at,
                }
              : null,
          })
        }

        return jsonResponse({
          stores: enriched,
          total: count || 0,
          page: pg,
          pageSize: sz,
        })
      }

      // ── Store Details ──
      case 'get-store-details': {
        const { storeId } = body
        if (!storeId) return jsonResponse({ error: 'storeId required' }, 400)

        const { data: store, error } = await adminClient
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()
        if (error || !store) return jsonResponse({ error: 'Store not found' }, 404)

        // Employees
        const { data: employees } = await adminClient
          .from('employee_profiles')
          .select('id, first_name, last_name, email, role, is_active, last_login_at, created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: true })

        // Store settings
        const { data: settings } = await adminClient
          .from('store_settings')
          .select('*')
          .eq('store_id', storeId)
          .single()

        // Role counts
        const roleCounts: Record<string, number> = {}
        for (const e of employees || []) {
          roleCounts[e.role] = (roleCounts[e.role] || 0) + 1
        }

        return jsonResponse({
          store,
          employees: employees || [],
          employeeCount: employees?.length || 0,
          roleCounts,
          settings: settings || null,
        })
      }

      // ── Update Store Status ──
      case 'update-store-status': {
        const { storeId, status } = body
        if (!storeId || !status) return jsonResponse({ error: 'storeId and status required' }, 400)
        if (!['active', 'suspended', 'banned'].includes(status)) {
          return jsonResponse({ error: 'Invalid status' }, 400)
        }

        const { error } = await adminClient
          .from('stores')
          .update({ status })
          .eq('id', storeId)
        if (error) throw error

        return jsonResponse({ success: true, storeId, status })
      }

      // ── Impersonate Store ──
      case 'impersonate-store': {
        const { storeId } = body
        if (!storeId) return jsonResponse({ error: 'storeId required' }, 400)

        // Get store + store admin profile
        const { data: store } = await adminClient
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()
        if (!store) return jsonResponse({ error: 'Store not found' }, 404)

        const { data: adminProfile } = await adminClient
          .from('employee_profiles')
          .select('*, employee_permissions(*), employee_visibility_overrides(*)')
          .eq('store_id', storeId)
          .eq('role', 'store_admin')
          .limit(1)
          .single()

        // Log impersonation
        console.log(`[IMPERSONATION] Platform admin ${pa.id} (${caller.email}) impersonating store ${storeId} (${store.name})`)

        return jsonResponse({
          store,
          profile: adminProfile,
          permissions: adminProfile?.employee_permissions?.[0] || null,
          visibility: adminProfile?.employee_visibility_overrides?.[0] || null,
          impersonatedBy: { id: pa.id, email: caller.email },
        })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err: any) {
    console.error('root-admin error:', err)
    return jsonResponse({ error: err.message || 'Internal error' }, 500)
  }
})
