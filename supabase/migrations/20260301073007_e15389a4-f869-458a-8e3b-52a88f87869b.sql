
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage API keys" ON public.metal_api_keys;
DROP POLICY IF EXISTS "Authenticated users can read metal prices" ON public.metal_prices;
DROP POLICY IF EXISTS "Authenticated users can manage metal prices" ON public.metal_prices;

-- Create permissive policies (app-level auth handles access control)
CREATE POLICY "Allow all access to metal_api_keys" ON public.metal_api_keys
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to metal_prices" ON public.metal_prices
FOR ALL USING (true) WITH CHECK (true);
