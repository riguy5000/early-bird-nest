CREATE POLICY "Allow all access to kv_store"
  ON public.kv_store_62d2b480
  FOR ALL
  USING (true)
  WITH CHECK (true);