import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MetalPrice {
  metal: string;
  price_usd: number;
  change_percent: number;
  fetched_at: string;
}

const FALLBACK_PRICES = [
  { metal: 'Gold',     price_usd: 1950.25, change_percent: 0, fetched_at: '' },
  { metal: 'Platinum', price_usd: 980.50,  change_percent: 0, fetched_at: '' },
  { metal: 'Silver',   price_usd: 24.30,   change_percent: 0, fetched_at: '' },
];

/* Per-gram value for the approved ticker display format: "Gold 14K/10g · $250.00" */
const KARAT_PURITY: Record<string, number> = {
  Gold:     14 / 24,   // 14K default display
  Silver:   0.925,     // Sterling
  Platinum: 0.95,
  Palladium: 0.95,
};
const GRAMS = 10;
const TROY_OZ_PER_GRAM = 1 / 31.1035;

function perGramValue(pricePerTroyOz: number, metal: string): number {
  const purity = KARAT_PURITY[metal] ?? 1;
  return pricePerTroyOz * TROY_OZ_PER_GRAM * purity * GRAMS;
}

function metalLabel(metal: string): string {
  if (metal === 'Gold')     return 'Gold 14K/10g';
  if (metal === 'Silver')   return 'Silver 92.5%/10g';
  if (metal === 'Platinum') return 'Platinum 95%/10g';
  return `${metal}/10g`;
}

export function MetalPriceTicker() {
  const [prices, setPrices] = useState<MetalPrice[]>(FALLBACK_PRICES);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('metal_prices')
        .select('metal, price_usd, change_percent, fetched_at')
        .order('metal');
      if (data && data.length > 0) setPrices(data as MetalPrice[]);
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6">
      {prices.map(({ metal, price_usd }) => {
        const val = perGramValue(Number(price_usd), metal);
        return (
          <div key={metal} className="flex flex-col">
            <span className="text-[11px] text-[#A8A3AE] uppercase tracking-wider">{metalLabel(metal)}</span>
            <span className="text-[22px] font-semibold text-[#2B2833] tabular-nums tracking-tight">
              ${val.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
