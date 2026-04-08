
-- Inventory Batches
CREATE TABLE public.inventory_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  take_in_ref text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employee_profiles(id) ON DELETE SET NULL,
  total_payout numeric NOT NULL DEFAULT 0,
  total_items integer NOT NULL DEFAULT 0,
  batch_notes text DEFAULT '',
  batch_photos text[] DEFAULT '{}',
  source text NOT NULL DEFAULT 'take-in',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read batches" ON public.inventory_batches FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage batches" ON public.inventory_batches FOR ALL TO authenticated USING (owns_store(auth.uid(), store_id)) WITH CHECK (owns_store(auth.uid(), store_id));
CREATE POLICY "Store members can insert batches" ON public.inventory_batches FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id));
CREATE POLICY "Platform admins can read batches" ON public.inventory_batches FOR SELECT TO authenticated USING (is_platform_admin(auth.uid()));

-- Inventory Items
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Jewelry',
  subcategory text DEFAULT '',
  description text DEFAULT '',
  disposition text NOT NULL DEFAULT 'Undecided',
  processing_status text NOT NULL DEFAULT 'In Stock',
  metals jsonb DEFAULT '[]',
  stones jsonb DEFAULT '[]',
  watch_info jsonb DEFAULT '{}',
  test_method text DEFAULT '',
  weight numeric DEFAULT 0,
  market_value_at_intake numeric DEFAULT 0,
  payout_amount numeric DEFAULT 0,
  payout_percentage numeric DEFAULT 0,
  estimated_scrap_value numeric DEFAULT 0,
  estimated_resale_value numeric DEFAULT 0,
  selling_price numeric DEFAULT 0,
  sold_amount numeric DEFAULT 0,
  sold_date timestamptz,
  sale_channel text DEFAULT '',
  location text DEFAULT 'safe',
  location_notes text DEFAULT '',
  photos text[] DEFAULT '{}',
  notes text DEFAULT '',
  is_resellable boolean DEFAULT false,
  is_scrap_eligible boolean DEFAULT true,
  is_part_out_eligible boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  parent_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'take-in',
  take_in_item_ref text DEFAULT '',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employee_profiles(id) ON DELETE SET NULL,
  archive_reason text DEFAULT '',
  archive_date timestamptz,
  sent_to_refinery_date timestamptz,
  refinery_lot_id uuid,
  showroom_ready boolean DEFAULT false,
  showroom_location text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read items" ON public.inventory_items FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage items" ON public.inventory_items FOR ALL TO authenticated USING (owns_store(auth.uid(), store_id)) WITH CHECK (owns_store(auth.uid(), store_id));
CREATE POLICY "Store members can insert items" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id));
CREATE POLICY "Store members can update items" ON public.inventory_items FOR UPDATE TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Platform admins can read items" ON public.inventory_items FOR SELECT TO authenticated USING (is_platform_admin(auth.uid()));

-- Status History
CREATE TABLE public.inventory_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text DEFAULT '',
  new_value text DEFAULT '',
  changed_by uuid REFERENCES public.employee_profiles(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read history" ON public.inventory_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.inventory_items ii WHERE ii.id = item_id AND is_store_member(auth.uid(), ii.store_id))
);
CREATE POLICY "Store members can insert history" ON public.inventory_status_history FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.inventory_items ii WHERE ii.id = item_id AND is_store_member(auth.uid(), ii.store_id))
);

-- Refinery Lots
CREATE TABLE public.refinery_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  lot_number text NOT NULL DEFAULT '',
  item_ids uuid[] DEFAULT '{}',
  sent_date timestamptz,
  expected_melt_value numeric DEFAULT 0,
  actual_settlement numeric DEFAULT 0,
  difference numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refinery_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can read lots" ON public.refinery_lots FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Store owners can manage lots" ON public.refinery_lots FOR ALL TO authenticated USING (owns_store(auth.uid(), store_id)) WITH CHECK (owns_store(auth.uid(), store_id));
CREATE POLICY "Store members can insert lots" ON public.refinery_lots FOR INSERT TO authenticated WITH CHECK (is_store_member(auth.uid(), store_id));

-- Indexes
CREATE INDEX idx_inventory_items_store ON public.inventory_items(store_id);
CREATE INDEX idx_inventory_items_batch ON public.inventory_items(batch_id);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_disposition ON public.inventory_items(disposition);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(processing_status);
CREATE INDEX idx_inventory_items_parent ON public.inventory_items(parent_item_id);
CREATE INDEX idx_inventory_items_archived ON public.inventory_items(is_archived);
CREATE INDEX idx_inventory_batches_store ON public.inventory_batches(store_id);
CREATE INDEX idx_inventory_status_history_item ON public.inventory_status_history(item_id);
CREATE INDEX idx_refinery_lots_store ON public.refinery_lots(store_id);

-- Updated_at trigger
CREATE TRIGGER update_inventory_batches_updated_at BEFORE UPDATE ON public.inventory_batches FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();
CREATE TRIGGER update_refinery_lots_updated_at BEFORE UPDATE ON public.refinery_lots FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_updated_at();
