import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const { action } = body

    // For register-store and accept-invite, authentication is not required
    if (action === 'register-store' || action === 'accept-invite' || action === 'bootstrap-root-admin' || action === 'admin-reset-password') {
      // Handle unauthenticated actions below
    } else {
      // Verify caller is authenticated
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      })
      const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()
      if (authError || !callerUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      // Store caller for use in authenticated actions
      ;(body as any)._caller = callerUser
    }

    // Get caller (may be null for unauthenticated actions)
    const caller = (body as any)._caller || null


    // Helper: verify caller owns the store
    async function verifyStoreOwner(storeId: string) {
      const { data } = await adminClient
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('owner_auth_user_id', caller!.id)
        .single()
      if (!data) throw new Error('Not authorized for this store')
      return data
    }

    switch (action) {
      // ── Register Store (new store admin signup) ──
      case 'register-store': {
        const { email, password, fullName, store } = body
        
        // Create auth user
        const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        })
        if (signUpError) throw signUpError

        const userId = authData.user.id

        // Create store
        const { data: storeData, error: storeError } = await adminClient
          .from('stores')
          .insert({
            name: store.name,
            type: store.type || 'jewelry_pawn',
            address: store.address || '',
            phone: store.phone || '',
            email: store.email || email,
            timezone: store.timezone || 'America/New_York',
            owner_auth_user_id: userId,
          })
          .select()
          .single()
        if (storeError) throw storeError

        // Create employee profile for store admin
        const nameParts = fullName.split(' ')
        const { data: empProfile, error: empError } = await adminClient
          .from('employee_profiles')
          .insert({
            auth_user_id: userId,
            store_id: storeData.id,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email,
            role: 'store_admin',
            is_active: true,
            invite_status: 'active',
          })
          .select()
          .single()
        if (empError) throw empError

        // Create permissions (full access for store admin)
        await adminClient.from('employee_permissions').insert({
          employee_profile_id: empProfile.id,
          can_access_take_in: true, can_access_inventory: true,
          can_access_customers: true, can_access_payouts: true,
          can_access_statistics: true, can_access_settings: true,
          can_access_saved_for_later: true, can_edit_rates: true,
          can_edit_final_payout_amount: true, can_print_labels: true,
          can_print_receipts: true, can_delete_items: true,
          can_complete_purchase: true, can_reopen_transactions: true,
        })

        // Create visibility overrides (store admin sees everything)
        await adminClient.from('employee_visibility_overrides').insert({
          employee_profile_id: empProfile.id,
          hide_profit: false, hide_percentage_paid: false,
          hide_market_value: false, hide_total_payout_breakdown: false,
          hide_average_rate: false,
        })

        // Create default store_settings row
        await adminClient.from('store_settings').upsert({
          store_id: storeData.id,
          general: { name: store.name, type: store.type, address: store.address, phone: store.phone, email: store.email || email },
        }, { onConflict: 'store_id' })

        return new Response(JSON.stringify({
          success: true,
          userId,
          storeId: storeData.id,
          employeeProfileId: empProfile.id,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Create Employee (manual, admin-created) ──
      case 'create-employee': {
        const { storeId, firstName, lastName, email, phone, role, isActive, password, permissions, visibility } = body
        await verifyStoreOwner(storeId)

        // Create auth user for the employee
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password: password || Math.random().toString(36).slice(-12) + 'A1!',
          email_confirm: true,
          user_metadata: { full_name: `${firstName} ${lastName}` }
        })
        if (createError) throw createError

        // Create employee profile
        const { data: empProfile, error: empError } = await adminClient
          .from('employee_profiles')
          .insert({
            auth_user_id: authData.user.id,
            store_id: storeId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phone || '',
            role: role || 'buyer',
            is_active: isActive !== false,
            invited_by: caller!.id,
            invite_status: 'active',
          })
          .select()
          .single()
        if (empError) throw empError

        // Create permissions
        const defaultPerms = getDefaultPermissions(role)
        await adminClient.from('employee_permissions').insert({
          employee_profile_id: empProfile.id,
          ...defaultPerms,
          ...(permissions || {}),
        })

        // Create visibility overrides
        const defaultVis = getDefaultVisibility(role)
        await adminClient.from('employee_visibility_overrides').insert({
          employee_profile_id: empProfile.id,
          ...defaultVis,
          ...(visibility || {}),
        })

        return new Response(JSON.stringify({
          success: true,
          employeeProfileId: empProfile.id,
          authUserId: authData.user.id,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Invite Employee (email invite) ──
      case 'invite-employee': {
        const { storeId, email, role, permissions, visibility } = body
        await verifyStoreOwner(storeId)

        // Generate invite token
        const inviteToken = crypto.randomUUID() + '-' + crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        // Create pending employee profile (no auth user yet)
        const { data: empProfile, error: empError } = await adminClient
          .from('employee_profiles')
          .insert({
            store_id: storeId,
            first_name: '',
            last_name: '',
            email,
            role: role || 'buyer',
            is_active: false,
            invited_by: caller!.id,
            invite_status: 'pending',
            invite_token: inviteToken,
            invite_expires_at: expiresAt.toISOString(),
          })
          .select()
          .single()
        if (empError) throw empError

        // Create permissions
        const defaultPerms = getDefaultPermissions(role)
        await adminClient.from('employee_permissions').insert({
          employee_profile_id: empProfile.id,
          ...defaultPerms,
          ...(permissions || {}),
        })

        // Create visibility overrides
        const defaultVis = getDefaultVisibility(role)
        await adminClient.from('employee_visibility_overrides').insert({
          employee_profile_id: empProfile.id,
          ...defaultVis,
          ...(visibility || {}),
        })

        // TODO: Send invite email (for now return the token)
        return new Response(JSON.stringify({
          success: true,
          employeeProfileId: empProfile.id,
          inviteToken,
          expiresAt: expiresAt.toISOString(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Accept Invite ──
      case 'accept-invite': {
        const { inviteToken, firstName, lastName, phone, password } = body

        // Find pending invite
        const { data: invite, error: inviteError } = await adminClient
          .from('employee_profiles')
          .select('*')
          .eq('invite_token', inviteToken)
          .eq('invite_status', 'pending')
          .single()
        if (inviteError || !invite) {
          throw new Error('Invalid or expired invite')
        }

        // Check expiry
        if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
          await adminClient.from('employee_profiles')
            .update({ invite_status: 'expired' })
            .eq('id', invite.id)
          throw new Error('Invite has expired')
        }

        // Create auth user
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
          email: invite.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: `${firstName} ${lastName}` }
        })
        if (createError) throw createError

        // Update employee profile
        await adminClient.from('employee_profiles')
          .update({
            auth_user_id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
            is_active: true,
            invite_status: 'accepted',
            invite_token: null,
            invite_expires_at: null,
          })
          .eq('id', invite.id)

        return new Response(JSON.stringify({
          success: true,
          employeeProfileId: invite.id,
          authUserId: authData.user.id,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Resolve Profile (after login) ──
      case 'resolve-profile': {
        // 1. Check platform_admins FIRST
        const { data: platformAdmin } = await adminClient
          .from('platform_admins')
          .select('*')
          .eq('auth_user_id', caller!.id)
          .single()

        if (platformAdmin) {
          if (!platformAdmin.is_active) {
            return new Response(JSON.stringify({ error: 'Platform admin account is inactive.' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Update last login (no last_login_at column on platform_admins, use updated_at)
          await adminClient.from('platform_admins')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', platformAdmin.id)

          return new Response(JSON.stringify({
            type: 'platform_admin',
            platformAdmin,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 2. Check employee_profiles
        const { data: profile, error: profileError } = await adminClient
          .from('employee_profiles')
          .select(`
            *,
            employee_permissions (*),
            employee_visibility_overrides (*)
          `)
          .eq('auth_user_id', caller!.id)
          .single()

        if (profileError || !profile) {
          return new Response(JSON.stringify({ error: 'No employee profile found. Access denied.' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (!profile.is_active) {
          return new Response(JSON.stringify({ error: 'Account is inactive. Contact your store administrator.' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get store info
        const { data: store } = await adminClient
          .from('stores')
          .select('*')
          .eq('id', profile.store_id)
          .single()

        // Check store status
        if (store && store.status === 'suspended') {
          return new Response(JSON.stringify({ error: 'Your store has been suspended. Contact platform support.' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        if (store && store.status === 'banned') {
          return new Response(JSON.stringify({ error: 'Your store has been banned from the platform.' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Update last login
        await adminClient.from('employee_profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', profile.id)

        return new Response(JSON.stringify({
          type: 'store_user',
          profile,
          store,
          permissions: profile.employee_permissions?.[0] || null,
          visibility: profile.employee_visibility_overrides?.[0] || null,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Bootstrap Root Admin (one-time setup) ──
      case 'bootstrap-root-admin': {
        const { email, password, fullName } = body

        // Check if any platform admin already exists
        const { data: existing } = await adminClient
          .from('platform_admins')
          .select('id')
          .limit(1)

        if (existing && existing.length > 0) {
          return new Response(JSON.stringify({ error: 'Root admin already exists. Bootstrap denied.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create auth user
        const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, is_platform_admin: true }
        })
        if (signUpError) throw signUpError

        // Create platform_admins record
        await adminClient.from('platform_admins').insert({
          auth_user_id: authData.user.id,
          email,
          full_name: fullName,
          role: 'root_admin',
          is_active: true,
        })

        return new Response(JSON.stringify({
          success: true,
          message: 'Root admin bootstrapped successfully',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Update Employee ──
      case 'update-employee': {
        const { storeId, employeeProfileId, updates, permissionUpdates, visibilityUpdates } = body
        await verifyStoreOwner(storeId)

        if (updates) {
          await adminClient.from('employee_profiles')
            .update(updates)
            .eq('id', employeeProfileId)
            .eq('store_id', storeId)
        }

        if (permissionUpdates) {
          await adminClient.from('employee_permissions')
            .update(permissionUpdates)
            .eq('employee_profile_id', employeeProfileId)
        }

        if (visibilityUpdates) {
          await adminClient.from('employee_visibility_overrides')
            .update(visibilityUpdates)
            .eq('employee_profile_id', employeeProfileId)
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ── Toggle Employee Active/Inactive ──
      case 'toggle-employee-status': {
        const { storeId, employeeProfileId, isActive } = body
        await verifyStoreOwner(storeId)

        await adminClient.from('employee_profiles')
          .update({ is_active: isActive })
          .eq('id', employeeProfileId)
          .eq('store_id', storeId)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ── Delete Employee ──
      case 'delete-employee': {
        const { storeId, employeeProfileId } = body
        await verifyStoreOwner(storeId)

        // Get employee's auth_user_id before deletion
        const { data: emp } = await adminClient
          .from('employee_profiles')
          .select('auth_user_id')
          .eq('id', employeeProfileId)
          .eq('store_id', storeId)
          .single()

        // Delete employee profile (cascades to permissions and visibility)
        await adminClient.from('employee_profiles')
          .delete()
          .eq('id', employeeProfileId)
          .eq('store_id', storeId)

        // Optionally delete the auth user too
        if (emp?.auth_user_id) {
          await adminClient.auth.admin.deleteUser(emp.auth_user_id)
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ── List Employees ──
      case 'list-employees': {
        const { storeId } = body
        await verifyStoreOwner(storeId)

        const { data: employees, error } = await adminClient
          .from('employee_profiles')
          .select(`
            *,
            employee_permissions (*),
            employee_visibility_overrides (*)
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: true })

        if (error) throw error

        return new Response(JSON.stringify({ employees }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ── Reset Employee Password ──
      case 'reset-employee-password': {
        const { storeId, employeeProfileId } = body
        await verifyStoreOwner(storeId)

        const { data: emp } = await adminClient
          .from('employee_profiles')
          .select('email')
          .eq('id', employeeProfileId)
          .eq('store_id', storeId)
          .single()

        if (!emp) throw new Error('Employee not found')

        // Generate password reset link
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: emp.email,
        })
        if (error) throw error

        return new Response(JSON.stringify({
          success: true,
          message: 'Password reset email sent',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ── Resend Invite ──
      case 'resend-invite': {
        const { storeId, employeeProfileId } = body
        await verifyStoreOwner(storeId)

        const newToken = crypto.randomUUID() + '-' + crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await adminClient.from('employee_profiles')
          .update({
            invite_token: newToken,
            invite_expires_at: expiresAt.toISOString(),
            invite_status: 'pending',
          })
          .eq('id', employeeProfileId)
          .eq('store_id', storeId)

        return new Response(JSON.stringify({
          success: true,
          inviteToken: newToken,
          expiresAt: expiresAt.toISOString(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'admin-reset-password': {
        const { email: resetEmail, newPassword } = body
        // Look up user by email
        const { data: { users: foundUsers }, error: listErr } = await adminClient.auth.admin.listUsers()
        if (listErr) throw listErr
        const targetUser = foundUsers?.find((u: any) => u.email === resetEmail)
        if (!targetUser) throw new Error('User not found')
        const { error: resetErr } = await adminClient.auth.admin.updateUserById(targetUser.id, { password: newPassword })
        if (resetErr) throw resetErr
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (err: any) {
    console.error('Employee management error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ── Default permissions by role ──
function getDefaultPermissions(role: string) {
  const base = {
    can_access_take_in: true, can_access_inventory: true,
    can_access_customers: true, can_access_payouts: false,
    can_access_statistics: false, can_access_settings: false,
    can_access_saved_for_later: true, can_edit_rates: false,
    can_edit_final_payout_amount: false, can_print_labels: true,
    can_print_receipts: true, can_delete_items: false,
    can_complete_purchase: true, can_reopen_transactions: false,
  }

  switch (role) {
    case 'store_admin':
      return Object.fromEntries(Object.keys(base).map(k => [k, true]))
    case 'manager':
      return { ...base, can_access_payouts: true, can_access_statistics: true, can_access_settings: true, can_edit_rates: true, can_edit_final_payout_amount: true, can_delete_items: true, can_reopen_transactions: true }
    case 'buyer':
      return { ...base, can_edit_rates: false }
    case 'front_desk':
      return { ...base, can_access_take_in: false, can_complete_purchase: false }
    case 'read_only':
      return Object.fromEntries(Object.keys(base).map(k => [k, k.startsWith('can_access') ? true : false]))
    default:
      return base
  }
}

function getDefaultVisibility(role: string) {
  switch (role) {
    case 'store_admin':
    case 'manager':
      return { hide_profit: false, hide_percentage_paid: false, hide_market_value: false, hide_total_payout_breakdown: false, hide_average_rate: false }
    case 'buyer':
      return { hide_profit: true, hide_percentage_paid: true, hide_market_value: false, hide_total_payout_breakdown: false, hide_average_rate: false }
    case 'front_desk':
    case 'read_only':
      return { hide_profit: true, hide_percentage_paid: true, hide_market_value: true, hide_total_payout_breakdown: true, hide_average_rate: true }
    default:
      return { hide_profit: true, hide_percentage_paid: true, hide_market_value: false, hide_total_payout_breakdown: false, hide_average_rate: false }
  }
}
