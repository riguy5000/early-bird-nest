ALTER TABLE public.scrap_batches
  ADD COLUMN IF NOT EXISTS assay_gold_spot_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assay_silver_spot_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assay_platinum_spot_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assay_palladium_spot_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assay_spot_price_timestamp timestamptz;