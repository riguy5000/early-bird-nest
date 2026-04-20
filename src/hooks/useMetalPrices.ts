import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SpotPrices } from '@/lib/pricing';

const FALLBACK: SpotPrices = {
  Gold: 1950.25,
  Silver: 24.30,
  Platinum: 980.50,
  Palladium: 950.00,
};

/**
 * Live spot prices (USD per troy ounce) keyed by metal name.
 * Refreshes from `metal_prices` every 5 minutes; falls back to sensible defaults.
 */
export function useMetalPrices(): SpotPrices {
  const [prices, setPrices] = useState<SpotPrices>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('metal_prices')
        .select('metal, price_usd')
        .order('fetched_at', { ascending: false });
      if (cancelled || !data || data.length === 0) return;
      // Take most recent per metal
      const next: SpotPrices = { ...FALLBACK };
      const seen = new Set<string>();
      for (const row of data as Array<{ metal: string; price_usd: number }>) {
        const k = row.metal;
        if (seen.has(k)) continue;
        seen.add(k);
        next[k] = Number(row.price_usd) || 0;
      }
      setPrices(next);
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return prices;
}
