import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MetalPriceTicker() {
  const prices = [
    { metal: 'Gold', price: 1950.25, change: 2.5 },
    { metal: 'Silver', price: 24.30, change: -0.15 },
    { metal: 'Platinum', price: 980.50, change: 1.2 }
  ];

  return (
    <div className="flex items-center gap-2">
      {prices.map(({ metal, price, change }) => (
        <Badge key={metal} variant="outline" className="flex items-center gap-1">
          <span className="text-xs font-medium">{metal}</span>
          <span className="text-xs">${price}</span>
          {change > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
        </Badge>
      ))}
    </div>
  );
}