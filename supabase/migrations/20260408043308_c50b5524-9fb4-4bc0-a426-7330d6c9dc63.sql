
-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  date_of_birth text DEFAULT '',
  gender text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  license_number text DEFAULT '',
  id_scan_url text DEFAULT '',
  id_scan_back_url text DEFAULT '',
  ocr_payload jsonb DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Store members can read customers for their store
CREATE POLICY "Store members can read customers"
  ON public.customers FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

-- Store members can insert customers for their store
CREATE POLICY "Store members can insert customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id));

-- Store owners can manage (update/delete) customers
CREATE POLICY "Store owners can manage customers"
  ON public.customers FOR ALL TO authenticated
  USING (owns_store(auth.uid(), store_id))
  WITH CHECK (owns_store(auth.uid(), store_id));

-- Store employees can update customers in their store
CREATE POLICY "Store employees can update customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id));

-- Platform admins can read all customers
CREATE POLICY "Platform admins can read all customers"
  ON public.customers FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Create storage bucket for customer ID scans
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-id-scans', 'customer-id-scans', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for customer ID scans
CREATE POLICY "Authenticated users can upload ID scans"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-id-scans');

CREATE POLICY "Authenticated users can read ID scans"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'customer-id-scans');
