import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronRight,
  Camera,
  Upload,
  X,
  Zap,
  Package,
  User,
  ScanLine,
  Gem,
  Watch,
  Coins,
  Sparkles,
  Utensils,
  Heart,
  DollarSign,
  Save,
  Printer
} from 'lucide-react';
import { MetalPriceTicker } from './MetalPriceTicker';
import { CustomerDrawer } from './CustomerDrawer';

interface TakeInBalancedProps {
  items: any[];
  activeItemId: string | null;
  onItemAdd: () => void;
  onItemUpdate: (itemId: string, updates: any) => void;
  onItemRemove: (itemId: string) => void;
  onItemSelect: (itemId: string) => void;
  store: any;
}

export function TakeInBalanced({
  items,
  activeItemId,
  onItemAdd,
  onItemUpdate,
  onItemRemove,
  onItemSelect,
  store
}: TakeInBalancedProps) {
  const [expandedAdvanced, setExpandedAdvanced] = useState<Set<string>>(new Set());
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [batchPhotoOpen, setBatchPhotoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const weightInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        // Open AI Assist
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const toggleAdvanced = (itemId: string) => {
    setExpandedAdvanced(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const addItemByCategory = (category: string) => {
    onItemAdd();
    // Auto-set category for new item
    setTimeout(() => {
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        onItemUpdate(lastItem.id, { category });
      }
    }, 100);
  };

  const addMetal = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newMetal = {
      id: `metal_${Date.now()}`,
      type: 'Gold',
      karat: 14,
      weight: 0
    };

    onItemUpdate(itemId, {
      metals: [...item.metals, newMetal]
    });
  };

  const updateMetal = (itemId: string, metalId: string, updates: any) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const updatedMetals = item.metals.map((m: any) => 
      m.id === metalId ? { ...m, ...updates } : m
    );

    // Recalculate pricing with animation
    const totalWeight = updatedMetals.reduce((sum: number, m: any) => sum + (m.weight || 0), 0);
    const marketValue = totalWeight * 50; // Mock pricing
    const payoutAmount = marketValue * (item.payoutPercentage / 100);

    onItemUpdate(itemId, {
      metals: updatedMetals,
      marketValue,
      payoutAmount
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string, metalId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const currentMetalIndex = item.metals.findIndex((m: any) => m.id === metalId);
      const nextMetalIndex = currentMetalIndex + 1;

      if (nextMetalIndex < item.metals.length) {
        // Focus next weight input in same item
        const nextMetalId = item.metals[nextMetalIndex].id;
        const nextRef = weightInputRefs.current[`${itemId}_${nextMetalId}`];
        if (nextRef) nextRef.focus();
      } else {
        // Focus first weight input of next item or add new metal
        const currentItemIndex = items.findIndex(i => i.id === itemId);
        if (currentItemIndex < items.length - 1) {
          const nextItem = items[currentItemIndex + 1];
          if (nextItem.metals.length > 0) {
            const nextRef = weightInputRefs.current[`${nextItem.id}_${nextItem.metals[0].id}`];
            if (nextRef) nextRef.focus();
          }
        }
      }
    }
  };

  const totalPayout = items.reduce((sum, item) => sum + (item.payoutAmount || 0), 0);
  const totalMarket = items.reduce((sum, item) => sum + (item.marketValue || 0), 0);
  const avgPayout = totalMarket > 0 ? (totalPayout / totalMarket * 100) : 0;
  const profit = totalMarket - totalPayout;

  const categoryIcons = {
    Jewelry: Gem,
    Watch: Watch,
    Bullion: Coins,
    Stones: Sparkles,
    Silverware: Utensils,
  };

  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Jewelry';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Navigation */}
      <div className="h-16 border-b bg-background flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-semibold">Take-In #{store?.name || 'STORE'}-{new Date().toLocaleDateString().replace(/\//g, '')}-001</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setBatchPhotoOpen(true)}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Batch Photos
          </Button>
        </div>
        <div className="text-xs text-slate-500 flex gap-4">
          <span>⌘+J: AI Assist</span>
          <span>Tab: Next field</span>
        </div>
      </div>

      {/* Metal Price Ticker */}
      <div className="bg-slate-50/80 backdrop-blur border-b flex-shrink-0">
        <MetalPriceTicker />
      </div>

      {/* Main Content - Single Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Section with Add Buttons */}
          <div className="p-4 border-b bg-slate-50/30 flex-shrink-0">
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryIcons).map(([category, Icon]) => {
                const count = itemsByCategory[category]?.length || 0;
                return (
                  <div key={category} className="flex items-center gap-2">
                    <Button
                      onClick={() => addItemByCategory(category)}
                      variant={count > 0 ? "default" : "outline"}
                      size="sm"
                      className={`flex items-center gap-2 ${
                        count > 0 
                          ? 'bg-slate-900 text-white hover:bg-slate-800' 
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {count}
                        </Badge>
                      )}
                      <Plus className="h-3 w-3 opacity-60" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items List - Compact Cards */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to start</h3>
                  <p className="text-muted-foreground mb-4">Click a category above to add your first item</p>
                </div>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow animate-scale-in">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {React.createElement(categoryIcons[item.category as keyof typeof categoryIcons] || Gem, { 
                        className: "h-5 w-5 text-slate-600" 
                      })}
                      <div>
                        <div className="font-medium text-sm">{item.category || 'Item'} {index + 1}</div>
                        <div className="text-xs text-slate-500">{item.subType || 'No description'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.saveForLater || false}
                        onCheckedChange={(checked) => onItemUpdate(item.id, { saveForLater: checked })}
                        className="scale-75"
                      />
                      <span className="text-xs text-slate-500">Save Later</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onItemRemove(item.id)}
                        className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Metal & Pricing Row */}
                  <div className="space-y-2">
                    {item.metals?.map((metal: any, metalIndex: number) => (
                      <div key={metal.id} className="flex items-center gap-2">
                        <Select 
                          value={metal.type} 
                          onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}
                        >
                          <SelectTrigger className="w-20 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Silver">Silver</SelectItem>
                            <SelectItem value="Platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select 
                          value={metal.karat?.toString()} 
                          onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}
                        >
                          <SelectTrigger className="w-16 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10K</SelectItem>
                            <SelectItem value="14">14K</SelectItem>
                            <SelectItem value="18">18K</SelectItem>
                            <SelectItem value="22">22K</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input 
                          ref={(el) => weightInputRefs.current[`${item.id}_${metal.id}`] = el}
                          type="number" 
                          step="0.01"
                          value={metal.weight || ''} 
                          onChange={(e) => updateMetal(item.id, metal.id, { weight: parseFloat(e.target.value) || 0 })}
                          onKeyDown={(e) => handleKeyPress(e, item.id, metal.id)}
                          placeholder="Weight"
                          className="w-20 h-8 text-xs"
                        />

                        <div className="flex items-center gap-2 ml-auto">
                          <Input
                            type="number"
                            value={item.payoutPercentage || 75}
                            onChange={(e) => onItemUpdate(item.id, { payoutPercentage: parseFloat(e.target.value) || 75 })}
                            className="w-16 h-8 text-xs"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs text-slate-500">%</span>
                          {!store.hidePayout && (
                            <div className="font-semibold text-primary text-sm w-20 text-right">
                              ${((metal.weight || 0) * 50 * ((item.payoutPercentage || 75) / 100)).toFixed(2)}
                            </div>
                          )}
                        </div>

                        {metalIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedMetals = item.metals.filter((m: any) => m.id !== metal.id);
                              onItemUpdate(item.id, { metals: updatedMetals });
                            }}
                            className="h-6 w-6 p-0 hover:text-red-600"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addMetal(item.id)}
                      className="text-xs text-primary h-6"
                    >
                      + Add Metal
                    </Button>
                  </div>

                  {/* Advanced Details - Collapsible */}
                  <Collapsible 
                    open={expandedAdvanced.has(item.id)} 
                    onOpenChange={() => toggleAdvanced(item.id)}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors mt-3">
                      <ChevronRight className={`h-3 w-3 transition-transform ${expandedAdvanced.has(item.id) ? 'rotate-90' : ''}`} />
                      Advanced
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-3 pl-5 border-l border-slate-200">
                      <div>
                        <label className="text-xs text-slate-500">Notes</label>
                        <Textarea 
                          value={item.notes || ''} 
                          onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                          placeholder="Additional details..."
                          className="h-16 text-xs resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Photos</label>
                        <div className="border-2 border-dashed border-slate-200 rounded p-4 text-center">
                          <Camera className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                          <p className="text-xs text-slate-500">Drop photos or click to upload</p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Information Summary */}
        <div className="w-80 border-l bg-slate-50/30 flex flex-col flex-shrink-0">
          {/* Immediate Quote Box */}
          <div className="p-6 bg-white border-b">
            <div className="text-center">
              <div className="text-3xl font-semibold text-primary mb-1">
                ${totalPayout.toFixed(2)}
              </div>
              <div className="text-sm text-slate-500">
                Total Payout ({avgPayout.toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="p-4 bg-white border-b">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Customer Information</h3>
            <Button 
              variant="outline" 
              onClick={() => setCustomerDrawerOpen(true)}
              className="w-full flex items-center gap-2"
            >
              <ScanLine className="h-4 w-4" />
              Scan Customer ID
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCustomerDrawerOpen(true)}
              className="w-full mt-2 text-xs"
            >
              Enter Manually
            </Button>
          </div>

          {/* Payout Information */}
          <div className="p-4 bg-white border-b">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Payout Information</h3>
            <Select defaultValue="Check">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Store Credit">Store Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="flex-1 p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Market Value</span>
                <span className="font-medium">${totalMarket.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Payout</span>
                <span className="font-semibold text-primary">${totalPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Average %</span>
                <span className="font-medium">{avgPayout.toFixed(1)}%</span>
              </div>
              {!store.hideProfit && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Profit</span>
                  <span className="font-medium text-green-600">${profit.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-2 border-t bg-white">
            <Button 
              variant="ghost" 
              className="w-full flex items-center gap-2"
              disabled={items.length === 0}
            >
              <Save className="h-4 w-4" />
              Save as Quote
            </Button>
            <Button 
              variant="ghost" 
              className="w-full flex items-center gap-2"
              disabled={items.length === 0}
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button 
              className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90"
              disabled={items.length === 0}
            >
              <DollarSign className="h-4 w-4" />
              Complete Purchase
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Drawer */}
      <CustomerDrawer 
        open={customerDrawerOpen}
        onOpenChange={setCustomerDrawerOpen}
      />
    </div>
  );
}