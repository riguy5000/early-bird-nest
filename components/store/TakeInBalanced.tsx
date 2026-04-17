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
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  checkNumber: string;
  onCheckNumberChange: (num: string) => void;
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
  completing,
  paymentMethod,
  onPaymentMethodChange,
  checkNumber,
  onCheckNumberChange
}: TakeInBalancedProps) {
  const { toast } = useToast();
  const [expandedAdvanced, setExpandedAdvanced] = useState<Set<string>>(new Set());

  // Auto-expand all items when they're added
  useEffect(() => {
    if (items.length > 0) {
      setExpandedAdvanced(new Set(items.map(i => i.id)));
    }
  }, [items.map(i => i.id).join(',')]);
  const [batchPhotoOpen, setBatchPhotoOpen] = useState(false);
  const [storeCreditNumber, setStoreCreditNumber] = useState('');
  const [transactionType, setTransactionType] = useState<'Purchase' | 'Consignment' | 'Pawn'>('Purchase');
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

  // categoryColors removed — category header band uses static design-system classes
  // (bg-white/50 border-b border-black/[0.04] with icon-container tiles)

  const itemTypesByCategory = {
    Jewelry: ['Ring', 'Pendant', 'Earrings', 'Bracelet', 'Necklace', 'Chain', 'Charm'],
    Watch: ['Wristwatch', 'Pocket Watch', 'Clock', 'Other Timepiece'],
    Bullion: ['Coin', 'Bar', 'Round'],
    Stones: ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Other'],
    Silverware: ['Spoon', 'Fork', 'Knife', 'Serving Piece', 'Decorative']
  };

  const watchMaterials = [
    'Stainless Steel', 'Gold', 'Platinum', 'Silver', 'Titanium', 
    'Base Metal', 'Two-Tone', 'Ceramic', 'Carbon', 'Gold Plated', 
    'Mixed Materials', 'Other'
  ];
  const preciousWatchMaterials = ['Gold', 'Platinum', 'Silver'];
  const isWatchPreciousMaterial = (material: string) => preciousWatchMaterials.includes(material);

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
    <div className="h-full flex overflow-hidden">
      <div className="flex w-full h-full">
        {/* Left Panel - Item Processing (scrollable) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto min-h-0 px-1">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-5 icon-container rounded-[16px] flex items-center justify-center">
                    <Package className="h-8 w-8 text-[#6B5EF9]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#2B2833] mb-2">Ready to Process Items</h3>
                  <p className="text-[14px] text-[#76707F] mb-6">Select a category above to begin adding items for evaluation</p>
                  <div className="flex justify-center gap-2">
                    {Object.entries(categoryIcons).slice(0, 3).map(([category, Icon]) => (
                      <Button
                        key={category}
                        onClick={() => addItemByCategory(category)}
                        variant="outline"
                        className="flex items-center gap-2 btn-secondary-light"
                      >
                        <Icon className="h-4 w-4" />
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto px-6 py-5">
                <div className="space-y-3">
                  {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                    <div key={category} className="glass-card overflow-hidden">
                      {/* Category Header */}
                      <div className="px-5 py-4 border-b border-black/[0.04]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[8px] icon-container flex items-center justify-center">
                              {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || Gem, { 
                                className: "h-3.5 w-3.5" 
                              })}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h3 className="text-[14px] font-semibold text-[#2B2833]">{category}</h3>
                                <span className="text-[11px] text-[#76707F] bg-black/[0.05] px-1.5 py-0.5 rounded-full">
                                  {(categoryItems as any[]).length}
                                </span>
                              </div>
                              {(categoryItems as any[]).length > 0 && getTypeBreakdown(categoryItems as any[]) && (
                                <div className="text-[11px] text-[#A8A3AE]">
                                  {getTypeBreakdown(categoryItems as any[])}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-[10px] text-[#A8A3AE] uppercase tracking-wider">Total</div>
                              <div className="text-[15px] font-semibold text-[#2B2833] tabular-nums">
                                ${(categoryItems as any[]).reduce((s: number, i: any) => s + (i.payoutAmount || 0), 0).toFixed(2)}
                              </div>
                            </div>
                            <Button
                              onClick={() => addItemByCategory(category)}
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2.5 text-[12px] text-[#6B5EF9] hover:bg-[#6B5EF9]/5 rounded-[8px] font-medium"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div className="p-2 space-y-1.5">
                        {(categoryItems as any[]).map((item, index) => (
                           <div key={item.id} className="bg-white rounded-[16px] shadow-sm hover:shadow-md transition-all duration-150">
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
                                <div className="w-6 h-6 rounded-[6px] icon-container flex items-center justify-center text-[11px] font-semibold text-[#6B5EF9] mt-0.5 flex-shrink-0">
                                  {items.findIndex(i => i.id === item.id) + 1}
                                </div>

                                <div className="flex flex-col gap-1 min-w-[120px] flex-shrink-0">
                                  <Input
                                    value={item.itemType || ''}
                                    onChange={(e) => onItemUpdate(item.id, { itemType: e.target.value })}
                                    placeholder={`Type...`}
                                    className="h-6 text-[11px] bg-transparent border-0 border-b border-black/[0.10] rounded-none px-0 focus:border-[#6B5EF9] focus:ring-0 w-28"
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
                                        className="px-1.5 py-0 text-[10px] bg-white/60 hover:bg-[#6B5EF9]/5 text-[#76707F] hover:text-[#6B5EF9] rounded-[6px] border border-black/[0.06] transition-colors cursor-pointer leading-4"
                                      >
                                        {type}
                                      </button>
                                    ))}
                                  </div>
                                  {/* AI source + color notes */}
                                  {item.source === 'AI Assist' && (
                                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[#E8E6FF] text-[#6B5EF9]">AI</span>
                                  )}
                                  {item.colorNotes && (
                                    <span className="text-[10px] text-[#A8A3AE] italic">{item.colorNotes}</span>
                                  )}
                                </div>

                                {item.category === 'Watch' ? (
                                  /* ---- WATCH INLINE CONTROLS ---- */
                                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Select value={item.watchMaterial || 'Stainless Steel'} onValueChange={(value) => onItemUpdate(item.id, { watchMaterial: value })}>
                                        <SelectTrigger className="w-[110px] h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px] hover:bg-white transition-colors">
                                          <SelectValue placeholder="Material" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[12px] max-h-[250px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
                                          {watchMaterials.map(m => (
                                            <SelectItem key={m} value={m} className="text-[12px]">{m}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={item.watchOfferRaw ?? (item.watchOffer || '')}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                            const numValue = value === '' ? 0 : parseFloat(value) || 0;
                                            onItemUpdate(item.id, { watchOffer: numValue, watchOfferRaw: value, payoutAmount: numValue });
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const numValue = parseFloat(e.target.value) || 0;
                                          onItemUpdate(item.id, { watchOffer: numValue, watchOfferRaw: undefined, payoutAmount: numValue });
                                        }}
                                        placeholder="Offer $"
                                        className="w-20 h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        onClick={(e) => e.stopPropagation()}
                                      />

                                      <span className="text-[11px] font-medium text-[#4ADB8A] min-w-[45px] text-right tabular-nums">
                                        ${(item.payoutAmount || 0).toFixed(2)}
                                      </span>
                                    </div>

                                    {/* Precious metal weight row if applicable */}
                                    {isWatchPreciousMaterial(item.watchMaterial || '') && (item.metals || []).map((metal: any) => (
                                      <div key={metal.id} className="flex items-center gap-1.5">
                                        <Select value={metal.karat?.toString()} onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}>
                                          <SelectTrigger className="w-14 h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                            <SelectItem value="9">9K</SelectItem>
                                            <SelectItem value="10">10K</SelectItem>
                                            <SelectItem value="14">14K</SelectItem>
                                            <SelectItem value="18">18K</SelectItem>
                                            <SelectItem value="22">22K</SelectItem>
                                            <SelectItem value="24">24K</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          value={metal.weightRaw ?? (metal.weight || '')}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                              updateMetal(item.id, metal.id, { weight: parseFloat(value) || 0, weightRaw: value });
                                            }
                                          }}
                                          onBlur={(e) => updateMetal(item.id, metal.id, { weight: parseFloat(e.target.value) || 0, weightRaw: undefined })}
                                          placeholder="0.00"
                                          className="w-16 h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px]"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-[10px] text-[#A8A3AE]">g</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  /* ---- JEWELRY / DEFAULT INLINE CONTROLS ---- */
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                  {(item.metals || []).map((metal: any) => (
                                    <div key={metal.id} className="flex items-center gap-1.5">
                                      <Select value={metal.type} onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}>
                                        <SelectTrigger className="w-[72px] h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px] hover:bg-white transition-colors">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                          <SelectItem value="Gold">Gold</SelectItem>
                                          <SelectItem value="Silver">Silver</SelectItem>
                                          <SelectItem value="Platinum">Platinum</SelectItem>
                                          <SelectItem value="Palladium">Palladium</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <Select value={metal.karat?.toString()} onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}>
                                        <SelectTrigger className="w-14 h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
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
                                        inputMode="decimal"
                                        value={metal.weightRaw ?? (metal.weight || '')} 
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                            const numValue = value === '' ? 0 : parseFloat(value) || 0;
                                            updateMetal(item.id, metal.id, { weight: numValue, weightRaw: value });
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const numValue = parseFloat(e.target.value) || 0;
                                          updateMetal(item.id, metal.id, { weight: numValue, weightRaw: undefined });
                                        }}
                                        onKeyDown={(e) => handleKeyPress(e, item.id, metal.id)}
                                        placeholder="0.00"
                                        className="w-16 h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        style={{ MozAppearance: 'textfield' as any }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="text-[10px] text-[#A8A3AE]">g</span>

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
                                            className="w-10 h-6 text-[11px] bg-white/80 border border-black/[0.06] rounded-[8px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' as any }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-[10px] text-[#A8A3AE]">%</span>
                                        </>
                                      )}

                                      <span className="text-[11px] font-medium text-[#4ADB8A] min-w-[45px] text-right tabular-nums">
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
                                          className="h-5 w-5 p-0 hover:text-[#F87171] rounded-[6px]"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                )}

                                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                                  {item.category !== 'Watch' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addMetal(item.id);
                                    }}
                                    className="h-5 px-1.5 text-[10px] text-[#6B5EF9] hover:bg-[#6B5EF9]/5 rounded-[6px] font-medium"
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-0.5" />
                                    Metal
                                  </Button>
                                  )}
                                  <div className="text-[12px] font-semibold text-[#4ADB8A] min-w-[55px] text-right tabular-nums">
                                    ${(item.payoutAmount || 0).toFixed(2)}
                                  </div>

                                  <div className="flex items-center gap-0.5 text-[11px] text-[#76707F] px-2 py-0.5 rounded-[6px] hover:bg-black/[0.04] transition-colors cursor-pointer">
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
                                      className="h-5 w-5 p-0 hover:bg-[#F87171]/10 hover:text-[#F87171] rounded-[6px]"
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
                                 <div className="bg-white/60 rounded-[12px] p-5 space-y-4 border border-black/[0.04]">
                                   
                                   {item.category === 'Watch' ? (
                                     /* ---- WATCH SPECS ---- */
                                     <>
                                       <div className="grid grid-cols-3 gap-4">
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Brand</label>
                                           <Input value={item.brand || ''} onChange={(e) => onItemUpdate(item.id, { brand: e.target.value })} placeholder="e.g., Rolex" className="input-glass h-9 text-[13px]" />
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Model</label>
                                           <Input value={item.watchModel || ''} onChange={(e) => onItemUpdate(item.id, { watchModel: e.target.value })} placeholder="e.g., Submariner" className="input-glass h-9 text-[13px]" />
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Reference #</label>
                                           <Input value={item.watchReference || ''} onChange={(e) => onItemUpdate(item.id, { watchReference: e.target.value })} placeholder="e.g., 116610LN" className="input-glass h-9 text-[13px]" />
                                         </div>
                                       </div>
                                       <div className="grid grid-cols-3 gap-4">
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Serial #</label>
                                           <Input value={item.watchSerial || ''} onChange={(e) => onItemUpdate(item.id, { watchSerial: e.target.value })} placeholder="Serial number" className="input-glass h-9 text-[13px]" />
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Condition</label>
                                           <Select value={item.condition || ''} onValueChange={(v) => onItemUpdate(item.id, { condition: v })}>
                                             <SelectTrigger className="input-glass h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                             <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                               <SelectItem value="New">New</SelectItem>
                                               <SelectItem value="Excellent">Excellent</SelectItem>
                                               <SelectItem value="Good">Good</SelectItem>
                                               <SelectItem value="Fair">Fair</SelectItem>
                                               <SelectItem value="Poor">Poor</SelectItem>
                                             </SelectContent>
                                           </Select>
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Dial Color</label>
                                           <Input value={item.watchDialColor || ''} onChange={(e) => onItemUpdate(item.id, { watchDialColor: e.target.value })} placeholder="e.g., Black" className="input-glass h-9 text-[13px]" />
                                         </div>
                                       </div>
                                       <div className="grid grid-cols-4 gap-4">
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Case Size</label>
                                           <Input value={item.watchCaseSize || ''} onChange={(e) => onItemUpdate(item.id, { watchCaseSize: e.target.value })} placeholder="e.g., 40mm" className="input-glass h-9 text-[13px]" />
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Working</label>
                                           <Select value={item.watchWorking || ''} onValueChange={(v) => onItemUpdate(item.id, { watchWorking: v })}>
                                             <SelectTrigger className="input-glass h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                             <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                               <SelectItem value="Working">Working</SelectItem>
                                               <SelectItem value="Not Working">Not Working</SelectItem>
                                               <SelectItem value="Untested">Untested</SelectItem>
                                             </SelectContent>
                                           </Select>
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Movement</label>
                                           <Select value={item.watchMovement || ''} onValueChange={(v) => onItemUpdate(item.id, { watchMovement: v })}>
                                             <SelectTrigger className="input-glass h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                             <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                               <SelectItem value="With Movement">With Movement</SelectItem>
                                               <SelectItem value="Without Movement">Without Movement</SelectItem>
                                             </SelectContent>
                                           </Select>
                                         </div>
                                         <div>
                                           <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Band</label>
                                           <Select value={item.watchBand || ''} onValueChange={(v) => onItemUpdate(item.id, { watchBand: v })}>
                                             <SelectTrigger className="input-glass h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                             <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                               <SelectItem value="Original Band">Original Band</SelectItem>
                                               <SelectItem value="Aftermarket Band">Aftermarket Band</SelectItem>
                                               <SelectItem value="No Band">No Band</SelectItem>
                                             </SelectContent>
                                           </Select>
                                         </div>
                                       </div>
                                       <div className="grid grid-cols-3 gap-4">
                                         <div className="flex items-center gap-3">
                                           <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Box</label>
                                           <Select value={item.watchBox || 'No'} onValueChange={(v) => onItemUpdate(item.id, { watchBox: v })}>
                                             <SelectTrigger className="h-7 w-16 text-[12px] bg-white border border-black/[0.06] rounded-[8px]"><SelectValue /></SelectTrigger>
                                             <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                               <SelectItem value="Yes">Yes</SelectItem>
                                               <SelectItem value="No">No</SelectItem>
                                             </SelectContent>
                                           </Select>
                                         </div>
                                         <div className="flex items-center gap-3">
                                           <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Papers</label>
                                           <Select value={item.watchPapers || 'No'} onValueChange={(v) => onItemUpdate(item.id, { watchPapers: v })}>
                                             <SelectTrigger className="h-7 w-16 text-[12px] bg-white border border-black/[0.06] rounded-[8px]"><SelectValue /></SelectTrigger>
                                             <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                               <SelectItem value="Yes">Yes</SelectItem>
                                               <SelectItem value="No">No</SelectItem>
                                             </SelectContent>
                                           </Select>
                                         </div>
                                       </div>
                                     </>
                                    ) : (
                                      /* ---- JEWELRY / DEFAULT SPECS ---- */
                                      <>
                                        {/* Row 1: Type pills + Metal select */}
                                        <div className="grid grid-cols-2 gap-6">
                                          <div>
                                            <label className="text-[13px] font-medium text-[#76707F] block mb-2">Type</label>
                                            <div className="flex flex-wrap gap-2">
                                              {(itemTypesByCategory[category as keyof typeof itemTypesByCategory] || []).map(type => {
                                                const active = (item.itemType || '').toLowerCase() === type.toLowerCase();
                                                return (
                                                  <button
                                                    key={type}
                                                    onClick={(e) => { e.stopPropagation(); onItemUpdate(item.id, { itemType: type }); }}
                                                    className={`px-4 h-9 text-[13px] rounded-[10px] font-medium transition-colors ${active ? 'bg-[#1F1B2E] text-white' : 'bg-white text-[#2B2833] border border-black/[0.08] hover:bg-black/[0.03]'}`}
                                                  >
                                                    {type}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[13px] font-medium text-[#76707F] block mb-2">Metal</label>
                                            <Select
                                              value={(item.metals?.[0]?.type) || 'Gold'}
                                              onValueChange={(value) => {
                                                const first = item.metals?.[0];
                                                if (first) updateMetal(item.id, first.id, { type: value });
                                              }}
                                            >
                                              <SelectTrigger className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]"><SelectValue /></SelectTrigger>
                                              <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                                <SelectItem value="Gold">Gold</SelectItem>
                                                <SelectItem value="Silver">Silver</SelectItem>
                                                <SelectItem value="Platinum">Platinum</SelectItem>
                                                <SelectItem value="Palladium">Palladium</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* Row 2: Brand + Condition */}
                                        <div className="grid grid-cols-2 gap-6">
                                          <div>
                                            <label className="text-[13px] font-medium text-[#76707F] block mb-2">Brand/Maker</label>
                                            <Input value={item.brand || ''} onChange={(e) => onItemUpdate(item.id, { brand: e.target.value })} placeholder="e.g., Tiffany & Co." className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]" />
                                          </div>
                                          <div>
                                            <label className="text-[13px] font-medium text-[#76707F] block mb-2">Condition</label>
                                            <Select value={item.condition || ''} onValueChange={(value) => onItemUpdate(item.id, { condition: value })}>
                                              <SelectTrigger className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]"><SelectValue placeholder="Select" /></SelectTrigger>
                                              <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                                                <SelectItem value="New">New</SelectItem>
                                                <SelectItem value="Excellent">Excellent</SelectItem>
                                                <SelectItem value="Good">Good</SelectItem>
                                                <SelectItem value="Fair">Fair</SelectItem>
                                                <SelectItem value="Poor">Poor</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* Row 3: Size full width */}
                                        <div>
                                          <label className="text-[13px] font-medium text-[#76707F] block mb-2">Size</label>
                                          <Input value={item.size || ''} onChange={(e) => onItemUpdate(item.id, { size: e.target.value })} placeholder="e.g., Size 7, 18in" className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]" />
                                        </div>

                                        {/* Metals card */}
                                        {(item.metals || []).length > 0 && (
                                          <div>
                                            <label className="text-[13px] font-medium text-[#76707F] block mb-2">Metals</label>
                                            <div className="bg-white/70 rounded-[14px] border border-black/[0.06] p-4 space-y-3">
                                              {(item.metals || []).map((metal: any) => (
                                                <div key={metal.id} className="grid grid-cols-3 gap-4">
                                                  <div>
                                                    <div className="text-[11px] font-medium text-[#A8A3AE] mb-1.5">Metal Type</div>
                                                    <div className="bg-white h-9 rounded-[10px] border border-black/[0.08] flex items-center px-3 text-[13px] text-[#2B2833]">
                                                      {metal.type} {metal.karat}k
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-[11px] font-medium text-[#A8A3AE] mb-1.5">Weight (g)</div>
                                                    <div className="bg-white h-9 rounded-[10px] border border-black/[0.08] flex items-center justify-end px-3 text-[13px] text-[#2B2833] tabular-nums">
                                                      {(metal.weight || 0).toFixed(2)}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-[11px] font-medium text-[#A8A3AE] mb-1.5">Purity %</div>
                                                    <div className="bg-white h-9 rounded-[10px] border border-black/[0.08] flex items-center justify-end px-3 text-[13px] text-[#2B2833] tabular-nums">
                                                      {metal.payoutPercentage ?? 75}%
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                              <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
                                                <span className="text-[13px] text-[#76707F]">Total Metal Value</span>
                                                <span className="text-[15px] font-semibold text-[#2B2833] tabular-nums">
                                                  ${(item.metals || []).reduce((s: number, m: any) => s + (m.payoutAmount || 0), 0).toFixed(2)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}

                                   <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Notes</label>
                                       <Textarea 
                                         value={item.notes || ''} 
                                         onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                                         placeholder="Additional details…"
                                         className="textarea-glass h-20 text-[13px] resize-none"
                                       />
                                     </div>
                                      <div>
                                        <label className="text-[13px] font-medium text-[#76707F] block mb-1.5">Photos</label>
                                        {item.photos?.length > 0 ? (
                                          <div className="flex gap-2 flex-wrap">
                                            {item.photos.map((url: string, pi: number) => (
                                              <div key={pi} className="relative group">
                                                <img src={url} alt={`Item photo ${pi + 1}`} className="w-16 h-16 rounded-[8px] object-cover border border-black/[0.06]" />
                                                <button
                                                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={(e) => { e.stopPropagation(); onItemUpdate(item.id, { photos: item.photos.filter((_: string, j: number) => j !== pi) }); }}
                                                >×</button>
                                                {pi === 0 && item.source === 'AI Assist' && (
                                                  <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-primary-foreground text-center rounded-b-lg">Crop</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="border border-dashed border-[#6B5EF9]/20 rounded-[8px] p-3 text-center bg-white/60 hover:bg-white/80 transition-colors cursor-pointer h-16 flex flex-col items-center justify-center">
                                            <Camera className="h-4 w-4 text-[#6B5EF9] mb-1" />
                                            <span className="text-[11px] text-[#A8A3AE]">Upload Photos</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] mt-3">
                                      {store.canDeleteItems !== false ? (
                                        <button
                                          className="text-[13px] font-medium text-[#F87171] hover:text-[#EF4444] transition-colors"
                                          onClick={(e) => { e.stopPropagation(); onItemRemove(item.id); }}
                                        >
                                          Remove Item
                                        </button>
                                      ) : <span />}
                                      <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="btn-secondary-light text-[12px] px-4 py-1.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onItemUpdate(item.id, { brand: '', condition: '', size: '', notes: '' });
                                        }}
                                      >
                                        Clear
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="btn-primary-dark text-[12px]"
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

        {/* Right Panel — Frosted Summary — matches approved screenshot layout */}
        <div className="w-[320px] flex-shrink-0 flex flex-col my-4 mr-4 rounded-[20px] overflow-hidden bg-white shadow-2xl">

          {/* ── Payout Total — large number first, label below (screenshot layout) ── */}
          <div className="px-5 pt-6 pb-5 border-b border-black/[0.06]">
            <div className="text-[40px] font-semibold text-[#2B2833] tabular-nums tracking-tight leading-none">
              ${totalPayout.toFixed(2)}
            </div>
            <div className="text-[12px] text-[#76707F] mt-1.5">Total Payout</div>
          </div>

          {/* ── Customer ── */}
          {customer ? (
            <CustomerSummaryCard
              customer={customer}
              onEdit={() => onOpenCustomerDrawer('manual')}
            />
          ) : (
            <div className="px-5 py-4 border-b border-black/[0.06]">
              <h3 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">Customer</h3>
              {/* Scan input row — matches screenshot exactly */}
              <button
                onClick={() => onOpenCustomerDrawer('scan')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/60 border border-black/[0.06] rounded-[10px] text-[13px] text-[#A8A3AE] hover:bg-white/80 transition-all text-left"
                style={{boxShadow:"0 1px 2px rgba(0,0,0,0.02)"}}
              >
                <ScanLine className="h-4 w-4 text-[#6B5EF9] flex-shrink-0" />
                Scan Customer ID
              </button>
              {store.allowManualEntry !== false && (
                <button
                  onClick={() => onOpenCustomerDrawer('manual')}
                  className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 text-[12px] text-[#76707F] hover:text-[#2B2833] transition-colors"
                >
                  <Edit className="h-3.5 w-3.5 text-[#A8A3AE]" />
                  Enter Manually
                </button>
              )}
            </div>
          )}

          {/* ── Payment Method ── */}
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <h3 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">Payment Method</h3>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger className="w-full rounded-[10px] bg-white/60 border border-black/[0.06] text-[14px] text-[#2B2833]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[14px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Store Credit">Store Credit</SelectItem>
              </SelectContent>
            </Select>
            {paymentMethod === 'Check' && (
              <Input
                value={checkNumber}
                onChange={(e) => onCheckNumberChange(e.target.value)}
                placeholder="Check #"
                className="mt-2 h-9 text-[13px] rounded-[10px] bg-white/60 border border-black/[0.06] text-[#2B2833] placeholder:text-[#A8A3AE]"
              />
            )}
            {paymentMethod === 'Store Credit' && (
              <Input
                value={storeCreditNumber}
                onChange={(e) => setStoreCreditNumber(e.target.value)}
                placeholder="Store Credit #"
                className="mt-2 h-9 text-[13px] rounded-[10px] bg-white/60 border border-black/[0.06] text-[#2B2833] placeholder:text-[#A8A3AE]"
              />
            )}
          </div>

          {/* ── Transaction Type — 3 separate floating pills, no shared container ── */}
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <h3 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">Transaction Type</h3>
            <div className="flex gap-2">
              {(['Purchase', 'Consignment', 'Pawn'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTransactionType(type)}
                  className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${
                    transactionType === type
                      ? 'bg-[#2B2833] text-white shadow-sm'
                      : 'bg-white/70 border border-black/[0.08] text-[#76707F] hover:text-[#2B2833] hover:bg-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="flex-1 px-5 py-4 space-y-3 overflow-auto">
            <h3 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Summary</h3>

            {/* Items count */}
            <div className="flex justify-between text-[14px]">
              <span className="text-[#76707F]">Items</span>
              <span className="font-medium text-[#2B2833] tabular-nums">{items.length}</span>
            </div>

            {/* Market Value */}
            {!store.hideMarketValue && (
              <div className="flex justify-between text-[14px]">
                <span className="text-[#76707F]">Market Value</span>
                <span className="font-medium text-[#2B2833] tabular-nums">${totalMarket.toFixed(2)}</span>
              </div>
            )}

            {/* Payout Multiplier */}
            {!store.hidePayout && (
              <div className="flex justify-between text-[14px]">
                <span className="text-[#76707F]">Payout Multiplier</span>
                <span className="font-medium text-[#2B2833] tabular-nums">{avgPayout.toFixed(0)}%</span>
              </div>
            )}

            {/* Total Payout — large purple, bottom of summary */}
            <div className="flex justify-between items-baseline pt-1 border-t border-black/[0.04]">
              <span className="text-[14px] font-semibold text-[#2B2833]">Total Payout</span>
              <span className="text-[22px] font-semibold text-[#6B5EF9] tabular-nums tracking-tight">
                ${totalPayout.toFixed(2)}
              </span>
            </div>

            {/* Profit (hidden per visibility setting) */}
            {!store.hideProfit && (
              <div className="flex justify-between text-[13px]">
                <span className="text-[#A8A3AE]">Profit</span>
                <span className="font-medium text-[#4ADB8A] tabular-nums">${profit.toFixed(2)}</span>
              </div>
            )}

            {/* ── Reminder tip box ── */}
            <div className="tip-box mt-2">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#4889FA] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[#2B2833]">Remember to verify ID</div>
                  <div className="text-[11px] text-[#5A5463] leading-relaxed mt-0.5">
                    All purchases require valid government-issued identification.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer actions ── */}
          <div className="px-5 py-4 border-t border-black/[0.06] space-y-2">
            {store.canCompletePurchase !== false && (
              <button
                className="w-full flex items-center justify-center gap-2 btn-primary-dark"
                disabled={items.length === 0 || completing}
                onClick={onCompletePurchase}
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                {completing ? 'Completing…' : 'Complete Purchase'}
              </button>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 btn-secondary-light text-[13px]"
                disabled={items.length === 0}
              >
                <Printer className="h-3.5 w-3.5 text-[#A8A3AE]" />
                Print Receipt
              </button>
            </div>
            {/* Save as Quote — plain text link at bottom, matches screenshot */}
            {store.enableSaveForLater !== false && (
              <button
                className="w-full text-[13px] text-[#76707F] hover:text-[#2B2833] py-1 transition-colors"
                disabled={items.length === 0}
                onClick={onSaveQuote}
              >
                Save as Quote
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
