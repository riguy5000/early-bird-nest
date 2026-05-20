
-- scrap_batches table
CREATE TABLE public.scrap_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  batch_number text NOT NULL DEFAULT ('SB-' || to_char(now(), 'YYYYMMDDHH24MISS')),
  status text NOT NULL DEFAULT 'draft', -- draft | sent | assay_received | settled | closed
  refiner_name text NOT NULL DEFAULT '',
  refiner_contact text NOT NULL DEFAULT '',
  shipping_method text NOT NULL DEFAULT '',
  tracking_number text NOT NULL DEFAULT '',
  insurance_amount numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  sent_at timestamptz,
  assay_received_at timestamptz,
  settled_at timestamptz,
  closed_at timestamptz,
  estimated_gross_value numeric NOT NULL DEFAULT 0,
  estimated_fee numeric NOT NULL DEFAULT 0,
  estimated_net_value numeric NOT NULL DEFAULT 0,
  assay_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  refiner_reference text NOT NULL DEFAULT '',
  refiner_fee_actual numeric NOT NULL DEFAULT 0,
  loss_notes text NOT NULL DEFAULT '',
  final_settlement_amount numeric NOT NULL DEFAULT 0,
  settlement_method text NOT NULL DEFAULT '', -- '' | cash | metal | partial
  cash_received numeric NOT NULL DEFAULT 0,
  cash_payment_method text NOT NULL DEFAULT '',
  cash_reference text NOT NULL DEFAULT '',
  cash_received_at timestamptz,
  attachment_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scrap_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read scrap_batches"
  ON public.scrap_batches FOR SELECT TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store members can insert scrap_batches"
  ON public.scrap_batches FOR INSERT TO authenticated
  WITH CHECK (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store members can update scrap_batches"
  ON public.scrap_batches FOR UPDATE TO authenticated
  USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Store owners can manage scrap_batches"
  ON public.scrap_batches FOR ALL TO authenticated
  USING (owns_store(auth.uid(), store_id))
  WITH CHECK (owns_store(auth.uid(), store_id));

CREATE POLICY "Platform admins can read scrap_batches"
  ON public.scrap_batches FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE TRIGGER update_scrap_batches_updated_at
  BEFORE UPDATE ON public.scrap_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

CREATE INDEX idx_scrap_batches_store ON public.scrap_batches(store_id);
CREATE INDEX idx_scrap_batches_status ON public.scrap_batches(status);

-- scrap_batch_items table
CREATE TABLE public.scrap_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.scrap_batches(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL,
  send_out_weight numeric NOT NULL DEFAULT 0,
  original_weight numeric NOT NULL DEFAULT 0,
  metal text NOT NULL DEFAULT '',
  purity text NOT NULL DEFAULT '',
  estimated_value numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scrap_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read scrap_batch_items"
  ON public.scrap_batch_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_items.batch_id AND is_store_member(auth.uid(), sb.store_id)));

CREATE POLICY "Store members can manage scrap_batch_items"
  ON public.scrap_batch_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_items.batch_id AND is_store_member(auth.uid(), sb.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_items.batch_id AND is_store_member(auth.uid(), sb.store_id)));

CREATE TRIGGER update_scrap_batch_items_updated_at
  BEFORE UPDATE ON public.scrap_batch_items
  FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();

CREATE INDEX idx_scrap_batch_items_batch ON public.scrap_batch_items(batch_id);
CREATE INDEX idx_scrap_batch_items_inventory ON public.scrap_batch_items(inventory_item_id);

-- scrap_batch_activity table
CREATE TABLE public.scrap_batch_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.scrap_batches(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scrap_batch_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read scrap_batch_activity"
  ON public.scrap_batch_activity FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_activity.batch_id AND is_store_member(auth.uid(), sb.store_id)));

CREATE POLICY "Store members can insert scrap_batch_activity"
  ON public.scrap_batch_activity FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.scrap_batches sb WHERE sb.id = scrap_batch_activity.batch_id AND is_store_member(auth.uid(), sb.store_id)));

CREATE INDEX idx_scrap_batch_activity_batch ON public.scrap_batch_activity(batch_id);

-- inventory_items: link to scrap batch
ALTER TABLE public.inventory_items
  ADD COLUMN scrap_batch_id uuid REFERENCES public.scrap_batches(id) ON DELETE SET NULL;

CREATE INDEX idx_inventory_items_scrap_batch ON public.inventory_items(scrap_batch_id);
