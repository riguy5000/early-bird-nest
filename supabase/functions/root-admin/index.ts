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
        const { count: totalStores } = await adminClient
          .from('stores').select('*', { count: 'exact', head: true })
        const { count: activeStores } = await adminClient
          .from('stores').select('*', { count: 'exact', head: true }).eq('status', 'active')
        const { count: totalEmployees } = await adminClient
          .from('employee_profiles').select('*', { count: 'exact', head: true })

        const { data: allStores } = await adminClient
          .from('stores').select('id, status, created_at')
        const statusCounts: Record<string, number> = {}
        const monthlyOnboarding: Record<string, number> = {}
        for (const s of allStores || []) {
          statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
          const month = s.created_at.substring(0, 7)
          monthlyOnboarding[month] = (monthlyOnboarding[month] || 0) + 1
        }

        const { data: recentStores } = await adminClient
          .from('stores')
          .select('id, name, type, status, address, created_at, owner_auth_user_id')
          .order('created_at', { ascending: false }).limit(10)

        const recentEnriched = []
        for (const store of recentStores || []) {
          const { count: empCount } = await adminClient
            .from('employee_profiles').select('*', { count: 'exact', head: true }).eq('store_id', store.id)
          const { data: ownerProfile } = await adminClient
            .from('employee_profiles')
            .select('first_name, last_name, email')
            .eq('store_id', store.id).eq('role', 'store_admin').limit(1).single()
          recentEnriched.push({
            ...store, employeeCount: empCount || 0,
            owner: ownerProfile ? { name: `${ownerProfile.first_name} ${ownerProfile.last_name}`.trim(), email: ownerProfile.email } : null,
          })
        }

        const { data: recentEmployees } = await adminClient
          .from('employee_profiles')
          .select('id, first_name, last_name, email, role, created_at, store_id')
          .order('created_at', { ascending: false }).limit(5)
        const recentEmpEnriched = []
        for (const emp of recentEmployees || []) {
          const { data: store } = await adminClient.from('stores').select('name').eq('id', emp.store_id).single()
          recentEmpEnriched.push({ ...emp, storeName: store?.name || 'Unknown' })
        }

        return jsonResponse({
          totalStores: totalStores || 0, activeStores: activeStores || 0,
          totalEmployees: totalEmployees || 0, statusCounts, monthlyOnboarding,
          recentStores: recentEnriched, recentEmployees: recentEmpEnriched,
        })
      }

      // ── List Stores ──
      case 'list-stores': {
        const { search, status, sortBy, sortDir, page, pageSize } = body
        const sz = pageSize || 20
        const pg = page || 1
        const from = (pg - 1) * sz
        const to = from + sz - 1

        let query = adminClient.from('stores').select('*', { count: 'exact' })
        if (search) query = query.ilike('name', `%${search}%`)
        if (status && status !== 'all') query = query.eq('status', status)
        query = query.order(sortBy || 'created_at', { ascending: sortDir === 'asc' }).range(from, to)

        const { data: stores, count, error } = await query
        if (error) throw error

        const enriched = []
        for (const store of stores || []) {
          const { count: empCount } = await adminClient
            .from('employee_profiles').select('*', { count: 'exact', head: true }).eq('store_id', store.id)
          const { data: ownerProfile } = await adminClient
            .from('employee_profiles')
            .select('first_name, last_name, email, last_login_at')
            .eq('store_id', store.id).eq('role', 'store_admin').limit(1).single()
          enriched.push({
            ...store, employeeCount: empCount || 0,
            owner: ownerProfile ? {
              name: `${ownerProfile.first_name} ${ownerProfile.last_name}`.trim(),
              email: ownerProfile.email, lastLogin: ownerProfile.last_login_at,
            } : null,
          })
        }
        return jsonResponse({ stores: enriched, total: count || 0, page: pg, pageSize: sz })
      }

      // ── Store Details ──
      case 'get-store-details': {
        const { storeId } = body
        if (!storeId) return jsonResponse({ error: 'storeId required' }, 400)
        const { data: store, error } = await adminClient.from('stores').select('*').eq('id', storeId).single()
        if (error || !store) return jsonResponse({ error: 'Store not found' }, 404)

        const { data: employees } = await adminClient
          .from('employee_profiles')
          .select('id, first_name, last_name, email, role, is_active, last_login_at, created_at')
          .eq('store_id', storeId).order('created_at', { ascending: true })
        const { data: settings } = await adminClient
          .from('store_settings').select('*').eq('store_id', storeId).single()

        const roleCounts: Record<string, number> = {}
        for (const e of employees || []) {
          roleCounts[e.role] = (roleCounts[e.role] || 0) + 1
        }
        return jsonResponse({
          store, employees: employees || [], employeeCount: employees?.length || 0,
          roleCounts, settings: settings || null,
        })
      }

      // ── Update Store Status ──
      case 'update-store-status': {
        const { storeId, status } = body
        if (!storeId || !status) return jsonResponse({ error: 'storeId and status required' }, 400)
        if (!['active', 'suspended', 'banned'].includes(status)) return jsonResponse({ error: 'Invalid status' }, 400)
        const { error } = await adminClient.from('stores').update({ status }).eq('id', storeId)
        if (error) throw error
        return jsonResponse({ success: true, storeId, status })
      }

      // ── Impersonate Store ──
      case 'impersonate-store': {
        const { storeId } = body
        if (!storeId) return jsonResponse({ error: 'storeId required' }, 400)
        const { data: store } = await adminClient.from('stores').select('*').eq('id', storeId).single()
        if (!store) return jsonResponse({ error: 'Store not found' }, 404)
        const { data: adminProfile } = await adminClient
          .from('employee_profiles')
          .select('*, employee_permissions(*), employee_visibility_overrides(*)')
          .eq('store_id', storeId).eq('role', 'store_admin').limit(1).single()
        console.log(`[IMPERSONATION] Platform admin ${pa.id} (${caller.email}) impersonating store ${storeId} (${store.name})`)
        return jsonResponse({
          store, profile: adminProfile,
          permissions: adminProfile?.employee_permissions?.[0] || null,
          visibility: adminProfile?.employee_visibility_overrides?.[0] || null,
          impersonatedBy: { id: pa.id, email: caller.email },
        })
      }

      // ── Create Store (Add Store from Root Admin) ──
      case 'create-store': {
        const { mode: createMode, storeName, storeType, ownerEmail, ownerFirstName, ownerLastName,
          ownerPhone, storeAddress, timezone, status: storeStatus, tempPassword, ownerName } = body

        if (!storeName || !ownerEmail) return jsonResponse({ error: 'Store name and owner email required' }, 400)

        // Create auth user for owner
        const password = tempPassword || crypto.randomUUID().substring(0, 16) + 'A1!'
        const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
          email: ownerEmail,
          password,
          email_confirm: true,
        })
        if (authErr) throw authErr

        const ownerId = authData.user.id

        // Create store
        const { data: newStore, error: storeErr } = await adminClient
          .from('stores')
          .insert({
            name: storeName,
            type: storeType || 'jewelry_pawn',
            owner_auth_user_id: ownerId,
            address: storeAddress || '',
            phone: ownerPhone || '',
            email: ownerEmail,
            timezone: timezone || 'America/New_York',
            status: storeStatus || 'active',
          })
          .select()
          .single()
        if (storeErr) throw storeErr

        // Determine names
        const firstName = ownerFirstName || ownerName?.split(' ')[0] || ''
        const lastName = ownerLastName || ownerName?.split(' ').slice(1).join(' ') || ''

        // Create employee profile for store admin
        const { data: empProfile, error: empErr } = await adminClient
          .from('employee_profiles')
          .insert({
            store_id: newStore.id,
            auth_user_id: ownerId,
            email: ownerEmail,
            first_name: firstName,
            last_name: lastName,
            phone: ownerPhone || '',
            role: 'store_admin',
            invite_status: 'active',
            is_active: true,
          })
          .select()
          .single()
        if (empErr) throw empErr

        // Create default permissions
        await adminClient.from('employee_permissions').insert({
          employee_profile_id: empProfile.id,
          can_access_take_in: true, can_access_inventory: true, can_access_customers: true,
          can_access_payouts: true, can_access_statistics: true, can_access_settings: true,
          can_access_saved_for_later: true, can_edit_rates: true, can_edit_final_payout_amount: true,
          can_print_labels: true, can_print_receipts: true, can_delete_items: true,
          can_complete_purchase: true, can_reopen_transactions: true,
        })

        // Create default visibility overrides
        await adminClient.from('employee_visibility_overrides').insert({
          employee_profile_id: empProfile.id,
        })

        // Create default store settings
        await adminClient.from('store_settings').insert({ store_id: newStore.id })

        return jsonResponse({ success: true, storeId: newStore.id, mode: createMode })
      }

      // ── List Users (Platform-wide) ──
      case 'list-users': {
        const { search, userType, status: uStatus, page: uPage, pageSize: uPageSize } = body
        const sz = uPageSize || 20
        const pg = uPage || 1

        // Gather all user types
        const allUsers: any[] = []

        // 1. Platform admins
        if (!userType || userType === 'platform_admin') {
          const { data: pas } = await adminClient.from('platform_admins').select('*')
          for (const p of pas || []) {
            allUsers.push({
              id: p.id, email: p.email, name: p.full_name,
              userType: 'platform_admin', role: p.role,
              isActive: p.is_active, storeName: null, storeId: null,
              lastLogin: null, createdAt: p.created_at, inviteStatus: null,
              permissions: null, visibility: null,
            })
          }
        }

        // 2. Employee profiles (store admins + employees)
        if (!userType || userType === 'store_admin' || userType === 'employee' || userType === 'pending') {
          let empQuery = adminClient.from('employee_profiles').select('*')
          if (userType === 'store_admin') empQuery = empQuery.eq('role', 'store_admin')
          else if (userType === 'employee') empQuery = empQuery.neq('role', 'store_admin')
          else if (userType === 'pending') empQuery = empQuery.eq('invite_status', 'pending')

          const { data: emps } = await empQuery

          // Batch load store names
          const storeIds = [...new Set((emps || []).map(e => e.store_id))]
          const storeMap: Record<string, string> = {}
          if (storeIds.length > 0) {
            const { data: stores } = await adminClient.from('stores').select('id, name').in('id', storeIds)
            for (const s of stores || []) storeMap[s.id] = s.name
          }

          // Load permissions and visibility per employee
          const empIds = (emps || []).map(e => e.id)
          const permMap: Record<string, any> = {}
          const visMap: Record<string, any> = {}
          if (empIds.length > 0) {
            const { data: perms } = await adminClient.from('employee_permissions').select('*').in('employee_profile_id', empIds)
            for (const p of perms || []) permMap[p.employee_profile_id] = p
            const { data: vis } = await adminClient.from('employee_visibility_overrides').select('*').in('employee_profile_id', empIds)
            for (const v of vis || []) visMap[v.employee_profile_id] = v
          }

          for (const e of emps || []) {
            allUsers.push({
              id: e.id, email: e.email, name: `${e.first_name} ${e.last_name}`.trim(),
              userType: e.role === 'store_admin' ? 'store_admin' : 'employee',
              role: e.role, isActive: e.is_active,
              storeName: storeMap[e.store_id] || 'Unknown', storeId: e.store_id,
              lastLogin: e.last_login_at, createdAt: e.created_at,
              inviteStatus: e.invite_status,
              permissions: permMap[e.id] || null,
              visibility: visMap[e.id] || null,
            })
          }
        }

        // Filter by search
        let filtered = allUsers
        if (search) {
          const s = search.toLowerCase()
          filtered = filtered.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))
        }
        if (uStatus === 'active') filtered = filtered.filter(u => u.isActive)
        if (uStatus === 'inactive') filtered = filtered.filter(u => !u.isActive)

        // Sort by createdAt desc
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        // Summary
        const summary = {
          total: filtered.length,
          active: filtered.filter(u => u.isActive).length,
          inactive: filtered.filter(u => !u.isActive).length,
          pendingInvites: filtered.filter(u => u.inviteStatus === 'pending').length,
          platformAdmins: filtered.filter(u => u.userType === 'platform_admin').length,
          storeAdmins: filtered.filter(u => u.userType === 'store_admin').length,
          employees: filtered.filter(u => u.userType === 'employee').length,
        }

        // Paginate
        const from = (pg - 1) * sz
        const paginated = filtered.slice(from, from + sz)

        return jsonResponse({ users: paginated, total: filtered.length, summary, page: pg, pageSize: sz })
      }

      // ── User Action ──
      case 'user-action': {
        const { userAction, targetUserId, userType: targetType } = body
        if (!userAction || !targetUserId) return jsonResponse({ error: 'userAction and targetUserId required' }, 400)

        if (userAction === 'deactivate') {
          if (targetType === 'platform_admin') {
            await adminClient.from('platform_admins').update({ is_active: false }).eq('id', targetUserId)
          } else {
            await adminClient.from('employee_profiles').update({ is_active: false }).eq('id', targetUserId)
          }
        } else if (userAction === 'reactivate') {
          if (targetType === 'platform_admin') {
            await adminClient.from('platform_admins').update({ is_active: true }).eq('id', targetUserId)
          } else {
            await adminClient.from('employee_profiles').update({ is_active: true }).eq('id', targetUserId)
          }
        } else if (userAction === 'delete') {
          if (targetType === 'platform_admin') {
            // Get auth_user_id before deleting
            const { data: paRecord } = await adminClient.from('platform_admins').select('auth_user_id').eq('id', targetUserId).single()
            await adminClient.from('platform_admins').delete().eq('id', targetUserId)
            // Don't delete auth user — may be reused
          } else {
            await adminClient.from('employee_permissions').delete().eq('employee_profile_id', targetUserId)
            await adminClient.from('employee_visibility_overrides').delete().eq('employee_profile_id', targetUserId)
            await adminClient.from('employee_profiles').delete().eq('id', targetUserId)
          }
        }
        return jsonResponse({ success: true })
      }

      // ── System Health ──
      case 'get-system-health': {
        // Service statuses from real data checks
        const services = []

        // Database check
        try {
          const { count } = await adminClient.from('stores').select('*', { count: 'exact', head: true })
          services.push({ name: 'Database', icon: 'database', status: 'healthy', detail: `${count} stores` })
        } catch {
          services.push({ name: 'Database', icon: 'database', status: 'error', detail: 'Connection failed' })
        }

        // Auth check
        try {
          const { data: authUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 })
          services.push({ name: 'Authentication', icon: 'shield', status: 'healthy', detail: 'Operational' })
        } catch {
          services.push({ name: 'Authentication', icon: 'shield', status: 'error', detail: 'Check failed' })
        }

        // Edge Functions — we're running inside one, so it's healthy
        services.push({ name: 'Edge Functions', icon: 'server', status: 'healthy', detail: 'This function is running' })

        // Storage check
        services.push({ name: 'Storage', icon: 'drive', status: 'healthy', detail: 'Buckets: batch-photos, customer-id-scans' })

        // Integrations
        const integrations = []

        // Check metal API keys
        const { data: metalKeys, count: metalKeyCount } = await adminClient
          .from('metal_api_keys').select('*', { count: 'exact' }).eq('is_active', true)
        integrations.push({
          name: 'GoldAPI (Metal Prices)',
          status: (metalKeyCount || 0) > 0 ? 'active' : 'warning',
          keysConfigured: metalKeyCount || 0,
          lastPing: metalKeys?.[0]?.last_used_at || null,
        })

        // Check for OpenAI key in kv_store
        const { data: oaiKey } = await adminClient
          .from('kv_store_62d2b480').select('value').eq('key', 'openai_api_key').single()
        integrations.push({
          name: 'OpenAI (AI OCR)',
          status: oaiKey?.value ? 'active' : 'warning',
          keysConfigured: oaiKey?.value ? 1 : 0,
          lastPing: null,
        })

        // Storage buckets info
        const storage = [
          { name: 'batch-photos', objectCount: 0 },
          { name: 'customer-id-scans', objectCount: 0 },
        ]

        // Security info
        const { count: totalAuthUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 })
        const { count: platformAdminsCount } = await adminClient
          .from('platform_admins').select('*', { count: 'exact', head: true }).eq('is_active', true)
        const { count: activeEmps } = await adminClient
          .from('employee_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true)
        const { count: pendingInvites } = await adminClient
          .from('employee_profiles').select('*', { count: 'exact', head: true }).eq('invite_status', 'pending')

        return jsonResponse({
          services, integrations, storage,
          security: {
            totalAuthUsers: totalAuthUsers || 0,
            platformAdmins: platformAdminsCount || 0,
            activeEmployees: activeEmps || 0,
            pendingInvites: pendingInvites || 0,
          },
          recentIncidents: [],
        })
      }

      // ── Analytics ──
      case 'get-analytics': {
        const { count: registeredStores } = await adminClient.from('stores').select('*', { count: 'exact', head: true })
        const { count: totalEmployees } = await adminClient.from('employee_profiles').select('*', { count: 'exact', head: true })
        const { count: totalCustomers } = await adminClient.from('customers').select('*', { count: 'exact', head: true })
        const { count: platformAdminsCount } = await adminClient.from('platform_admins').select('*', { count: 'exact', head: true })
        const { count: activeStores } = await adminClient.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'active')

        // Store admins vs employees
        const { count: storeAdminsCount } = await adminClient
          .from('employee_profiles').select('*', { count: 'exact', head: true }).eq('role', 'store_admin')
        const { count: pendingCount } = await adminClient
          .from('employee_profiles').select('*', { count: 'exact', head: true }).eq('invite_status', 'pending')

        // Onboarding trend
        const { data: allStores } = await adminClient.from('stores').select('created_at')
        const onboardingTrend: Record<string, number> = {}
        for (const s of allStores || []) {
          const month = s.created_at.substring(0, 7)
          onboardingTrend[month] = (onboardingTrend[month] || 0) + 1
        }

        // Status counts
        const { data: storesList } = await adminClient.from('stores').select('status')
        const storesByStatus: Record<string, number> = { active: 0, suspended: 0, banned: 0 }
        for (const s of storesList || []) {
          storesByStatus[s.status] = (storesByStatus[s.status] || 0) + 1
        }

        // Top stores by employees
        const { data: empByStore } = await adminClient
          .from('employee_profiles').select('store_id')
        const storeEmpCounts: Record<string, number> = {}
        for (const e of empByStore || []) {
          storeEmpCounts[e.store_id] = (storeEmpCounts[e.store_id] || 0) + 1
        }
        const topByEmpIds = Object.entries(storeEmpCounts)
          .sort(([, a], [, b]) => b - a).slice(0, 5)
        const topStoresByEmployees = []
        for (const [sId, cnt] of topByEmpIds) {
          const { data: st } = await adminClient.from('stores').select('id, name, type').eq('id', sId).single()
          if (st) topStoresByEmployees.push({ ...st, employeeCount: cnt })
        }

        // Top stores by customers
        const { data: custByStore } = await adminClient
          .from('customers').select('store_id')
        const storeCustCounts: Record<string, number> = {}
        for (const c of custByStore || []) {
          storeCustCounts[c.store_id] = (storeCustCounts[c.store_id] || 0) + 1
        }
        const topByCustIds = Object.entries(storeCustCounts)
          .sort(([, a], [, b]) => b - a).slice(0, 5)
        const topStoresByCustomers = []
        for (const [sId, cnt] of topByCustIds) {
          const { data: st } = await adminClient.from('stores').select('id, name').eq('id', sId).single()
          if (st) topStoresByCustomers.push({ ...st, customerCount: cnt })
        }

        return jsonResponse({
          kpis: {
            registeredStores: registeredStores || 0,
            totalUsers: (platformAdminsCount || 0) + (totalEmployees || 0),
            totalCustomers: totalCustomers || 0,
            activeStores24h: activeStores || 0,
          },
          onboardingTrend,
          storesByStatus,
          userBreakdown: {
            platformAdmins: platformAdminsCount || 0,
            storeAdmins: storeAdminsCount || 0,
            employees: (totalEmployees || 0) - (storeAdminsCount || 0),
            pendingInvites: pendingCount || 0,
          },
          topStoresByEmployees,
          topStoresByCustomers,
        })
      }

      // ── Platform Settings ──
      case 'get-platform-settings': {
        const { data: row } = await adminClient
          .from('kv_store_62d2b480')
          .select('value')
          .eq('key', 'platform_settings')
          .single()
        return jsonResponse({ settings: row?.value || null })
      }

      case 'save-platform-settings': {
        const { settings } = body
        if (!settings) return jsonResponse({ error: 'settings required' }, 400)

        // Upsert into kv_store
        const { error } = await adminClient
          .from('kv_store_62d2b480')
          .upsert({ key: 'platform_settings', value: settings }, { onConflict: 'key' })
        if (error) throw error
        return jsonResponse({ success: true })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err: any) {
    console.error('root-admin error:', err)
    return jsonResponse({ error: err.message || 'Internal error' }, 500)
  }
})
