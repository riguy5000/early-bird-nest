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

/* Display raw market spot price per troy ounce for each metal */
function metalLabel(metal: string): string {
  return `${metal} / oz`;
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
      {prices.map(({ metal, price_usd }) => (
        <div key={metal} className="flex flex-col">
          <span className="text-[11px] text-[#A8A3AE] uppercase tracking-wider">{metalLabel(metal)}</span>
          <span className="text-[22px] font-semibold text-[#2B2833] tabular-nums tracking-tight">
            ${Number(price_usd).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
