
-- Add status column to stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);

-- Platform admins can read all stores
CREATE POLICY "Platform admins can read all stores"
ON public.stores
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Platform admins can update any store
CREATE POLICY "Platform admins can update any store"
ON public.stores
FOR UPDATE
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Platform admins can read all employee profiles
CREATE POLICY "Platform admins can read all employees"
ON public.employee_profiles
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Platform admins can read all store settings
CREATE POLICY "Platform admins can read all store_settings"
ON public.store_settings
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));
