-- Saved refiner profiles per store
CREATE TABLE IF NOT EXISTS public.refiners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refiners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members read refiners"
  ON public.refiners FOR SELECT TO authenticated
  USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members insert refiners"
  ON public.refiners FOR INSERT TO authenticated
  WITH CHECK (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members update refiners"
  ON public.refiners FOR UPDATE TO authenticated
  USING (private.is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners manage refiners"
  ON public.refiners FOR ALL TO authenticated
  USING (private.owns_store(auth.uid(), store_id))
  WITH CHECK (private.owns_store(auth.uid(), store_id));

CREATE TRIGGER trg_refiners_updated_at
  BEFORE UPDATE ON public.refiners
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

-- Add extra refiner detail columns to scrap_batches
ALTER TABLE public.scrap_batches
  ADD COLUMN IF NOT EXISTS refiner_id uuid,
  ADD COLUMN IF NOT EXISTS refiner_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS refiner_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS refiner_email text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_refiners_store ON public.refiners(store_id);
CREATE INDEX IF NOT EXISTS idx_scrap_batches_refiner ON public.scrap_batches(refiner_id);
