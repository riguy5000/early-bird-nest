import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MetalPrice {
  metal: string;
  price_usd: number;
  change_percent: number;
  fetched_at: string;
}

const FALLBACK_PRICES = [
  { metal: 'Gold', price_usd: 1950.25, change_percent: 0, fetched_at: '' },
  { metal: 'Silver', price_usd: 24.30, change_percent: 0, fetched_at: '' },
  { metal: 'Platinum', price_usd: 980.50, change_percent: 0, fetched_at: '' },
];

export function MetalPriceTicker() {
  const [prices, setPrices] = useState<MetalPrice[]>(FALLBACK_PRICES);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('metal_prices')
        .select('metal, price_usd, change_percent, fetched_at')
        .order('metal');
      if (data && data.length > 0) {
        setPrices(data as MetalPrice[]);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {prices.map(({ metal, price_usd, change_percent }, i) => (
        <React.Fragment key={metal}>
          {i > 0 && <span className="mx-1.5 text-border">·</span>}
          <span className="font-medium text-foreground/70">{metal}</span>
          <span className="tabular-nums">${Number(price_usd).toFixed(2)}</span>
          {Number(change_percent) >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
        </React.Fragment>
      ))}
      {prices[0]?.fetched_at && (
        <>
          <span className="mx-1.5 text-border">·</span>
          <span className="text-muted-foreground/60">
            {new Date(prices[0].fetched_at).toLocaleTimeString()}
          </span>
        </>
      )}
    </div>
  );
}
