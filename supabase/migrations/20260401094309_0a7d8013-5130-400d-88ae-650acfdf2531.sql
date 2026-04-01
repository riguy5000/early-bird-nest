
DROP POLICY IF EXISTS "No public write to metal prices" ON public.metal_prices;

CREATE POLICY "No public insert to metal prices" ON public.metal_prices
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public update to metal prices" ON public.metal_prices
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "No public delete to metal prices" ON public.metal_prices
  FOR DELETE USING (false);
