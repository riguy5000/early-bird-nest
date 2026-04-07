
-- Create platform_admins table
CREATE TABLE public.platform_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'root_admin' CHECK (role IN ('root_admin', 'support_admin', 'ops_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE auth_user_id = _user_id AND is_active = true
  )
$$;

-- RLS: platform admins can read all records
CREATE POLICY "Platform admins can read all"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- RLS: root_admin can manage all records
CREATE POLICY "Root admins can manage all"
ON public.platform_admins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE auth_user_id = auth.uid() AND role = 'root_admin' AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE auth_user_id = auth.uid() AND role = 'root_admin' AND is_active = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_platform_admins_updated_at
BEFORE UPDATE ON public.platform_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_store_settings_updated_at();
