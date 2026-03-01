
-- Table to store multiple goldapi.io API keys with usage tracking
CREATE TABLE public.metal_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL DEFAULT 'Key',
  api_key TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'goldapi.io',
  is_active BOOLEAN NOT NULL DEFAULT true,
  monthly_limit INTEGER NOT NULL DEFAULT 100,
  requests_used INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Table to cache metal prices
CREATE TABLE public.metal_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metal TEXT NOT NULL,
  symbol TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  change_percent NUMERIC DEFAULT 0,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'goldapi.io'
);

-- Create unique index on metal for upsert
CREATE UNIQUE INDEX idx_metal_prices_metal ON public.metal_prices (metal);

-- Enable RLS
ALTER TABLE public.metal_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_prices ENABLE ROW LEVEL SECURITY;

-- API keys: only authenticated users (root admin enforced in app)
CREATE POLICY "Authenticated users can manage API keys"
ON public.metal_api_keys FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Metal prices: readable by all authenticated users
CREATE POLICY "Authenticated users can read metal prices"
ON public.metal_prices FOR SELECT
USING (auth.role() = 'authenticated');

-- Only edge functions (service role) write prices, but allow authenticated for admin
CREATE POLICY "Authenticated users can manage metal prices"
ON public.metal_prices FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
