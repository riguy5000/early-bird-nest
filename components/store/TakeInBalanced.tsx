import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  ScanLine
} from 'lucide-react';
import { MetalPriceTicker } from './MetalPriceTicker';

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState(['Jewelry']);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [showFastEntry, setShowFastEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const weightInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowFastEntry(!showFastEntry);
      }
      if (e.ctrlKey && e.key === 'ArrowUp' && items.length > 0) {
        e.preventDefault();
        const currentIndex = items.findIndex(item => item.id === activeItemId);
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        onItemSelect(items[nextIndex].id);
      }
      if (e.ctrlKey && e.key === 'ArrowDown' && items.length > 0) {
        e.preventDefault();
        const currentIndex = items.findIndex(item => item.id === activeItemId);
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        onItemSelect(items[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [activeItemId, items, showFastEntry]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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

  const activeItem = items.find(item => item.id === activeItemId);
  const totalPayout = items.reduce((sum, item) => sum + (item.payoutAmount || 0), 0);
  const totalMarket = items.reduce((sum, item) => sum + (item.marketValue || 0), 0);
  const avgPayout = totalMarket > 0 ? (totalPayout / totalMarket * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Flattened Header */}
      <div className="h-14 border-b bg-background flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Take-In</h1>
          <span className="text-sm text-slate-400">Batch: {store?.name || 'STORE'}-{new Date().toLocaleDateString().replace(/\//g, '')}-001</span>
        </div>
        <div className="text-sm text-slate-500">
          Shift+D: Toggle Fast Entry • Ctrl+↑/↓: Switch Items
        </div>
      </div>

      {/* Metal Price Ticker - Translucent Strip */}
      <div className="bg-slate-50/60 backdrop-blur border-b">
        <MetalPriceTicker />
      </div>

      {/* Category Chips Row */}
      <div className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware'].map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategories.includes(category)
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <button className="p-2 text-secondary hover:text-primary transition-colors">
            <Zap className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Immediate Quote Box - Sticky */}
      <div className="sticky top-[calc(56px+48px)] z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="max-w-sm ml-auto text-right">
          <div className="text-4xl font-semibold text-primary animate-count-up">
            ${totalPayout.toFixed(2)}
          </div>
          <div className="text-sm text-slate-500">
            Payout ({avgPayout.toFixed(0)}%)
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No items added yet</h3>
              <p className="text-muted-foreground mb-4">Add your first item to get started</p>
              <Button onClick={onItemAdd} className="animate-scale-in">
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeItemId || ''} onValueChange={onItemSelect} className="h-full flex flex-col">
            {/* Compressed Pill-Style Tabs */}
            <div className="px-6 py-2 border-b">
              <TabsList className="h-8 bg-slate-100 p-1 gap-1 overflow-x-auto">
                {items.map((item, index) => (
                  <TabsTrigger 
                    key={item.id} 
                    value={item.id}
                    className="h-6 px-3 text-xs rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm relative group"
                    title={`${item.category || 'Item'} ${index + 1}`}
                  >
                    {index + 1}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemRemove(item.id);
                      }}
                      className="ml-2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </TabsTrigger>
                ))}
                <button
                  onClick={onItemAdd}
                  className="h-6 px-3 text-xs rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </TabsList>
            </div>

            {items.map(item => (
              <TabsContent 
                key={item.id} 
                value={item.id} 
                className="flex-1 overflow-auto p-6 animate-fade-in"
              >
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Item Panel - Two Column Grid */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Left Column - Basic Fields */}
                    <div className="col-span-3 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <Select 
                          value={item.category} 
                          onValueChange={(value) => onItemUpdate(item.id, { category: value })}
                        >
                          <SelectTrigger className="input-clean">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Jewelry">Jewelry</SelectItem>
                            <SelectItem value="Watch">Watch</SelectItem>
                            <SelectItem value="Bullion">Bullion</SelectItem>
                            <SelectItem value="Stones">Stones</SelectItem>
                            <SelectItem value="Silverware">Silverware</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Sub-type</label>
                        <Input 
                          value={item.subType || ''} 
                          onChange={(e) => onItemUpdate(item.id, { subType: e.target.value })}
                          placeholder="Ring, Necklace, etc."
                          className="input-clean"
                        />
                      </div>
                    </div>

                    {/* Right Column - Metal Inputs as Pills */}
                    <div className="col-span-9 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-slate-700">Metals</label>
                          <button 
                            onClick={() => addMetal(item.id)}
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            + Add Metal
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {item.metals?.map((metal: any) => (
                            <div key={metal.id} className="flex items-center gap-2 animate-scale-in">
                              <Select 
                                value={metal.type} 
                                onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}
                              >
                                <SelectTrigger className="input-pill w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Gold">Gold</SelectItem>
                                  <SelectItem value="Silver">Silver</SelectItem>
                                  <SelectItem value="Platinum">Platinum</SelectItem>
                                  <SelectItem value="Palladium">Palladium</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select 
                                value={metal.karat?.toString()} 
                                onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}
                              >
                                <SelectTrigger className="input-pill w-20">
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

                              <Input 
                                ref={(el) => weightInputRefs.current[`${item.id}_${metal.id}`] = el}
                                type="number" 
                                step="0.01"
                                value={metal.weight || ''} 
                                onChange={(e) => updateMetal(item.id, metal.id, { weight: parseFloat(e.target.value) || 0 })}
                                onKeyDown={(e) => handleKeyPress(e, item.id, metal.id)}
                                placeholder="Weight (g)"
                                className="input-pill w-32"
                                autoFocus={item.metals.indexOf(metal) === 0}
                              />

                              <button 
                                onClick={() => {
                                  const updatedMetals = item.metals.filter((m: any) => m.id !== metal.id);
                                  onItemUpdate(item.id, { metals: updatedMetals });
                                }}
                                className="p-2 text-slate-400 hover:text-destructive transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Details - Collapsed by Default */}
                  <Collapsible 
                    open={expandedItems.has(item.id)} 
                    onOpenChange={() => toggleExpanded(item.id)}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                      <ChevronRight className={`h-4 w-4 transition-transform ${expandedItems.has(item.id) ? 'rotate-90' : ''}`} />
                      Advanced Details
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4 space-y-6 pl-6">
                      {/* Stones Section */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-3">Stones</h4>
                        <div className="space-y-2">
                          <button 
                            onClick={() => {
                              const newStone = {
                                id: `stone_${Date.now()}`,
                                type: 'Diamond',
                                color: 'Clear',
                                size: 0
                              };
                              onItemUpdate(item.id, {
                                stones: [...(item.stones || []), newStone]
                              });
                            }}
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            + Add Stone
                          </button>
                        </div>
                      </div>

                      {/* Watch Info Section */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-3">Watch Info</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Input placeholder="Brand" className="input-clean" />
                          <Input placeholder="Model" className="input-clean" />
                          <Input placeholder="Serial #" className="input-clean" />
                        </div>
                      </div>

                      {/* Photos Section */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-3">Photos</h4>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                            <Camera className="h-4 w-4" />
                            Take Photo
                          </button>
                          <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Customer Drawer */}
      <Sheet open={customerDrawerOpen} onOpenChange={setCustomerDrawerOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="fixed bottom-20 right-6 rounded-full w-12 h-12 shadow-lg z-50"
          >
            <User className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[400px] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Customer Information</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Button className="w-full flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              Scan ID
            </Button>
            <button className="text-sm text-primary hover:underline">
              Enter Manually
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sticky Footer with KPI Chips */}
      <div className="h-14 bg-white border-t shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="text-xs bg-slate-100 px-3 py-1 rounded-full">
            Market: ${totalMarket.toFixed(2)}
          </div>
          <div className="text-xs bg-slate-100 px-3 py-1 rounded-full">
            Payout: ${totalPayout.toFixed(2)}
          </div>
          <div className="text-xs bg-slate-100 px-3 py-1 rounded-full">
            Avg: {avgPayout.toFixed(0)}%
          </div>
          {!store.hideProfit && (
            <div className="text-xs bg-slate-100 px-3 py-1 rounded-full">
              Profit: ${(totalMarket - totalPayout).toFixed(2)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost">Save Quote</Button>
          <Button>Complete Purchase</Button>
        </div>
      </div>
    </div>
  );
}