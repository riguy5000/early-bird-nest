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
  const [customer, setCustomer] = useState(null);
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
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Take-In #{store?.name || 'STORE'}-{new Date().toLocaleDateString().replace(/\//g, '')}-001
                </h1>
                <div className="text-xs text-slate-500">Live Processing Portal</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setBatchPhotoOpen(true)}
              className="flex items-center gap-2 h-9 px-4 bg-white/80 hover:bg-white border-slate-300/60 hover:border-slate-400 hover:shadow-md transition-all duration-200"
            >
              <Camera className="h-4 w-4" />
              Batch Photos
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 flex gap-4 bg-slate-100/60 px-3 py-1.5 rounded-full border border-slate-200/50">
              <span>⌘+J: AI Assist</span>
              <span>Tab: Next field</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metal Price Ticker */}
      <div className="absolute top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b border-amber-200/50">
        <MetalPriceTicker />
      </div>

      {/* Main Content Layout */}
      <div className="flex w-full pt-28 h-screen">
        {/* Left Panel - Item Processing */}
        <div className="flex-1 flex flex-col">
          {/* Category Quick Actions */}
          <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(categoryIcons).map(([category, Icon]) => {
                const count = itemsByCategory[category]?.length || 0;
                return (
                  <Button
                    key={category}
                    onClick={() => addItemByCategory(category)}
                    variant={count > 0 ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center gap-2 h-10 px-4 rounded-xl font-medium transition-all duration-300 ${
                      count > 0 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl scale-105' 
                        : 'bg-white/90 border-slate-300/60 hover:bg-white hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{category}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-white/25 text-white border-0">
                        {count}
                      </Badge>
                    )}
                    <Plus className="h-3 w-3 opacity-70" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Items Processing Area */}
          <div className="flex-1 overflow-hidden">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                    <Package className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Ready to Process Items</h3>
                  <p className="text-slate-600 text-lg mb-6">Select a category above to begin adding items for evaluation</p>
                  <div className="flex justify-center gap-2">
                    {Object.entries(categoryIcons).slice(0, 3).map(([category, Icon]) => (
                      <Button
                        key={category}
                        onClick={() => addItemByCategory(category)}
                        variant="outline"
                        className="flex items-center gap-2 bg-white/80 hover:bg-white border-slate-300/60 hover:border-blue-300"
                      >
                        <Icon className="h-4 w-4" />
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto p-4">
                <div className="max-w-7xl mx-auto space-y-4">
                  {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                    <div key={category} className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                      {/* Compact Category Header */}
                      <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                              {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || Gem, { 
                                className: "h-3 w-3 text-white" 
                              })}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">{category}</h3>
                            <Badge variant="outline" className="h-5 text-xs bg-white/50 text-slate-600">
                              {(categoryItems as any[]).length}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => addItemByCategory(category)}
                            size="sm"
                            className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      {/* Compact Items Table */}
                      <div className="divide-y divide-slate-100">
                        {(categoryItems as any[]).map((item, index) => (
                           <div key={item.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-400">
                             {/* Main Item Row - Everything in one compact line */}
                             <div className="flex items-center gap-4 p-4 rounded-lg">
                               {/* Item Number & Type */}
                               <div className="flex items-center gap-3 min-w-[140px]">
                                 <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                   {items.findIndex(i => i.id === item.id) + 1}
                                 </div>
                                 <div className="text-sm font-semibold text-slate-800 truncate">
                                   {item.subType || `${category} Item`}
                                 </div>
                               </div>

                              {/* Metal Info - Horizontal Layout */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {(item.metals || []).slice(0, 1).map((metal: any) => (
                                  <div key={metal.id} className="flex items-center gap-2">
                                     <Select 
                                       value={metal.type} 
                                       onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}
                                     >
                                       <SelectTrigger className="w-20 h-8 text-xs bg-gradient-to-r from-white to-slate-50 border border-slate-300/80 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/60 transition-all duration-200 shadow-sm">
                                         <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl rounded-xl z-50">
                                         <SelectItem value="Gold" className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 text-amber-700">Gold</SelectItem>
                                         <SelectItem value="Silver" className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 text-slate-700">Silver</SelectItem>
                                         <SelectItem value="Platinum" className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 text-slate-800">Platinum</SelectItem>
                                       </SelectContent>
                                     </Select>

                                     <Select 
                                       value={metal.karat?.toString()} 
                                       onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}
                                     >
                                       <SelectTrigger className="w-16 h-8 text-xs bg-gradient-to-r from-white to-slate-50 border border-slate-300/80 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/60 transition-all duration-200 shadow-sm">
                                         <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl rounded-xl z-50">
                                         <SelectItem value="10" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">10K</SelectItem>
                                         <SelectItem value="14" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">14K</SelectItem>
                                         <SelectItem value="18" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">18K</SelectItem>
                                         <SelectItem value="22" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">22K</SelectItem>
                                       </SelectContent>
                                     </Select>

                                     <div className="flex items-center gap-1">
                                       <Input 
                                         ref={(el) => weightInputRefs.current[`${item.id}_${metal.id}`] = el}
                                         type="text" 
                                         value={metal.weight || ''} 
                                         onChange={(e) => {
                                           const value = e.target.value;
                                           if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                             updateMetal(item.id, metal.id, { weight: value === '' ? 0 : parseFloat(value) || 0 });
                                           }
                                         }}
                                         onKeyDown={(e) => handleKeyPress(e, item.id, metal.id)}
                                         placeholder="0.00"
                                         className="w-18 h-8 text-xs bg-gradient-to-r from-white to-slate-50 border border-slate-300/80 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:border-slate-400 transition-all duration-200 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                         style={{ MozAppearance: 'textfield' }}
                                       />
                                       <span className="text-xs text-slate-500 font-medium">g</span>
                                     </div>
                                  </div>
                                ))}
                                
                                {(item.metals || []).length > 1 && (
                                  <Badge variant="outline" className="h-5 text-xs">
                                    +{(item.metals || []).length - 1} more
                                  </Badge>
                                )}
                              </div>

                              {/* Payout Info */}
                               <div className="flex items-center gap-2 min-w-[120px]">
                                 <Input
                                   type="text"
                                   value={item.payoutPercentage || 75}
                                   onChange={(e) => {
                                     const value = e.target.value;
                                     if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                       const numValue = value === '' ? 75 : Math.min(100, Math.max(0, parseFloat(value) || 75));
                                       onItemUpdate(item.id, { payoutPercentage: numValue });
                                     }
                                   }}
                                   placeholder="75"
                                   className="w-14 h-8 text-xs bg-gradient-to-r from-white to-slate-50 border border-slate-300/80 rounded-lg focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 hover:border-slate-400 transition-all duration-200 shadow-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                   style={{ MozAppearance: 'textfield' }}
                                 />
                                 <span className="text-xs text-slate-500 font-medium">%</span>
                                <div className="text-sm font-bold text-green-600 min-w-[60px] text-right">
                                  ${(item.payoutAmount || 0).toFixed(2)}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={item.saveForLater || false}
                                  onCheckedChange={(checked) => onItemUpdate(item.id, { saveForLater: checked })}
                                  className="scale-75"
                                />
                                <span className="text-xs text-slate-600 min-w-[35px]">Save</span>
                                
                                <Collapsible 
                                  open={expandedAdvanced.has(item.id)} 
                                  onOpenChange={() => toggleAdvanced(item.id)}
                                >
                                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 hover:bg-slate-100 rounded">
                                    <ChevronRight className={`h-3 w-3 transition-transform ${expandedAdvanced.has(item.id) ? 'rotate-90' : ''}`} />
                                    More
                                  </CollapsibleTrigger>
                                </Collapsible>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onItemRemove(item.id)}
                                  className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Additional Metals Row (if more than 1) */}
                            {(item.metals || []).length > 1 && (
                              <div className="px-3 pb-2">
                                <div className="flex flex-wrap gap-2 pl-8">
                                  {(item.metals || []).slice(1).map((metal: any) => (
                                    <div key={metal.id} className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1">
                                      <span className="text-xs text-slate-600">{metal.type} {metal.karat}K</span>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        value={metal.weight || ''} 
                                        onChange={(e) => updateMetal(item.id, metal.id, { weight: parseFloat(e.target.value) || 0 })}
                                        className="w-12 h-5 text-xs bg-white border-slate-300"
                                      />
                                      <span className="text-xs text-slate-500">g</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updatedMetals = (item.metals || []).filter((m: any) => m.id !== metal.id);
                                          onItemUpdate(item.id, { metals: updatedMetals });
                                        }}
                                        className="h-4 w-4 p-0 hover:text-red-600"
                                      >
                                        <X className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addMetal(item.id)}
                                    className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Metal
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Advanced Details - Compact */}
                            <Collapsible 
                              open={expandedAdvanced.has(item.id)} 
                              onOpenChange={() => toggleAdvanced(item.id)}
                            >
                              <CollapsibleContent className="px-3 pb-3">
                                <div className="bg-slate-50/50 rounded-lg p-3 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs font-medium text-slate-700 block mb-1">Notes</label>
                                      <Textarea 
                                        value={item.notes || ''} 
                                        onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                                        placeholder="Additional details..."
                                        className="h-12 text-xs resize-none bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-700 block mb-1">Photos</label>
                                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer h-12 flex items-center justify-center">
                                        <Camera className="h-4 w-4 text-slate-400 mr-1" />
                                        <span className="text-xs text-slate-500">Upload</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
        isOpen={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
        customer={customer}
        onCustomerUpdate={setCustomer}
      />
    </div>
  );
}