
-- Drop the restrictive authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Authenticated users can insert store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Authenticated users can update store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Authenticated users can delete store_settings" ON public.store_settings;

-- Allow anon + authenticated to read/write (mock auth doesn't use Supabase sessions)
CREATE POLICY "Anyone can read store_settings"
  ON public.store_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert store_settings"
  ON public.store_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update store_settings"
  ON public.store_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete store_settings"
  ON public.store_settings FOR DELETE
  TO anon, authenticated USING (true);
