
DROP POLICY IF EXISTS "Authenticated can insert kv_store" ON public.kv_store_62d2b480;
DROP POLICY IF EXISTS "Authenticated can update kv_store" ON public.kv_store_62d2b480;
DROP POLICY IF EXISTS "Authenticated can delete kv_store" ON public.kv_store_62d2b480;

CREATE POLICY "Authenticated can insert kv_store" ON public.kv_store_62d2b480
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update kv_store" ON public.kv_store_62d2b480
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete kv_store" ON public.kv_store_62d2b480
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
