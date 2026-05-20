
-- 1. Move SECURITY DEFINER helpers to a private schema (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon;

-- Drop dependent policies first so we can recreate referencing private.*
-- customers
DROP POLICY IF EXISTS "Platform admins can read all customers" ON public.customers;
DROP POLICY IF EXISTS "Store employees can update customers" ON public.customers;
DROP POLICY IF EXISTS "Store members can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Store members can read customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can manage customers" ON public.customers;
-- employee_permissions
DROP POLICY IF EXISTS "Employees can read own permissions" ON public.employee_permissions;
DROP POLICY IF EXISTS "Store owners can manage employee permissions" ON public.employee_permissions;
-- employee_profiles
DROP POLICY IF EXISTS "Employees can read own profile" ON public.employee_profiles;
DROP POLICY IF EXISTS "Platform admins can read all employees" ON public.employee_profiles;
DROP POLICY IF EXISTS "Store owners can manage employee profiles" ON public.employee_profiles;
-- employee_visibility_overrides
DROP POLICY IF EXISTS "Employees can read own visibility" ON public.employee_visibility_overrides;
DROP POLICY IF EXISTS "Store owners can manage employee visibility" ON public.employee_visibility_overrides;
-- inventory_batches
DROP POLICY IF EXISTS "Platform admins can read batches" ON public.inventory_batches;
DROP POLICY IF EXISTS "Store members can insert batches" ON public.inventory_batches;
DROP POLICY IF EXISTS "Store members can read batches" ON public.inventory_batches;
DROP POLICY IF EXISTS "Store owners can manage batches" ON public.inventory_batches;
-- inventory_items
DROP POLICY IF EXISTS "Platform admins can read items" ON public.inventory_items;
DROP POLICY IF EXISTS "Store members can insert items" ON public.inventory_items;
DROP POLICY IF EXISTS "Store members can read items" ON public.inventory_items;
DROP POLICY IF EXISTS "Store members can update items" ON public.inventory_items;
DROP POLICY IF EXISTS "Store owners can manage items" ON public.inventory_items;
-- inventory_status_history
DROP POLICY IF EXISTS "Store members can insert history" ON public.inventory_status_history;
DROP POLICY IF EXISTS "Store members can read history" ON public.inventory_status_history;
-- platform_admins
DROP POLICY IF EXISTS "Platform admins can read all" ON public.platform_admins;
DROP POLICY IF EXISTS "Root admins can manage all" ON public.platform_admins;
-- refinery_lots
DROP POLICY IF EXISTS "Store members can insert lots" ON public.refinery_lots;
DROP POLICY IF EXISTS "Store members can read lots" ON public.refinery_lots;
DROP POLICY IF EXISTS "Store owners can manage lots" ON public.refinery_lots;
-- scrap_batch_activity
DROP POLICY IF EXISTS "Store members can insert scrap_batch_activity" ON public.scrap_batch_activity;
DROP POLICY IF EXISTS "Store members can read scrap_batch_activity" ON public.scrap_batch_activity;
-- scrap_batch_items
DROP POLICY IF EXISTS "Store members can manage scrap_batch_items" ON public.scrap_batch_items;
DROP POLICY IF EXISTS "Store members can read scrap_batch_items" ON public.scrap_batch_items;
-- scrap_batches
DROP POLICY IF EXISTS "Platform admins can read scrap_batches" ON public.scrap_batches;
DROP POLICY IF EXISTS "Store members can insert scrap_batches" ON public.scrap_batches;
DROP POLICY IF EXISTS "Store members can read scrap_batches" ON public.scrap_batches;
DROP POLICY IF EXISTS "Store members can update scrap_batches" ON public.scrap_batches;
DROP POLICY IF EXISTS "Store owners can manage scrap_batches" ON public.scrap_batches;
-- store_settings
DROP POLICY IF EXISTS "Anon can read store_settings temporarily" ON public.store_settings;
DROP POLICY IF EXISTS "Anon can write store_settings temporarily" ON public.store_settings;
DROP POLICY IF EXISTS "Platform admins can read all store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Store members can read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Store owners can manage store_settings" ON public.store_settings;
-- stores
DROP POLICY IF EXISTS "Employees can read their store" ON public.stores;
DROP POLICY IF EXISTS "Platform admins can read all stores" ON public.stores;
DROP POLICY IF EXISTS "Platform admins can update any store" ON public.stores;
DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
-- kv_store and metal_api_keys and metal_prices (also covered below)
DROP POLICY IF EXISTS "Anon can write qr_scan entries" ON public.kv_store_62d2b480;
DROP POLICY IF EXISTS "Anyone can read kv_store" ON public.kv_store_62d2b480;
DROP POLICY IF EXISTS "Authenticated users can manage kv_store" ON public.kv_store_62d2b480;
DROP POLICY IF EXISTS "Anyone can read metal_api_keys" ON public.metal_api_keys;
DROP POLICY IF EXISTS "Authenticated users can manage metal_api_keys" ON public.metal_api_keys;
DROP POLICY IF EXISTS "Allow all access to metal_prices" ON public.metal_prices;
DROP POLICY IF EXISTS "No public delete to metal prices" ON public.metal_prices;
DROP POLICY IF EXISTS "No public insert to metal prices" ON public.metal_prices;
DROP POLICY IF EXISTS "No public update to metal prices" ON public.metal_prices;

-- Move functions to private schema (kept as SECURITY DEFINER for stable RLS context)
ALTER FUNCTION public.is_store_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.owns_store(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.get_employee_store_id(uuid) SET SCHEMA private;
ALTER FUNCTION public.is_platform_admin(uuid) SET SCHEMA private;

-- Re-grant EXECUTE so policies can still call them
GRANT EXECUTE ON FUNCTION private.is_store_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.owns_store(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.get_employee_store_id(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_admin(uuid) TO authenticated, anon;

-- 2. Recreate policies referencing private.*
-- customers
CREATE POLICY "Platform admins can read all customers" ON public.customers FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store members can read customers" ON public.customers FOR SELECT TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store employees can update customers" ON public.customers FOR UPDATE TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage customers" ON public.customers FOR ALL TO authenticated USING (private.owns_store(auth.uid(), store_id)) WITH CHECK (private.owns_store(auth.uid(), store_id));

-- employee_permissions
CREATE POLICY "Employees can read own permissions" ON public.employee_permissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = employee_permissions.employee_profile_id AND ep.auth_user_id = auth.uid()));
CREATE POLICY "Store owners can manage employee permissions" ON public.employee_permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = employee_permissions.employee_profile_id AND private.owns_store(auth.uid(), ep.store_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = employee_permissions.employee_profile_id AND private.owns_store(auth.uid(), ep.store_id)));

-- employee_profiles
CREATE POLICY "Employees can read own profile" ON public.employee_profiles FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Platform admins can read all employees" ON public.employee_profiles FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store owners can manage employee profiles" ON public.employee_profiles FOR ALL TO authenticated USING (private.owns_store(auth.uid(), store_id)) WITH CHECK (private.owns_store(auth.uid(), store_id));

-- employee_visibility_overrides
CREATE POLICY "Employees can read own visibility" ON public.employee_visibility_overrides FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = employee_visibility_overrides.employee_profile_id AND ep.auth_user_id = auth.uid()));
CREATE POLICY "Store owners can manage employee visibility" ON public.employee_visibility_overrides FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = employee_visibility_overrides.employee_profile_id AND private.owns_store(auth.uid(), ep.store_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = employee_visibility_overrides.employee_profile_id AND private.owns_store(auth.uid(), ep.store_id)));

-- inventory_batches
CREATE POLICY "Platform admins can read batches" ON public.inventory_batches FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store members can read batches" ON public.inventory_batches FOR SELECT TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can insert batches" ON public.inventory_batches FOR INSERT TO authenticated WITH CHECK (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage batches" ON public.inventory_batches FOR ALL TO authenticated USING (private.owns_store(auth.uid(), store_id)) WITH CHECK (private.owns_store(auth.uid(), store_id));

-- inventory_items
CREATE POLICY "Platform admins can read items" ON public.inventory_items FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store members can read items" ON public.inventory_items FOR SELECT TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can insert items" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can update items" ON public.inventory_items FOR UPDATE TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage items" ON public.inventory_items FOR ALL TO authenticated USING (private.owns_store(auth.uid(), store_id)) WITH CHECK (private.owns_store(auth.uid(), store_id));

-- inventory_status_history
CREATE POLICY "Store members can read history" ON public.inventory_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.inventory_items ii WHERE ii.id = inventory_status_history.item_id AND private.is_store_member(auth.uid(), ii.store_id)));
CREATE POLICY "Store members can insert history" ON public.inventory_status_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_items ii WHERE ii.id = inventory_status_history.item_id AND private.is_store_member(auth.uid(), ii.store_id)));

-- platform_admins
CREATE POLICY "Platform admins can read all" ON public.platform_admins FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Root admins can manage all" ON public.platform_admins FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.auth_user_id = auth.uid() AND pa.role = 'root_admin' AND pa.is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.auth_user_id = auth.uid() AND pa.role = 'root_admin' AND pa.is_active = true));

-- refinery_lots
CREATE POLICY "Store members can read lots" ON public.refinery_lots FOR SELECT TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can insert lots" ON public.refinery_lots FOR INSERT TO authenticated WITH CHECK (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage lots" ON public.refinery_lots FOR ALL TO authenticated USING (private.owns_store(auth.uid(), store_id)) WITH CHECK (private.owns_store(auth.uid(), store_id));

-- scrap_batch_activity
CREATE POLICY "Store members can read scrap_batch_activity" ON public.scrap_batch_activity FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_activity.batch_id AND private.is_store_member(auth.uid(), sb.store_id)));
CREATE POLICY "Store members can insert scrap_batch_activity" ON public.scrap_batch_activity FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_activity.batch_id AND private.is_store_member(auth.uid(), sb.store_id)));

-- scrap_batch_items
CREATE POLICY "Store members can read scrap_batch_items" ON public.scrap_batch_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_items.batch_id AND private.is_store_member(auth.uid(), sb.store_id)));
CREATE POLICY "Store members can manage scrap_batch_items" ON public.scrap_batch_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_items.batch_id AND private.is_store_member(auth.uid(), sb.store_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_items.batch_id AND private.is_store_member(auth.uid(), sb.store_id)));

-- scrap_batches
CREATE POLICY "Platform admins can read scrap_batches" ON public.scrap_batches FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store members can read scrap_batches" ON public.scrap_batches FOR SELECT TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can insert scrap_batches" ON public.scrap_batches FOR INSERT TO authenticated WITH CHECK (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can update scrap_batches" ON public.scrap_batches FOR UPDATE TO authenticated USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage scrap_batches" ON public.scrap_batches FOR ALL TO authenticated USING (private.owns_store(auth.uid(), store_id)) WITH CHECK (private.owns_store(auth.uid(), store_id));

-- stores
CREATE POLICY "Employees can read their store" ON public.stores FOR SELECT TO authenticated USING (private.is_store_member(auth.uid(), id));
CREATE POLICY "Platform admins can read all stores" ON public.stores FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can update any store" ON public.stores FOR UPDATE TO authenticated USING (private.is_platform_admin(auth.uid())) WITH CHECK (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store owners can manage their store" ON public.stores FOR ALL TO authenticated USING (owner_auth_user_id = auth.uid()) WITH CHECK (owner_auth_user_id = auth.uid());

-- 3. store_settings: remove anon temp policies; recreate authenticated policies
CREATE POLICY "Platform admins can read all store_settings" ON public.store_settings FOR SELECT TO authenticated USING (private.is_platform_admin(auth.uid()));
CREATE POLICY "Store members can read store_settings" ON public.store_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id::text = store_settings.store_id AND private.is_store_member(auth.uid(), s.id)));
CREATE POLICY "Store owners can manage store_settings" ON public.store_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id::text = store_settings.store_id AND private.owns_store(auth.uid(), s.id))) WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id::text = store_settings.store_id AND private.owns_store(auth.uid(), s.id)));

-- 4. kv_store: restrict to authenticated; keep narrow anon write for qr_scan_% only
CREATE POLICY "Authenticated can read kv_store" ON public.kv_store_62d2b480 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert kv_store" ON public.kv_store_62d2b480 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update kv_store" ON public.kv_store_62d2b480 FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete kv_store" ON public.kv_store_62d2b480 FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can insert qr_scan entries" ON public.kv_store_62d2b480 FOR INSERT TO anon WITH CHECK (key LIKE 'qr_scan_%');
CREATE POLICY "Anon can read qr_scan entries" ON public.kv_store_62d2b480 FOR SELECT TO anon USING (key LIKE 'qr_scan_%');

-- 5. metal_api_keys: platform admins only (the admin-settings edge function uses service role and bypasses RLS)
CREATE POLICY "Platform admins can manage metal_api_keys" ON public.metal_api_keys FOR ALL TO authenticated USING (private.is_platform_admin(auth.uid())) WITH CHECK (private.is_platform_admin(auth.uid()));

-- 6. metal_prices: public read of spot prices is OK; writes via service role only
CREATE POLICY "Public can read metal_prices" ON public.metal_prices FOR SELECT TO anon, authenticated USING (true);

-- 7. Storage bucket policies
DROP POLICY IF EXISTS "Allow delete batch photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload batch photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read ID scans" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ID scans" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for batch photos" ON storage.objects;

-- batch-photos: authenticated store members can upload/delete files under their store_id/ folder; public direct URL reads still work via bucket public flag
CREATE POLICY "Store members can upload batch photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'batch-photos'
    AND private.is_store_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Store members can delete batch photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'batch-photos'
    AND private.is_store_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- customer-id-scans: store members only, scoped by first folder = store_id
CREATE POLICY "Store members can read customer ID scans"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'customer-id-scans'
    AND private.is_store_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Store members can upload customer ID scans"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'customer-id-scans'
    AND private.is_store_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Store members can delete customer ID scans"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'customer-id-scans'
    AND private.is_store_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
