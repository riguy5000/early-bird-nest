import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CustomerData } from './CustomerDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  DollarSign,
  Save as SaveIcon,
  Printer,
  Edit,
  Loader2
} from 'lucide-react';
import { CustomerSummaryCard } from './CustomerSummaryCard';

interface TakeInBalancedProps {
  items: any[];
  activeItemId: string | null;
  onItemAdd: (category?: string) => void;
  onItemUpdate: (itemId: string, updates: any) => void;
  onItemRemove: (itemId: string) => void;
  onItemSelect: (itemId: string) => void;
  store: any;
  customer: CustomerData | null;
  onCustomerUpdate: (customer: CustomerData) => void;
  onOpenCustomerDrawer: (mode: 'scan' | 'manual') => void;
  onCompletePurchase: () => void;
  onSaveQuote: () => void;
  completing?: boolean;
}

export function TakeInBalanced({
  items,
  activeItemId,
  onItemAdd,
  onItemUpdate,
  onItemRemove,
  onItemSelect,
  store,
  customer,
  onCustomerUpdate,
  onOpenCustomerDrawer,
  onCompletePurchase,
  onSaveQuote,
  completing
}: TakeInBalancedProps) {
  const { toast } = useToast();
  const [expandedAdvanced, setExpandedAdvanced] = useState<Set<string>>(new Set());
  const [batchPhotoOpen, setBatchPhotoOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Check');
  const [checkNumber, setCheckNumber] = useState('');
  const [storeCreditNumber, setStoreCreditNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const weightInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const toggleAdvanced = (itemId: string) => {
    setExpandedAdvanced(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const addItemByCategory = (category: string) => {
    onItemAdd(category);
  };

  const addMetal = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newMetal = { id: `metal_${Date.now()}`, type: 'Gold', karat: 14, weight: 0, payoutPercentage: 75, marketValue: 0, payoutAmount: 0 };
    onItemUpdate(itemId, { metals: [...item.metals, newMetal] });
  };

  const updateMetal = (itemId: string, metalId: string, updates: any) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const updatedMetals = item.metals.map((m: any) => {
      if (m.id !== metalId) return m;
      const updated = { ...m, ...updates };
      const metalMarket = (updated.weight || 0) * 50;
      const pct = updated.payoutPercentage ?? 75;
      updated.marketValue = metalMarket;
      updated.payoutAmount = metalMarket * (pct / 100);
      return updated;
    });
    const totalMarketValue = updatedMetals.reduce((sum: number, m: any) => sum + (m.marketValue || 0), 0);
    const totalPayoutAmount = updatedMetals.reduce((sum: number, m: any) => sum + (m.payoutAmount || 0), 0);
    onItemUpdate(itemId, { metals: updatedMetals, marketValue: totalMarketValue, payoutAmount: totalPayoutAmount });
  };

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string, metalId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const currentMetalIndex = item.metals.findIndex((m: any) => m.id === metalId);
      const nextMetalIndex = currentMetalIndex + 1;
      if (nextMetalIndex < item.metals.length) {
        const nextMetalId = item.metals[nextMetalIndex].id;
        const nextRef = weightInputRefs.current[`${itemId}_${nextMetalId}`];
        if (nextRef) nextRef.focus();
      } else {
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

  const categoryColors: Record<string, { bg: string; icon: string; border: string }> = {
    Jewelry: { bg: 'bg-amber-50', icon: 'bg-amber-200 text-amber-700', border: 'border-amber-200' },
    Watch: { bg: 'bg-blue-50', icon: 'bg-blue-200 text-blue-700', border: 'border-blue-200' },
    Bullion: { bg: 'bg-yellow-50', icon: 'bg-yellow-200 text-yellow-700', border: 'border-yellow-200' },
    Stones: { bg: 'bg-purple-50', icon: 'bg-purple-200 text-purple-700', border: 'border-purple-200' },
    Silverware: { bg: 'bg-slate-100', icon: 'bg-slate-300 text-slate-700', border: 'border-slate-300' },
  };

  const itemTypesByCategory = {
    Jewelry: ['Ring', 'Pendant', 'Earrings', 'Bracelet', 'Necklace', 'Chain', 'Charm'],
    Watch: ['Watch', 'Watch Band', 'Watch Case'],
    Bullion: ['Coin', 'Bar', 'Round'],
    Stones: ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Other'],
    Silverware: ['Spoon', 'Fork', 'Knife', 'Serving Piece', 'Decorative']
  };

  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Jewelry';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const getTypeBreakdown = (categoryItems: any[]) => {
    const typeCounts = categoryItems.reduce((acc, item) => {
      const type = item.itemType || 'Item';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(typeCounts)
      .map(([type, count]) => `${count} ${type}${(count as number) > 1 ? 's' : ''}`)
      .join(', ');
  };

  return (
    <div className="h-full flex bg-slate-50 overflow-hidden">
      <div className="flex w-full h-full">
        {/* Left Panel - Item Processing (scrollable) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto min-h-0">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Process Items</h3>
                  <p className="text-sm text-muted-foreground mb-6">Select a category above to begin adding items for evaluation</p>
                  <div className="flex justify-center gap-2">
                    {Object.entries(categoryIcons).slice(0, 3).map(([category, Icon]) => (
                      <Button
                        key={category}
                        onClick={() => addItemByCategory(category)}
                        variant="outline"
                        className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all"
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
                <div className="max-w-7xl mx-auto space-y-3">
                  {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                    <div key={category} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      {/* Category Header */}
                      <div className={`px-4 py-2.5 ${categoryColors[category]?.bg || 'bg-slate-50'} border-b ${categoryColors[category]?.border || 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 ${categoryColors[category]?.icon || 'bg-slate-200 text-muted-foreground'} rounded-lg flex items-center justify-center`}>
                              {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || Gem, { 
                                className: "h-3.5 w-3.5" 
                              })}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                                <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-lg">
                                  {(categoryItems as any[]).length}
                                </span>
                              </div>
                              {(categoryItems as any[]).length > 0 && getTypeBreakdown(categoryItems as any[]) && (
                                <div className="text-[11px] text-muted-foreground">
                                  {getTypeBreakdown(categoryItems as any[])}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => addItemByCategory(category)}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-primary hover:bg-primary/5 rounded-lg"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div className="p-2 space-y-1.5">
                        {(categoryItems as any[]).map((item, index) => (
                           <div key={item.id} className="bg-white rounded-lg border border-slate-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-shadow duration-150">
                              <div 
                                className="flex items-start gap-2 px-3 py-2 cursor-pointer"
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).tagName !== 'INPUT' && 
                                      !(e.target as HTMLElement).closest('button') && 
                                      !(e.target as HTMLElement).closest('[role="combobox"]')) {
                                    toggleAdvanced(item.id);
                                  }
                                }}
                              >
                                <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-[11px] font-semibold text-slate-600 mt-0.5 flex-shrink-0">
                                  {items.findIndex(i => i.id === item.id) + 1}
                                </div>

                                <div className="flex flex-col gap-1 min-w-[120px] flex-shrink-0">
                                  <Input
                                    value={item.itemType || ''}
                                    onChange={(e) => onItemUpdate(item.id, { itemType: e.target.value })}
                                    placeholder={`Type...`}
                                    className="h-6 text-xs bg-transparent border-0 border-b border-slate-300 rounded-none px-0 focus:border-primary focus:ring-0 w-28"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex flex-wrap gap-0.5">
                                    {(itemTypesByCategory[category as keyof typeof itemTypesByCategory] || []).slice(0, 4).map(type => (
                                      <button
                                        key={type}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onItemUpdate(item.id, { itemType: type });
                                        }}
                                        className="px-1.5 py-0 text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition-colors cursor-pointer leading-4"
                                      >
                                        {type}
                                      </button>
                                    ))}
                                  </div>
                                  {/* AI source + color notes */}
                                  {item.source === 'AI Assist' && (
                                    <Badge variant="secondary" className="text-[9px] w-fit px-1.5 py-0 h-4">AI</Badge>
                                  )}
                                  {item.colorNotes && (
                                    <span className="text-[10px] text-muted-foreground italic">{item.colorNotes}</span>
                                  )}
                                </div>

                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                  {(item.metals || []).map((metal: any) => (
                                    <div key={metal.id} className="flex items-center gap-1.5">
                                      <Select value={metal.type} onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}>
                                        <SelectTrigger className="w-[72px] h-6 text-[11px] bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                          <SelectItem value="Gold">Gold</SelectItem>
                                          <SelectItem value="Silver">Silver</SelectItem>
                                          <SelectItem value="Platinum">Platinum</SelectItem>
                                          <SelectItem value="Palladium">Palladium</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <Select value={metal.karat?.toString()} onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}>
                                        <SelectTrigger className="w-14 h-6 text-[11px] bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                          <SelectItem value="9">9K</SelectItem>
                                          <SelectItem value="10">10K</SelectItem>
                                          <SelectItem value="14">14K</SelectItem>
                                          <SelectItem value="18">18K</SelectItem>
                                          <SelectItem value="22">22K</SelectItem>
                                          <SelectItem value="24">24K</SelectItem>
                                        </SelectContent>
                                      </Select>

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
                                        className="w-12 h-6 text-[11px] bg-white border border-slate-200 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        style={{ MozAppearance: 'textfield' as any }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="text-[10px] text-muted-foreground">g</span>

                                      {!store.hidePayout && (
                                        <>
                                          <Input
                                            type="text"
                                            value={metal.payoutPercentage ?? 75}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                const numValue = value === '' ? 75 : Math.min(100, Math.max(0, parseFloat(value) || 75));
                                                updateMetal(item.id, metal.id, { payoutPercentage: numValue });
                                              }
                                            }}
                                            placeholder="75"
                                            className="w-10 h-6 text-[11px] bg-white border border-slate-200 rounded-md text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' as any }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-[10px] text-muted-foreground">%</span>
                                        </>
                                      )}

                                      <span className="text-[11px] font-medium text-green-600 min-w-[45px] text-right tabular-nums">
                                        ${(metal.payoutAmount || 0).toFixed(2)}
                                      </span>

                                      {(item.metals || []).length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updatedMetals = (item.metals || []).filter((m: any) => m.id !== metal.id);
                                            const totalMarketValue = updatedMetals.reduce((sum: number, m: any) => sum + (m.marketValue || 0), 0);
                                            const totalPayoutAmount = updatedMetals.reduce((sum: number, m: any) => sum + (m.payoutAmount || 0), 0);
                                            onItemUpdate(item.id, { metals: updatedMetals, marketValue: totalMarketValue, payoutAmount: totalPayoutAmount });
                                          }}
                                          className="h-5 w-5 p-0 hover:text-destructive rounded-lg"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addMetal(item.id);
                                    }}
                                    className="h-5 px-1.5 text-[10px] text-primary hover:bg-primary/5 rounded-lg"
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-0.5" />
                                    Metal
                                  </Button>

                                  <div className="text-xs font-semibold text-green-600 min-w-[55px] text-right tabular-nums">
                                    ${(item.payoutAmount || 0).toFixed(2)}
                                  </div>

                                  <div className="flex items-center gap-0.5 text-[11px] text-slate-500 px-1 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                                    <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${expandedAdvanced.has(item.id) ? 'rotate-90' : ''}`} />
                                    <span>Specs</span>
                                  </div>

                                  {store.canDeleteItems !== false && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onItemRemove(item.id);
                                      }}
                                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                             <Collapsible 
                               open={expandedAdvanced.has(item.id)} 
                               onOpenChange={() => toggleAdvanced(item.id)}
                             >
                               <CollapsibleContent className="px-4 pb-4 animate-accordion-down data-[state=closed]:animate-accordion-up">
                                 <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
                                   
                                   <div className="grid grid-cols-3 gap-4">
                                     <div>
                                       <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Brand/Maker</label>
                                       <Input 
                                         value={item.brand || ''} 
                                         onChange={(e) => onItemUpdate(item.id, { brand: e.target.value })}
                                         placeholder="e.g., Tiffany & Co"
                                         className="h-8 text-xs bg-background border-border/40 rounded-lg"
                                       />
                                     </div>
                                     <div>
                                       <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Condition</label>
                                       <Select 
                                         value={item.condition || ''} 
                                         onValueChange={(value) => onItemUpdate(item.id, { condition: value })}
                                       >
                                         <SelectTrigger className="h-8 text-xs bg-background border-border/40 rounded-lg">
                                           <SelectValue placeholder="Select" />
                                         </SelectTrigger>
                                         <SelectContent className="rounded-lg">
                                           <SelectItem value="New">New</SelectItem>
                                           <SelectItem value="Excellent">Excellent</SelectItem>
                                           <SelectItem value="Good">Good</SelectItem>
                                           <SelectItem value="Fair">Fair</SelectItem>
                                           <SelectItem value="Poor">Poor</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>
                                     <div>
                                       <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Size</label>
                                       <Input 
                                         value={item.size || ''} 
                                         onChange={(e) => onItemUpdate(item.id, { size: e.target.value })}
                                         placeholder="e.g., Size 7, 18in"
                                         className="h-8 text-xs bg-background border-border/40 rounded-lg"
                                       />
                                     </div>
                                   </div>

                                    {(item.metals || []).length > 0 && (
                                      <div>
                                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Metals</label>
                                        <div className="space-y-1">
                                          {(item.metals || []).map((metal: any) => (
                                            <div key={metal.id} className="flex items-center gap-2 text-xs text-slate-600 bg-white rounded-lg border border-slate-200 px-3 py-1.5">
                                              <span className="font-medium">{metal.type} {metal.karat}K</span>
                                              <span>·</span>
                                              <span>{metal.weight || 0}g</span>
                                              <span>·</span>
                                              <span>{metal.payoutPercentage ?? 75}%</span>
                                              <span className="ml-auto font-medium text-green-600">${(metal.payoutAmount || 0).toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                   <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Notes</label>
                                       <Textarea 
                                         value={item.notes || ''} 
                                         onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                                         placeholder="Additional details…"
                                         className="h-16 text-xs resize-none bg-background border-border/40 rounded-lg"
                                       />
                                     </div>
                                     <div>
                                       <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Photos</label>
                                       <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer h-16 flex flex-col items-center justify-center">
                                         <Camera className="h-4 w-4 text-muted-foreground mb-1" />
                                         <span className="text-[11px] text-muted-foreground">Upload Photos</span>
                                       </div>
                                     </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-3 border-t border-border/40 mt-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg text-xs px-4"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onItemUpdate(item.id, { brand: '', condition: '', size: '', notes: '' });
                                        }}
                                      >
                                        Clear
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="rounded-lg text-xs px-4"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedAdvanced(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(item.id);
                                            return newSet;
                                          });
                                          toast({ title: 'Item specs saved', description: 'Specifications have been saved.' });
                                        }}
                                      >
                                        Save
                                      </Button>
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

        {/* Right Panel */}
        <div className="w-72 border-l border-slate-200 bg-white flex flex-col flex-shrink-0 h-full overflow-auto">
          {/* Payout Total */}
          <div className="p-6 border-b border-slate-200">
            <div className="text-center">
              <div className="text-3xl font-semibold text-primary tabular-nums tracking-tight">
                ${totalPayout.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total Payout · {avgPayout.toFixed(0)}%
              </div>
            </div>
          </div>

           {/* Customer Information */}
          {customer ? (
            <CustomerSummaryCard 
              customer={customer} 
              onEdit={() => onOpenCustomerDrawer('manual')} 
            />
          ) : (
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">Customer</h3>
              <Button 
                variant="outline" 
                onClick={() => onOpenCustomerDrawer('scan')}
                className="w-full flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
              >
                <ScanLine className="h-4 w-4" />
                Scan Customer ID
              </Button>
              {store.allowManualEntry !== false && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onOpenCustomerDrawer('manual')}
                  className="w-full mt-1.5 text-xs text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Enter Manually
                </Button>
              )}
            </div>
          )}

          {/* Payout Information */}
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">Payment Method</h3>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full rounded-lg bg-white border border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Store Credit">Store Credit</SelectItem>
              </SelectContent>
            </Select>
            {paymentMethod === 'Check' && (
              <Input
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Check #"
                className="mt-2 h-9 text-sm rounded-lg bg-white border border-slate-200"
              />
            )}
            {paymentMethod === 'Store Credit' && (
              <Input
                value={storeCreditNumber}
                onChange={(e) => setStoreCreditNumber(e.target.value)}
                placeholder="Store Credit #"
                className="mt-2 h-9 text-sm rounded-lg bg-white border border-slate-200"
              />
            )}
          </div>

          {/* Summary Stats */}
          <div className="flex-1 p-4 space-y-4">
            <div className="space-y-3">
              {!store.hideMarketValue && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Market Value</span>
                  <span className="font-medium tabular-nums">${totalMarket.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Payout</span>
                <span className="font-semibold text-primary tabular-nums">${totalPayout.toFixed(2)}</span>
              </div>
              {!store.hidePayout && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average %</span>
                  <span className="font-medium tabular-nums">{avgPayout.toFixed(1)}%</span>
                </div>
              )}
              {!store.hideProfit && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="font-medium text-green-600 tabular-nums">${profit.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-2 border-t border-slate-200">
            {store.enableSaveForLater !== false && (
              <Button 
                variant="ghost" 
                className="w-full flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                disabled={items.length === 0}
                onClick={onSaveQuote}
              >
                <SaveIcon className="h-4 w-4" />
                Save as Quote
              </Button>
            )}
            <Button 
              variant="ghost" 
              className="w-full flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              disabled={items.length === 0}
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            {store.canCompletePurchase !== false && (
              <Button 
                className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                disabled={items.length === 0 || completing}
                onClick={onCompletePurchase}
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                {completing ? 'Completing…' : 'Complete Purchase'}
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
