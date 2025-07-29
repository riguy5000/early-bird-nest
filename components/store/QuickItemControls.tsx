import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gem, Watch, Coins, Sparkles, Utensils, Plus } from 'lucide-react';

interface QuickItemControlsProps {
  onAddItem: (category: string) => void;
  itemCounts: Record<string, number>;
}

const categoryIcons = {
  Jewelry: Gem,
  Watch: Watch,
  Bullion: Coins,
  Stones: Sparkles,
  Silverware: Utensils,
};

export function QuickItemControls({ onAddItem, itemCounts }: QuickItemControlsProps) {
  const categories = ['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware'];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {categories.map((category) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons];
        const count = itemCounts[category] || 0;
        
        return (
          <Button
            key={category}
            variant={count > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => onAddItem(category)}
            className={`flex items-center gap-2 whitespace-nowrap ${
              count > 0 
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {category}
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {count}
              </Badge>
            )}
            <Plus className="h-3 w-3 opacity-50" />
          </Button>
        );
      })}
    </div>
  );
}