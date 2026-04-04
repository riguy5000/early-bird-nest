
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL UNIQUE,
  general jsonb NOT NULL DEFAULT '{}',
  global_visibility jsonb NOT NULL DEFAULT '{}',
  intake_defaults jsonb NOT NULL DEFAULT '{}',
  payout_defaults jsonb NOT NULL DEFAULT '{}',
  rate_defaults jsonb NOT NULL DEFAULT '{}',
  customer_settings jsonb NOT NULL DEFAULT '{}',
  compliance_settings jsonb NOT NULL DEFAULT '{}',
  print_settings jsonb NOT NULL DEFAULT '{}',
  notification_settings jsonb NOT NULL DEFAULT '{}',
  appearance jsonb NOT NULL DEFAULT '{}',
  advanced jsonb NOT NULL DEFAULT '{}',
  employees jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to store_settings"
  ON public.store_settings FOR ALL
  TO public USING (true) WITH CHECK (true);

CREATE TABLE public.employee_visibility_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  employee_id text NOT NULL,
  hide_profit boolean DEFAULT false,
  hide_percentage_paid boolean DEFAULT false,
  hide_market_value boolean DEFAULT false,
  hide_total_payout_breakdown boolean DEFAULT false,
  UNIQUE(store_id, employee_id)
);

ALTER TABLE public.employee_visibility_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to employee_visibility_overrides"
  ON public.employee_visibility_overrides FOR ALL
  TO public USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_settings_updated_at();
