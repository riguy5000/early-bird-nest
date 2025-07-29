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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <div className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Take-In #{store?.name || 'STORE'}-{new Date().toLocaleDateString().replace(/\//g, '')}-001
            </h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setBatchPhotoOpen(true)}
            className="flex items-center gap-2 bg-white/50 backdrop-blur border-slate-300 hover:bg-white/80 hover:shadow-md transition-all duration-200"
          >
            <Camera className="h-4 w-4" />
            Batch Photos
          </Button>
        </div>
        <div className="text-xs text-slate-500 flex gap-4 bg-slate-100/50 px-3 py-1.5 rounded-full">
          <span>⌘+J: AI Assist</span>
          <span>Tab: Next field</span>
        </div>
      </div>

      {/* Metal Price Ticker */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur border-b border-amber-200/50 flex-shrink-0">
        <MetalPriceTicker />
      </div>

      {/* Main Content - Single Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Section with Add Buttons */}
          <div className="p-6 bg-white/60 backdrop-blur border-b border-slate-200/50 flex-shrink-0">
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryIcons).map(([category, Icon]) => {
                const count = itemsByCategory[category]?.length || 0;
                return (
                  <div key={category} className="flex items-center gap-2">
                    <Button
                      onClick={() => addItemByCategory(category)}
                      variant={count > 0 ? "default" : "outline"}
                      size="sm"
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                        count > 0 
                          ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                          : 'bg-white/80 backdrop-blur border-slate-300 hover:bg-white hover:shadow-lg hover:border-slate-400 transform hover:-translate-y-0.5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 h-6 w-6 p-0 flex items-center justify-center text-xs bg-white/20 text-white">
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

          {/* Items List - Organized by Category */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center p-8 bg-white/60 backdrop-blur rounded-2xl border border-slate-200/50">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                    <Package className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to start</h3>
                  <p className="text-slate-500 mb-4">Click a category above to add your first item</p>
                </div>
              </div>
            ) : (
              Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                <div key={category} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || Gem, { 
                      className: "h-5 w-5 text-slate-600" 
                    })}
                    <h3 className="text-lg font-semibold text-slate-800">{category}</h3>
                    <div className="h-px bg-gradient-to-r from-slate-300 to-transparent flex-1"></div>
                    <Badge variant="outline" className="bg-white/50 text-slate-600">
                      {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  
                  {/* Category Items Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categoryItems.map((item, index) => (
                      <div key={item.id} className="group bg-white/80 backdrop-blur border border-slate-200/60 rounded-xl p-5 hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 animate-scale-in hover:-translate-y-1">
                        {/* Item Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                              {React.createElement(categoryIcons[item.category as keyof typeof categoryIcons] || Gem, { 
                                className: "h-5 w-5 text-slate-600" 
                              })}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">Item {items.findIndex(i => i.id === item.id) + 1}</div>
                              <div className="text-sm text-slate-500">{item.subType || 'No description'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.saveForLater || false}
                                onCheckedChange={(checked) => onItemUpdate(item.id, { saveForLater: checked })}
                                className="scale-90"
                              />
                              <span className="text-xs text-slate-500 font-medium">Save Later</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onItemRemove(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Metal & Pricing Section */}
                        <div className="space-y-3">
                          {item.metals?.map((metal: any, metalIndex: number) => (
                            <div key={metal.id} className="bg-slate-50/50 rounded-lg p-3 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Select 
                                  value={metal.type} 
                                  onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}
                                >
                                  <SelectTrigger className="w-24 h-10 text-sm bg-white border-slate-300 rounded-lg">
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
                                  <SelectTrigger className="w-20 h-10 text-sm bg-white border-slate-300 rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="10">10K</SelectItem>
                                    <SelectItem value="14">14K</SelectItem>
                                    <SelectItem value="18">18K</SelectItem>
                                    <SelectItem value="22">22K</SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                  <Input 
                                    ref={(el) => weightInputRefs.current[`${item.id}_${metal.id}`] = el}
                                    type="number" 
                                    step="0.01"
                                    value={metal.weight || ''} 
                                    onChange={(e) => updateMetal(item.id, metal.id, { weight: parseFloat(e.target.value) || 0 })}
                                    onKeyDown={(e) => handleKeyPress(e, item.id, metal.id)}
                                    placeholder="Weight"
                                    className="w-24 h-10 text-sm bg-white border-slate-300 rounded-lg"
                                  />
                                  <span className="text-xs text-slate-500 font-medium">g</span>
                                </div>

                                {metalIndex > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedMetals = item.metals.filter((m: any) => m.id !== metal.id);
                                      onItemUpdate(item.id, { metals: updatedMetals });
                                    }}
                                    className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              {/* Payout Section */}
                              <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-600 font-medium">Payout:</span>
                                  <Input
                                    type="number"
                                    value={item.payoutPercentage || 75}
                                    onChange={(e) => onItemUpdate(item.id, { payoutPercentage: parseFloat(e.target.value) || 75 })}
                                    className="w-16 h-8 text-sm bg-white border-slate-300 rounded-md"
                                    min="0"
                                    max="100"
                                  />
                                  <span className="text-sm text-slate-500">%</span>
                                </div>
                                {!store.hidePayout && (
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">
                                      ${((metal.weight || 0) * 50 * ((item.payoutPercentage || 75) / 100)).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-slate-500">this metal</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addMetal(item.id)}
                            className="text-sm text-primary hover:bg-primary/10 rounded-lg w-full py-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Metal
                          </Button>
                        </div>

                        {/* Advanced Details - Collapsible */}
                        <Collapsible 
                          open={expandedAdvanced.has(item.id)} 
                          onOpenChange={() => toggleAdvanced(item.id)}
                        >
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mt-4 p-2 hover:bg-slate-50 rounded-lg w-full">
                            <ChevronRight className={`h-4 w-4 transition-transform ${expandedAdvanced.has(item.id) ? 'rotate-90' : ''}`} />
                            Advanced Details
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-4 p-4 bg-slate-50/30 rounded-lg border border-slate-200/50">
                            <div>
                              <label className="text-sm text-slate-600 font-medium block mb-2">Notes</label>
                              <Textarea 
                                value={item.notes || ''} 
                                onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                                placeholder="Additional details..."
                                className="h-20 text-sm resize-none bg-white border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-slate-600 font-medium block mb-2">Photos</label>
                              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white/50 hover:bg-white/80 transition-colors">
                                <Camera className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">Drop photos or click to upload</p>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
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