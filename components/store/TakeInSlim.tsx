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
  onItemAdd: (category?: string) => void;
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
    <div className="flex flex-col h-full max-w-[1280px] mx-auto">
      {/* Slim Header */}
      <div className="px-6 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Fast Entry</h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Speed Mode
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {!store.hidePayout && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${totalPayout.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Total Payout</div>
              </div>
            )}
            
            <Button variant="outline" onClick={onSwitchToDetailed}>
              <Eye className="h-4 w-4 mr-2" />
              Detailed View
            </Button>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b bg-slate-50/60 text-sm font-medium text-slate-600">
        <div>#</div>
        <div>Metal Type</div>
        <div>Karat</div>
        <div>Weight (g)</div>
        <div>Payout</div>
        <div>Actions</div>
      </div>

      {/* Items List - Table format */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quick Entry Ready</h3>
              <p className="text-muted-foreground mb-4">Start entering metal details for instant quotes</p>
              <Button onClick={addNewLine} className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-2">
            {items.map((item, itemIndex) => 
              item.metals?.map((metal: any, metalIndex: number) => (
                <div 
                  key={`${item.id}-${metalIndex}`}
                  className={`grid grid-cols-6 gap-4 py-2 border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                    focusedRow === item.id ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Item Number */}
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    {itemIndex + 1}.{metalIndex + 1}
                  </div>

                  {/* Metal Type */}
                  <div>
                    <Select 
                      value={metal.type} 
                      onValueChange={(value) => updateMetalInItem(item.id, metalIndex, 'type', value)}
                    >
                      <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-slate-50">
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
                      <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-slate-50">
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

                  {/* Weight - Auto-focus on last item */}
                  <div>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={metal.weight || ''} 
                      onChange={(e) => updateMetalInItem(item.id, metalIndex, 'weight', parseFloat(e.target.value) || 0)}
                      onFocus={() => setFocusedRow(item.id)}
                      onKeyDown={(e) => handleKeyDown(e, item.id, metalIndex)}
                      placeholder="0.00"
                      className="h-8 border-0 border-b-2 border-slate-200 rounded-none bg-transparent focus:border-primary"
                      autoFocus={itemIndex === items.length - 1 && metalIndex === 0}
                    />
                  </div>

                  {/* Payout - Number count animation */}
                  <div className="flex items-center">
                    {!store.hidePayout && (
                      <div className="font-semibold text-primary text-sm">
                        ${((metal.weight || 0) * 50 * (item.payoutPercentage / 100)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onItemRemove(item.id)}
                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-slate-100"
                      title="Save for later"
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

      {/* FAB for Add Item - bottom-right */}
      {items.length > 0 && (
        <div className="fixed bottom-20 right-6 z-20">
          <Button 
            onClick={addNewLine} 
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}