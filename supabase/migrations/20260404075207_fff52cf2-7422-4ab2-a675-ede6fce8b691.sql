
-- Drop the redundant employee_visibility_overrides table
DROP TABLE IF EXISTS public.employee_visibility_overrides;

-- Tighten store_settings RLS: replace permissive "true" policy
DROP POLICY IF EXISTS "Allow all access to store_settings" ON public.store_settings;

CREATE POLICY "Authenticated users can read store_settings"
  ON public.store_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert store_settings"
  ON public.store_settings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update store_settings"
  ON public.store_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete store_settings"
  ON public.store_settings FOR DELETE
  TO authenticated USING (true);

-- Tighten metal_api_keys: only authenticated can write
DROP POLICY IF EXISTS "Allow all access to metal_api_keys" ON public.metal_api_keys;

CREATE POLICY "Anyone can read metal_api_keys"
  ON public.metal_api_keys FOR SELECT
  TO public USING (true);

CREATE POLICY "Authenticated users can manage metal_api_keys"
  ON public.metal_api_keys FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Tighten kv_store: only authenticated can write
DROP POLICY IF EXISTS "Allow all access to kv_store" ON public.kv_store_62d2b480;

CREATE POLICY "Anyone can read kv_store"
  ON public.kv_store_62d2b480 FOR SELECT
  TO public USING (true);

CREATE POLICY "Authenticated users can manage kv_store"
  ON public.kv_store_62d2b480 FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
