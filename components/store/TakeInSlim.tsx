import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Eye, 
  MoreHorizontal,
  Zap,
  Calculator
} from 'lucide-react';

interface TakeInSlimProps {
  items: any[];
  onItemAdd: () => void;
  onItemUpdate: (itemId: string, updates: any) => void;
  onItemRemove: (itemId: string) => void;
  store: any;
  onSwitchToDetailed: () => void;
}

export function TakeInSlim({
  items,
  onItemAdd,
  onItemUpdate,
  onItemRemove,
  store,
  onSwitchToDetailed
}: TakeInSlimProps) {
  const [focusedRow, setFocusedRow] = useState<string | null>(null);

  const addNewLine = () => {
    onItemAdd();
  };

  const updateMetalInItem = (itemId: string, metalIndex: number, field: string, value: any) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.metals[metalIndex]) return;

    const updatedMetals = [...item.metals];
    updatedMetals[metalIndex] = { ...updatedMetals[metalIndex], [field]: value };

    // Recalculate pricing
    const totalWeight = updatedMetals.reduce((sum: number, m: any) => sum + (m.weight || 0), 0);
    const marketValue = totalWeight * 50; // Mock pricing
    const payoutAmount = marketValue * (item.payoutPercentage / 100);

    onItemUpdate(itemId, {
      metals: updatedMetals,
      marketValue,
      payoutAmount
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string, metalIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Find next weight input or add new line
      const nextItem = items[items.findIndex(i => i.id === itemId) + 1];
      if (nextItem) {
        setFocusedRow(nextItem.id);
      } else {
        addNewLine();
      }
    }
  };

  const totalPayout = items.reduce((sum, item) => sum + (item.payoutAmount || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Fast Entry Mode</h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Speed Focus
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {!store.hidePayout && (
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  ${totalPayout.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Total Payout</div>
              </div>
            )}
            
            <Button variant="outline" onClick={onSwitchToDetailed}>
              <Eye className="h-4 w-4 mr-2" />
              Switch to Detailed
            </Button>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-2 p-4 border-b bg-muted/20 text-sm font-medium text-muted-foreground">
        <div>#</div>
        <div>Metal Type</div>
        <div>Karat</div>
        <div>Weight (g)</div>
        <div>Payout</div>
        <div>Actions</div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Quick Entry Ready</h3>
              <p className="text-muted-foreground mb-4">Start entering metal details for instant quotes</p>
              <Button onClick={addNewLine}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {items.map((item, itemIndex) => 
              item.metals?.map((metal: any, metalIndex: number) => (
                <div 
                  key={`${item.id}-${metalIndex}`}
                  className={`grid grid-cols-6 gap-2 p-3 rounded-lg border transition-colors ${
                    focusedRow === item.id ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Item Number */}
                  <div className="flex items-center text-sm font-medium">
                    {itemIndex + 1}.{metalIndex + 1}
                  </div>

                  {/* Metal Type */}
                  <div>
                    <Select 
                      value={metal.type} 
                      onValueChange={(value) => updateMetalInItem(item.id, metalIndex, 'type', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                        <SelectItem value="Palladium">Palladium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Karat */}
                  <div>
                    <Select 
                      value={metal.karat?.toString()} 
                      onValueChange={(value) => updateMetalInItem(item.id, metalIndex, 'karat', parseInt(value))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8K</SelectItem>
                        <SelectItem value="10">10K</SelectItem>
                        <SelectItem value="14">14K</SelectItem>
                        <SelectItem value="18">18K</SelectItem>
                        <SelectItem value="22">22K</SelectItem>
                        <SelectItem value="24">24K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight */}
                  <div>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={metal.weight || ''} 
                      onChange={(e) => updateMetalInItem(item.id, metalIndex, 'weight', parseFloat(e.target.value) || 0)}
                      onFocus={() => setFocusedRow(item.id)}
                      onKeyDown={(e) => handleKeyDown(e, item.id, metalIndex)}
                      placeholder="0.00"
                      className="h-9"
                      autoFocus={itemIndex === items.length - 1 && metalIndex === 0}
                    />
                  </div>

                  {/* Payout */}
                  <div className="flex items-center">
                    {!store.hidePayout && (
                      <div className="font-medium text-primary">
                        ${((metal.weight || 0) * 50 * (item.payoutPercentage / 100)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onItemRemove(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="More options"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="border-t p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={addNewLine} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Press <Badge variant="outline" className="px-1 py-0 text-xs">Enter</Badge> to add next line
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>
            
            <Button variant="outline" size="sm">
              Save & Print Labels
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}