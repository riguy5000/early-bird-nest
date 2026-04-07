
-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'jewelry_pawn',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  logo_url TEXT DEFAULT '',
  owner_auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Store owner can do everything with their store
CREATE POLICY "Store owners can manage their store"
  ON public.stores FOR ALL
  TO authenticated
  USING (owner_auth_user_id = auth.uid())
  WITH CHECK (owner_auth_user_id = auth.uid());

-- Employees can read their store (via a security definer function we'll create)
-- For now, authenticated users can read stores they belong to

-- Create employee_profiles table
CREATE TABLE public.employee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('store_admin', 'manager', 'buyer', 'front_desk', 'read_only')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT DEFAULT '',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_status TEXT NOT NULL DEFAULT 'active' CHECK (invite_status IN ('pending', 'accepted', 'active', 'expired')),
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create employee_permissions table
CREATE TABLE public.employee_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_profile_id UUID NOT NULL UNIQUE REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  can_access_take_in BOOLEAN NOT NULL DEFAULT true,
  can_access_inventory BOOLEAN NOT NULL DEFAULT true,
  can_access_customers BOOLEAN NOT NULL DEFAULT true,
  can_access_payouts BOOLEAN NOT NULL DEFAULT true,
  can_access_statistics BOOLEAN NOT NULL DEFAULT false,
  can_access_settings BOOLEAN NOT NULL DEFAULT false,
  can_access_saved_for_later BOOLEAN NOT NULL DEFAULT true,
  can_edit_rates BOOLEAN NOT NULL DEFAULT false,
  can_edit_final_payout_amount BOOLEAN NOT NULL DEFAULT false,
  can_print_labels BOOLEAN NOT NULL DEFAULT true,
  can_print_receipts BOOLEAN NOT NULL DEFAULT true,
  can_delete_items BOOLEAN NOT NULL DEFAULT false,
  can_complete_purchase BOOLEAN NOT NULL DEFAULT true,
  can_reopen_transactions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- Create employee_visibility_overrides table
CREATE TABLE public.employee_visibility_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_profile_id UUID NOT NULL UNIQUE REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  hide_profit BOOLEAN NOT NULL DEFAULT false,
  hide_percentage_paid BOOLEAN NOT NULL DEFAULT false,
  hide_market_value BOOLEAN NOT NULL DEFAULT false,
  hide_total_payout_breakdown BOOLEAN NOT NULL DEFAULT false,
  hide_average_rate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_visibility_overrides ENABLE ROW LEVEL SECURITY;

-- Security definer function to check store membership
CREATE OR REPLACE FUNCTION public.get_employee_store_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.employee_profiles
  WHERE auth_user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Security definer function to check if user owns a store
CREATE OR REPLACE FUNCTION public.owns_store(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_auth_user_id = _user_id
  )
$$;

-- Security definer function to check if user is employee of a store
CREATE OR REPLACE FUNCTION public.is_store_member(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE auth_user_id = _user_id AND store_id = _store_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_auth_user_id = _user_id
  )
$$;

-- Employees can read their own store
CREATE POLICY "Employees can read their store"
  ON public.stores FOR SELECT
  TO authenticated
  USING (public.is_store_member(auth.uid(), id));

-- Employee profiles: store owners can manage, employees can read own
CREATE POLICY "Store owners can manage employee profiles"
  ON public.employee_profiles FOR ALL
  TO authenticated
  USING (public.owns_store(auth.uid(), store_id))
  WITH CHECK (public.owns_store(auth.uid(), store_id));

CREATE POLICY "Employees can read own profile"
  ON public.employee_profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Employee permissions: store owners manage, employees read own
CREATE POLICY "Store owners can manage employee permissions"
  ON public.employee_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles ep
      WHERE ep.id = employee_profile_id
      AND public.owns_store(auth.uid(), ep.store_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employee_profiles ep
      WHERE ep.id = employee_profile_id
      AND public.owns_store(auth.uid(), ep.store_id)
    )
  );

CREATE POLICY "Employees can read own permissions"
  ON public.employee_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles ep
      WHERE ep.id = employee_profile_id AND ep.auth_user_id = auth.uid()
    )
  );

-- Employee visibility: store owners manage, employees read own
CREATE POLICY "Store owners can manage employee visibility"
  ON public.employee_visibility_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles ep
      WHERE ep.id = employee_profile_id
      AND public.owns_store(auth.uid(), ep.store_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employee_profiles ep
      WHERE ep.id = employee_profile_id
      AND public.owns_store(auth.uid(), ep.store_id)
    )
  );

CREATE POLICY "Employees can read own visibility"
  ON public.employee_visibility_overrides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles ep
      WHERE ep.id = employee_profile_id AND ep.auth_user_id = auth.uid()
    )
  );

-- Update store_settings RLS to be scoped to store owners/members
DROP POLICY IF EXISTS "Anyone can read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can insert store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can update store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can delete store_settings" ON public.store_settings;

CREATE POLICY "Store members can read store_settings"
  ON public.store_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = store_id
      AND public.is_store_member(auth.uid(), s.id)
    )
  );

CREATE POLICY "Store owners can manage store_settings"
  ON public.store_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = store_id
      AND public.owns_store(auth.uid(), s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = store_id
      AND public.owns_store(auth.uid(), s.id)
    )
  );

-- Add anon read for store_settings during transition (will remove later)
CREATE POLICY "Anon can read store_settings temporarily"
  ON public.store_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can write store_settings temporarily"
  ON public.store_settings FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamps
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

CREATE TRIGGER update_employee_permissions_updated_at
  BEFORE UPDATE ON public.employee_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

CREATE TRIGGER update_employee_visibility_updated_at
  BEFORE UPDATE ON public.employee_visibility_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

-- Add indexes
CREATE INDEX idx_employee_profiles_auth_user ON public.employee_profiles(auth_user_id);
CREATE INDEX idx_employee_profiles_store ON public.employee_profiles(store_id);
CREATE INDEX idx_employee_profiles_email ON public.employee_profiles(email);
CREATE INDEX idx_employee_profiles_invite_token ON public.employee_profiles(invite_token) WHERE invite_token IS NOT NULL;
