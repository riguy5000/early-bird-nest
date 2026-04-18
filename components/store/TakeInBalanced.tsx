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

  // Specs panels stay collapsed by default — user opens them explicitly via the Specs chevron.
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
                    <div key={category} className="bg-[#F5F4F7]/60 rounded-[20px] border border-black/[0.04] overflow-hidden">
                      {/* Category Header */}
                      <div className="px-6 pt-5 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[8px] icon-container flex items-center justify-center">
                              {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || Gem, {
                                className: "h-3.5 w-3.5"
                              })}
                            </div>
                            <h3 className="text-[17px] font-semibold text-[#2B2833] tracking-tight">{category}</h3>
                            <span className="text-[13px] text-[#A8A3AE]">
                              ({(categoryItems as any[]).length} {(categoryItems as any[]).length === 1 ? 'item' : 'items'})
                            </span>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[13px] text-[#A8A3AE]">Section Total</span>
                              <span className="text-[18px] font-bold text-[#2B2833] tabular-nums">
                                ${(categoryItems as any[]).reduce((s: number, i: any) => s + (i.payoutAmount || 0), 0).toFixed(2)}
                              </span>
                            </div>
                            <Button
                              onClick={() => addItemByCategory(category)}
                              size="sm"
                              variant="ghost"
                              className="h-9 px-4 text-[13px] text-[#6B5EF9] bg-white border border-[#6B5EF9]/25 hover:bg-[#6B5EF9]/5 hover:border-[#6B5EF9]/40 rounded-[10px] font-medium shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add Item
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-4 pb-4 space-y-2">
                        {(categoryItems as any[]).map((item, index) => (
                           <div key={item.id} className="bg-white rounded-[16px] border border-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-150">
                              <div
                                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).tagName !== 'INPUT' &&
                                      !(e.target as HTMLElement).closest('button') &&
                                      !(e.target as HTMLElement).closest('[role="combobox"]')) {
                                    toggleAdvanced(item.id);
                                  }
                                }}
                              >
                                {/* Numbered badge — preserved purple gradient */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B7EFF] to-[#6B5EF9] flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0 shadow-sm">
                                  {items.findIndex(i => i.id === item.id) + 1}
                                </div>

                                {/* LEFT: Description input + type pills */}
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                  <Input
                                    value={item.itemType || ''}
                                    onChange={(e) => onItemUpdate(item.id, { itemType: e.target.value })}
                                    placeholder="Type item / description..."
                                    className="h-10 text-[14px] bg-white border border-black/[0.06] rounded-[10px] px-3.5 placeholder:text-[#A8A3AE]"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex flex-wrap gap-1.5">
                                    {(itemTypesByCategory[category as keyof typeof itemTypesByCategory] || []).slice(0, 6).map(type => {
                                      const active = item.itemType === type;
                                      return (
                                        <button
                                          key={type}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onItemUpdate(item.id, { itemType: type });
                                          }}
                                          className={`px-3 py-1 text-[12px] rounded-full transition-colors cursor-pointer font-medium ${
                                            active
                                              ? 'bg-[#2B2833] text-white'
                                              : 'bg-[#F1EFF3] text-[#76707F] hover:bg-[#E8E6EC]'
                                          }`}
                                        >
                                          {type}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {/* AI source + color notes */}
                                  {(item.source === 'AI Assist' || item.colorNotes) && (
                                    <div className="flex items-center gap-2">
                                      {item.source === 'AI Assist' && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#E8E6FF] text-[#6B5EF9]">AI</span>
                                      )}
                                      {item.colorNotes && (
                                        <span className="text-[11px] text-[#A8A3AE] italic">{item.colorNotes}</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* RIGHT: Metal controls + actions */}
                                {item.category === 'Watch' ? (
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                      <Select value={item.watchMaterial || 'Stainless Steel'} onValueChange={(value) => onItemUpdate(item.id, { watchMaterial: value })}>
                                        <SelectTrigger className="w-[120px] h-10 text-[13px] bg-white border border-black/[0.06] rounded-[10px]">
                                          <SelectValue placeholder="Material" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[12px] max-h-[250px] bg-white border-black/[0.06] shadow-xl">
                                          {watchMaterials.map(m => (
                                            <SelectItem key={m} value={m} className="text-[13px]">{m}</SelectItem>
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
                                        className="w-24 h-10 text-[13px] bg-white border border-black/[0.06] rounded-[10px] text-right tabular-nums"
                                        onClick={(e) => e.stopPropagation()}
                                      />

                                      <div className="h-10 px-3 flex items-center justify-end min-w-[80px] rounded-[10px] bg-[#E6FBF1] text-[13px] font-semibold text-[#0FB37A] tabular-nums">
                                        ${(item.payoutAmount || 0).toFixed(2)}
                                      </div>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleAdvanced(item.id); }}
                                        className="h-10 px-4 flex items-center gap-1 rounded-[10px] bg-[#F1EFF3] text-[#76707F] hover:bg-[#E8E6EC] text-[13px] font-medium transition-colors"
                                      >
                                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedAdvanced.has(item.id) ? 'rotate-90' : ''}`} />
                                        <span>Specs</span>
                                      </button>

                                      {store.canDeleteItems !== false && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onItemRemove(item.id); }}
                                          className="h-10 w-10 flex items-center justify-center rounded-[10px] text-[#A8A3AE] hover:text-[#F87171] hover:bg-[#F87171]/[0.08] transition-colors"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Precious metal weight row if applicable */}
                                    {isWatchPreciousMaterial(item.watchMaterial || '') && (item.metals || []).map((metal: any) => (
                                      <div key={metal.id} className="flex items-center gap-2 justify-end">
                                        <Select value={metal.karat?.toString()} onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}>
                                          <SelectTrigger className="w-[72px] h-9 text-[13px] bg-white border border-black/[0.06] rounded-[10px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-[12px] bg-white border-black/[0.06] shadow-xl">
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
                                          className="w-20 h-9 text-[13px] bg-white border border-black/[0.06] rounded-[10px] text-right tabular-nums"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-[12px] text-[#A8A3AE]">g</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  /* ---- JEWELRY / DEFAULT INLINE CONTROLS ---- */
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    {(item.metals || []).map((metal: any, mIdx: number) => (
                                      <div key={metal.id} className="flex items-center gap-2">
                                        <Select value={metal.type} onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}>
                                          <SelectTrigger className="w-[100px] h-10 text-[13px] bg-white border border-black/[0.06] rounded-[10px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-[12px] bg-white border-black/[0.06] shadow-xl">
                                            <SelectItem value="Gold">Gold</SelectItem>
                                            <SelectItem value="Silver">Silver</SelectItem>
                                            <SelectItem value="Platinum">Platinum</SelectItem>
                                            <SelectItem value="Palladium">Palladium</SelectItem>
                                          </SelectContent>
                                        </Select>

                                        <Select value={metal.karat?.toString()} onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}>
                                          <SelectTrigger className="w-[72px] h-10 text-[13px] bg-white border border-black/[0.06] rounded-[10px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="rounded-[12px] bg-white border-black/[0.06] shadow-xl">
                                            <SelectItem value="9">9K</SelectItem>
                                            <SelectItem value="10">10K</SelectItem>
                                            <SelectItem value="14">14K</SelectItem>
                                            <SelectItem value="18">18K</SelectItem>
                                            <SelectItem value="22">22K</SelectItem>
                                            <SelectItem value="24">24K</SelectItem>
                                          </SelectContent>
                                        </Select>

                                        <div className="flex items-center gap-1.5">
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
                                            className="w-20 h-10 text-[13px] bg-white border border-black/[0.06] rounded-[10px] text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' as any }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-[12px] text-[#A8A3AE]">g</span>
                                        </div>

                                        <div className="h-10 px-3 flex items-center justify-end min-w-[80px] rounded-[10px] bg-[#E6FBF1] text-[13px] font-semibold text-[#0FB37A] tabular-nums">
                                          ${(metal.payoutAmount || 0).toFixed(2)}
                                        </div>

                                        {mIdx === 0 ? (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); addMetal(item.id); }}
                                            className="h-10 w-10 flex items-center justify-center rounded-[10px] bg-white border border-black/[0.06] text-[#6B5EF9] hover:bg-[#6B5EF9]/5 hover:border-[#6B5EF9]/30 transition-colors"
                                            title="Add metal"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updatedMetals = (item.metals || []).filter((m: any) => m.id !== metal.id);
                                              const totalMarketValue = updatedMetals.reduce((sum: number, m: any) => sum + (m.marketValue || 0), 0);
                                              const totalPayoutAmount = updatedMetals.reduce((sum: number, m: any) => sum + (m.payoutAmount || 0), 0);
                                              onItemUpdate(item.id, { metals: updatedMetals, marketValue: totalMarketValue, payoutAmount: totalPayoutAmount });
                                            }}
                                            className="h-10 w-10 flex items-center justify-center rounded-[10px] text-[#A8A3AE] hover:text-[#F87171] hover:bg-[#F87171]/[0.08] transition-colors"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        )}

                                        {/* Specs + Delete only on first row */}
                                        {mIdx === 0 && (
                                          <>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); toggleAdvanced(item.id); }}
                                              className="h-10 px-4 flex items-center gap-1 rounded-[10px] bg-[#F1EFF3] text-[#76707F] hover:bg-[#E8E6EC] text-[13px] font-medium transition-colors"
                                            >
                                              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedAdvanced.has(item.id) ? 'rotate-90' : ''}`} />
                                              <span>Specs</span>
                                            </button>

                                            {store.canDeleteItems !== false && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); onItemRemove(item.id); }}
                                                className="h-10 w-10 flex items-center justify-center rounded-[10px] text-[#A8A3AE] hover:text-[#F87171] hover:bg-[#F87171]/[0.08] transition-colors"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                             <Collapsible 
                               open={expandedAdvanced.has(item.id)} 
                               onOpenChange={() => toggleAdvanced(item.id)}
                             >
                               <CollapsibleContent className="px-3 pb-3 animate-accordion-down data-[state=closed]:animate-accordion-up">
                                 <div className="bg-[#FAFAFB] rounded-[14px] p-5 space-y-5 border border-black/[0.05]">
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
                                      /* ---- JEWELRY / DEFAULT SPECS (refined) ---- */
                                      <>
                                        {/* Section: Item details */}
                                        <div>
                                          <div className="text-[11px] font-semibold text-[#A8A3AE] uppercase tracking-wider mb-3">Item Details</div>

                                          {/* Type pills — full width, wraps cleanly */}
                                          <div className="mb-4">
                                            <label className="text-[12px] font-medium text-[#76707F] block mb-2">Type</label>
                                            <div className="flex flex-wrap gap-1.5">
                                              {(itemTypesByCategory[category as keyof typeof itemTypesByCategory] || []).map(type => {
                                                const active = (item.itemType || '').toLowerCase() === type.toLowerCase();
                                                return (
                                                  <button
                                                    key={type}
                                                    onClick={(e) => { e.stopPropagation(); onItemUpdate(item.id, { itemType: type }); }}
                                                    className={`px-3 h-8 text-[12px] rounded-[8px] font-medium transition-all ${active ? 'bg-[#2B2833] text-white shadow-sm' : 'bg-white text-[#76707F] border border-black/[0.08] hover:text-[#2B2833] hover:border-black/[0.15]'}`}
                                                  >
                                                    {type}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* Brand · Condition · Size — single 3-col row */}
                                          <div className="grid grid-cols-3 gap-3">
                                            <div>
                                              <label className="text-[12px] font-medium text-[#76707F] block mb-1.5">Brand / Maker</label>
                                              <Input value={item.brand || ''} onChange={(e) => onItemUpdate(item.id, { brand: e.target.value })} placeholder="e.g., Tiffany & Co." className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]" />
                                            </div>
                                            <div>
                                              <label className="text-[12px] font-medium text-[#76707F] block mb-1.5">Condition</label>
                                              <Select value={item.condition || ''} onValueChange={(value) => onItemUpdate(item.id, { condition: value })}>
                                                <SelectTrigger className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent className="rounded-[12px] bg-white shadow-xl border border-black/[0.06]">
                                                  <SelectItem value="New">New</SelectItem>
                                                  <SelectItem value="Excellent">Excellent</SelectItem>
                                                  <SelectItem value="Good">Good</SelectItem>
                                                  <SelectItem value="Fair">Fair</SelectItem>
                                                  <SelectItem value="Poor">Poor</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <label className="text-[12px] font-medium text-[#76707F] block mb-1.5">Size</label>
                                              <Input value={item.size || ''} onChange={(e) => onItemUpdate(item.id, { size: e.target.value })} placeholder="e.g., 7, 18in" className="bg-white h-9 text-[13px] rounded-[10px] border border-black/[0.08]" />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Section: Metals */}
                                        {(item.metals || []).length > 0 && (
                                          <div>
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="text-[11px] font-semibold text-[#A8A3AE] uppercase tracking-wider">Metals</div>
                                              <div className="text-[11px] text-[#A8A3AE]">{(item.metals || []).length} {((item.metals || []).length === 1 ? 'component' : 'components')}</div>
                                            </div>
                                            <div className="bg-white rounded-[12px] border border-black/[0.06] overflow-hidden">
                                              <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-black/[0.015] border-b border-black/[0.05]">
                                                <div className="text-[10px] font-semibold text-[#A8A3AE] uppercase tracking-wider">Metal</div>
                                                <div className="text-[10px] font-semibold text-[#A8A3AE] uppercase tracking-wider text-right">Weight (g)</div>
                                                <div className="text-[10px] font-semibold text-[#A8A3AE] uppercase tracking-wider text-right">Payout %</div>
                                                <div className="text-[10px] font-semibold text-[#A8A3AE] uppercase tracking-wider text-right w-16">Value</div>
                                              </div>
                                              {(item.metals || []).map((metal: any, mi: number) => (
                                                <div key={metal.id} className={`grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 px-4 py-2.5 items-center text-[13px] text-[#2B2833] ${mi > 0 ? 'border-t border-black/[0.04]' : ''}`}>
                                                  <div>{metal.type} <span className="text-[#76707F]">{metal.karat}K</span></div>
                                                  <div className="text-right tabular-nums">{(metal.weight || 0).toFixed(2)}</div>
                                                  <div className="text-right tabular-nums text-[#76707F]">{metal.payoutPercentage ?? 75}%</div>
                                                  <div className="text-right tabular-nums font-medium w-16">${(metal.payoutAmount || 0).toFixed(2)}</div>
                                                </div>
                                              ))}
                                              <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] bg-black/[0.015]">
                                                <span className="text-[12px] font-medium text-[#76707F]">Total Metal Value</span>
                                                <span className="text-[15px] font-semibold text-[#2B2833] tabular-nums">
                                                  ${(item.metals || []).reduce((s: number, m: any) => s + (m.payoutAmount || 0), 0).toFixed(2)}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="text-[11px] text-[#A8A3AE] mt-2">Edit weight, karat, and payout % from the row above.</div>
                                          </div>
                                        )}
                                      </>
                                    )}

                                   {/* Section: Notes & Photos */}
                                   <div>
                                     <div className="text-[11px] font-semibold text-[#A8A3AE] uppercase tracking-wider mb-3">Notes & Photos</div>
                                     <div className="grid grid-cols-2 gap-3">
                                       <div>
                                         <label className="text-[12px] font-medium text-[#76707F] block mb-1.5">Notes</label>
                                         <Textarea
                                           value={item.notes || ''}
                                           onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                                           placeholder="Additional details…"
                                           className="bg-white border border-black/[0.08] rounded-[10px] h-20 text-[13px] resize-none"
                                         />
                                       </div>
                                       <div>
                                         <label className="text-[12px] font-medium text-[#76707F] block mb-1.5">Photos</label>
                                         {item.photos?.length > 0 ? (
                                           <div className="flex gap-2 flex-wrap">
                                             {item.photos.map((url: string, pi: number) => (
                                               <div key={pi} className="relative group">
                                                 <img src={url} alt={`Item photo ${pi + 1}`} className="w-16 h-16 rounded-[8px] object-cover border border-black/[0.06]" />
                                                 <button
                                                   className="absolute -top-1 -right-1 bg-[#2B2833] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                   onClick={(e) => { e.stopPropagation(); onItemUpdate(item.id, { photos: item.photos.filter((_: string, j: number) => j !== pi) }); }}
                                                 >×</button>
                                               </div>
                                             ))}
                                           </div>
                                         ) : (
                                           <div className="border border-dashed border-black/[0.12] rounded-[10px] p-3 text-center bg-white hover:bg-black/[0.02] transition-colors cursor-pointer h-20 flex flex-col items-center justify-center">
                                             <Camera className="h-4 w-4 text-[#76707F] mb-1" />
                                             <span className="text-[11px] text-[#A8A3AE]">Upload Photos</span>
                                           </div>
                                         )}
                                       </div>
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
