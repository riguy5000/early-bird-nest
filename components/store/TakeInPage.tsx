import React, { useState, useEffect, useCallback } from 'react';
import type { CustomerData } from './CustomerDrawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TakeInBalanced } from './TakeInBalanced';
import { TakeInSlim } from './TakeInSlim';
import { CustomerDrawer } from './CustomerDrawer';
import { MetalPriceTicker } from './MetalPriceTicker';
import { AICaptureModal } from './AICaptureModal';
import { toast } from 'sonner';
import { syncTakeInToInventory } from '../inventory/syncTakeInToInventory';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Zap,
  Clock,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

interface Item {
  id: string;
  category: 'Jewelry' | 'Watch' | 'Bullion' | 'Stones' | 'Silverware';
  subType?: string;
  itemType?: string;
  metals: Metal[];
  stones: Stone[];
  watchInfo?: WatchInfo;
  marketValue: number;
  payoutPercentage: number;
  payoutAmount: number;
  photos: string[];
  notes: string;
  testMethod?: 'Loop' | 'Acid' | 'XRF' | 'Melt';
  status: 'In Stock' | 'Melted' | 'Resold' | 'Used Toward Sale';
  source?: string;
  colorNotes?: string;
}

interface Metal {
  id: string;
  type: string;
  karat: number;
  weight: number;
}

interface Stone {
  id: string;
  type: string;
  color: string;
  size: number;
  labCert?: string;
}

interface WatchInfo {
  brand: string;
  model: string;
  serial: string;
  condition: string;
}

interface TakeInPageProps {
  store: {
    id: string;
    name: string;
    defaultPayoutPercentage: number;
    hideProfit: boolean;
    hidePayout: boolean;
    hideMarketValue: boolean;
    enableFastEntry: boolean;
    autoPrintLabels: boolean;
    requireCustomerInfoBeforeCompletion: boolean;
    defaultPayoutMethod: 'Check' | 'Cash' | 'Store Credit';
    enablePrintReceipt: boolean;
    enablePrintLabels: boolean;
    enableAiAssist: boolean;
    confirmCompletePurchase: boolean;
    confirmDeleteItem: boolean;
    requireIdScan: boolean;
    allowManualEntry: boolean;
    rateDefaults: Record<string, number>;
    canEditRates?: boolean;
    canDeleteItems?: boolean;
    canCompletePurchase?: boolean;
    enableSaveForLater?: boolean;
    enableBatchPhotos?: boolean;
  };
  employee: {
    id: string;
    name: string;
  };
  onComplete: (data: any) => void;
  onClose: () => void;
}

export function TakeInPage({ store, employee, onComplete, onClose }: TakeInPageProps) {
  const [viewMode, setViewMode] = useState<'balanced' | 'slim'>(
    store.enableFastEntry ? 'slim' : 'balanced'
  );
  const [items, setItems] = useState<Item[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [customerDrawerMode, setCustomerDrawerMode] = useState<'scan' | 'manual'>('manual');
  const [batchId, setBatchId] = useState('');
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showAICaptureModal, setShowAICaptureModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Check' | 'Cash' | 'Store Credit'>(store.defaultPayoutMethod || 'Check');
  const [checkNumber, setCheckNumber] = useState('');
  const [followUpReminder, setFollowUpReminder] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmPurchase, setShowConfirmPurchase] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [batchPhotoUrl, setBatchPhotoUrl] = useState<string>('');

  const openCustomerDrawer = (mode: 'scan' | 'manual') => {
    setCustomerDrawerMode(mode);
    setIsCustomerDrawerOpen(true);
  };

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = Math.floor(Math.random() * 999) + 1;
    setBatchId(`${store.id}-${dateStr}-${counter.toString().padStart(3, '0')}`);
  }, [store.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (items.length > 0 || customer) {
        const draft = { batchId, items, customer, paymentMethod, checkNumber, followUpReminder, timestamp: new Date().toISOString() };
        localStorage.setItem(`takeInDraft_${batchId}`, JSON.stringify(draft));
        setLastSaved(new Date());
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [batchId, items, customer, paymentMethod, checkNumber, followUpReminder]);

  useEffect(() => {
    setShowAIAssist(items.length > 5);
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSaveQuote(); }
      if (e.shiftKey && e.key === 'D') { e.preventDefault(); setViewMode(prev => prev === 'balanced' ? 'slim' : 'balanced'); }
      if (e.key === '+' && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); addNewItem(); }
      if (e.metaKey && e.key === 'j') { e.preventDefault(); handleAIAssist(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addNewItem = useCallback((category: Item['category'] = 'Jewelry') => {
    const newItem: Item = {
      id: `item_${Date.now()}`,
      category,
      metals: [{ id: `metal_${Date.now()}`, type: 'Gold', karat: 14, weight: 0 }],
      stones: [],
      marketValue: 0,
      payoutPercentage: store.defaultPayoutPercentage,
      payoutAmount: 0,
      photos: [],
      notes: '',
      status: 'In Stock'
    };
    setItems(prev => [...prev, newItem]);
    setActiveItemId(newItem.id);
  }, [store.defaultPayoutPercentage]);

  const updateItem = useCallback((itemId: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    if (activeItemId === itemId) setActiveItemId(null);
  }, [activeItemId]);

  const calculateTotals = useCallback(() => {
    const totalMarketValue = items.reduce((sum, item) => sum + item.marketValue, 0);
    const totalPayout = items.reduce((sum, item) => sum + item.payoutAmount, 0);
    const avgPayoutPercentage = items.length > 0 ? items.reduce((sum, item) => sum + item.payoutPercentage, 0) / items.length : 0;
    const profit = totalMarketValue - totalPayout;
    return { totalMarketValue, totalPayout, avgPayoutPercentage, profit };
  }, [items]);

  const validateForPurchase = useCallback((): string[] => {
    const errors: string[] = [];
    if (items.length === 0) errors.push('Add at least one item before completing');
    if (store.requireCustomerInfoBeforeCompletion && !customer) errors.push('Customer information is required before completing');
    if (store.requireIdScan && !customer) errors.push('A scanned government ID is required before completing');
    else if (store.requireIdScan && customer && customer.source !== 'scan' && !store.allowManualEntry) errors.push('A scanned government ID is required — manual entry is not allowed');
    if (store.canCompletePurchase === false) errors.push('You do not have permission to complete purchases');
    if (paymentMethod === 'Check' && !checkNumber.trim()) errors.push('Check number is required for check payments');
    const zeroWeightItems = items.filter(item => {
      const totalWeight = (item.metals || []).reduce((s: number, m: any) => s + (parseFloat(m.weight) || 0), 0);
      return totalWeight === 0 && item.category !== 'Watch';
    });
    if (zeroWeightItems.length > 0) errors.push(`${zeroWeightItems.length} item(s) have zero weight — add weight before completing`);
    return errors;
  }, [items, customer, store, paymentMethod, checkNumber]);

  const handleCompletePurchase = useCallback(async () => {
    const errors = validateForPurchase();
    if (errors.length > 0) { errors.forEach(err => toast.error(err)); return; }
    if (store.confirmCompletePurchase && !showConfirmPurchase) { setShowConfirmPurchase(true); return; }
    setShowConfirmPurchase(false);
    setCompleting(true);
    try {
      const totals = calculateTotals();
      const transactionData = {
        batchId, storeId: store.id, employeeId: employee.id, items, customer,
        paymentMethod, checkNumber, followUpReminder,
        batchPhotos: batchPhotoUrl ? [batchPhotoUrl] : [],
        ...totals, status: 'Purchase', createdAt: new Date().toISOString()
      };
      await syncTakeInToInventory(transactionData);
      setCompletionSuccess(true);
      toast.success('Purchase completed — inventory updated');
      localStorage.removeItem(`takeInDraft_${batchId}`);
      onComplete(transactionData);
      setTimeout(() => {
        setItems([]); setCustomer(null); setCheckNumber(''); setCompletionSuccess(false);
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const counter = Math.floor(Math.random() * 999) + 1;
        setBatchId(`${store.id}-${dateStr}-${counter.toString().padStart(3, '0')}`);
      }, 2000);
    } catch (err: any) {
      toast.error(`Failed to complete purchase: ${err.message || 'Unknown error'}`);
    } finally {
      setCompleting(false);
    }
  }, [validateForPurchase, store, batchId, employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, batchPhotoUrl, calculateTotals, onComplete, showConfirmPurchase]);

  const handleSaveQuote = useCallback(() => {
    if (items.length === 0) { toast.error('Add at least one item before saving'); return; }
    const totals = calculateTotals();
    const quoteData = { batchId, storeId: store.id, employeeId: employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, ...totals, status: 'Quote', createdAt: new Date().toISOString() };
    localStorage.setItem(`takeInDraft_${batchId}`, JSON.stringify(quoteData));
    setLastSaved(new Date());
    toast.success('Quote saved');
  }, [batchId, store.id, employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, calculateTotals]);

  const handleAIAssist = useCallback(() => { setShowAICaptureModal(true); }, []);

  const handleItemsDetected = useCallback((detectedItems: Array<{ type: string; count: number; notes?: string; color_notes?: string; cropUrl?: string }>, batchPhotoUrlArg: string) => {
    if (batchPhotoUrlArg) setBatchPhotoUrl(batchPhotoUrlArg);
    const newItems: Item[] = [];
    for (const detected of detectedItems) {
      for (let i = 0; i < detected.count; i++) {
        const category = ['Watch'].includes(detected.type) ? 'Watch'
          : ['Coin', 'Bar', 'Round'].includes(detected.type) ? 'Bullion'
          : ['Spoon', 'Fork', 'Knife'].includes(detected.type) ? 'Silverware'
          : 'Jewelry';
        const photos: string[] = [];
        if (detected.cropUrl) photos.push(detected.cropUrl);
        if (batchPhotoUrlArg && !photos.includes(batchPhotoUrlArg)) photos.push(batchPhotoUrlArg);
        newItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          category: category as Item['category'],
          subType: detected.type, itemType: detected.type,
          metals: category === 'Watch' ? [] : [{ id: `metal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type: 'Gold', karat: 14, weight: 0 }],
          stones: [], marketValue: 0, payoutPercentage: store.defaultPayoutPercentage,
          payoutAmount: 0, photos, notes: detected.notes || '', colorNotes: detected.color_notes || '',
          status: 'In Stock', source: 'AI Assist',
        });
      }
    }
    setItems(prev => [...prev, ...newItems]);
    if (newItems.length > 0) setActiveItemId(newItems[0].id);
  }, [store.defaultPayoutPercentage]);

  const totals = calculateTotals();

  /* ── Now format the Save button time label ── */
  const saveTimeLabel = (() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  })();

  const categories: Item['category'][] = ['Jewelry', 'Watch', 'Bullion', 'Stones', 'Loose Items' as any];

  return (
    /* Full-viewport take-in shell — transparent so global app gradient shows through */
    <div className="flex flex-col h-full">

      {/* ── Completion success overlay ── */}
      {completionSuccess && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-3">
            <CheckCircle2 className="h-16 w-16 mx-auto text-[#4ADB8A]" />
            <h2 className="text-[20px] font-semibold text-[#2B2833]">Purchase Completed!</h2>
            <p className="text-[14px] text-[#76707F]">Items have been added to inventory</p>
          </div>
        </div>
      )}

      {/* ── Header card — ONE glass-card: title + batch ID + metal tickers ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0">
        <div className="bg-white rounded-[16px] px-6 py-5"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

          {/* Title row: title left, Close + Save right */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">
                Take-In
              </h1>
              {batchId && (
                <p className="text-[12px] text-[#A8A3AE] mt-0.5 font-mono">#{batchId}</p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {lastSaved && (
                <span className="text-[12px] text-[#A8A3AE] flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-[14px] font-medium text-[#76707F] hover:text-[#2B2833] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSaveQuote}
                className="btn-primary-dark flex items-center gap-2"
              >
                Save &amp; {saveTimeLabel}
              </button>
            </div>
          </div>

          {/* Metal price ticker + Fast Entry — inside the card */}
          <div className="pt-3 border-t border-black/[0.04] mt-3 flex items-end justify-between">
            <MetalPriceTicker />
            <div className="flex items-center gap-2.5 ml-6 flex-shrink-0">
              <Label htmlFor="fast-entry" className="text-[12px] font-medium text-[#76707F] cursor-pointer">Fast Entry</Label>
              <Switch
                id="fast-entry"
                checked={viewMode === 'slim'}
                onCheckedChange={(checked) => setViewMode(checked ? 'slim' : 'balanced')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Category tabs — floating below header card, on gradient ── */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-3">
        {/* Category pill tabs */}
        <div className="flex items-center gap-2">
          {(['Jewelry', 'Watch', 'Bullion', 'Stones', 'Loose Items'] as string[]).map((cat) => {
            const isActive = items.some(item => item.category === cat);
            return (
              <button
                key={cat}
                onClick={() => addNewItem(cat as Item['category'])}
                className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all ring-2 ring-white/80 ${
                  isActive
                    ? 'bg-[#2B2833] text-white shadow-sm'
                    : 'bg-white text-[#76707F] hover:text-[#2B2833] shadow-sm'
                }`}
              >
                {cat}
              </button>
            );
          })}




        </div>

        {/* AI Assist hint + button */}
        {store.enableAiAssist && (
          <div className="flex items-center gap-2">
            {showAIAssist && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-full pl-3 pr-1.5 py-1">
                <Zap className="h-3 w-3 text-[#6B5EF9]" />
                <span>Multiple items detected — try <span className="font-medium text-foreground">AI tray capture</span></span>
                <span className="text-[#6B5EF9]">→</span>
                <button
                  onClick={() => setShowAIAssist(false)}
                  className="h-5 w-5 rounded-full hover:bg-white/60 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              onClick={handleAIAssist}
              className="btn-secondary-light flex items-center gap-2 text-[13px]"
            >
              <Zap className="h-3.5 w-3.5 text-[#6B5EF9]" />
              AI Assist
            </button>
          </div>
        )}
      </div>

      {/* ── Main scrollable content ── */}
      <div className="flex-1 overflow-hidden min-h-0">
        {viewMode === 'balanced' ? (
          <TakeInBalanced
            items={items}
            activeItemId={activeItemId}
            onItemAdd={addNewItem}
            onItemUpdate={updateItem}
            onItemRemove={removeItem}
            onItemSelect={setActiveItemId}
            store={store}
            customer={customer}
            onCustomerUpdate={setCustomer}
            onOpenCustomerDrawer={openCustomerDrawer}
            onCompletePurchase={handleCompletePurchase}
            onSaveQuote={handleSaveQuote}
            completing={completing}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(m) => setPaymentMethod(m as any)}
            checkNumber={checkNumber}
            onCheckNumberChange={setCheckNumber}
          />
        ) : (
          <TakeInSlim
            items={items}
            onItemAdd={addNewItem}
            onItemUpdate={updateItem}
            onItemRemove={removeItem}
            store={store}
            onSwitchToDetailed={() => setViewMode('balanced')}
          />
        )}
      </div>

      {/* Customer Drawer */}
      <CustomerDrawer
        isOpen={isCustomerDrawerOpen}
        onClose={() => setIsCustomerDrawerOpen(false)}
        customer={customer}
        onCustomerUpdate={setCustomer}
        mode={customerDrawerMode}
        storeId={store.id}
      />

      {/* AI Capture Modal */}
      <AICaptureModal
        open={showAICaptureModal}
        onClose={() => setShowAICaptureModal(false)}
        onItemsDetected={handleItemsDetected}
        batchId={batchId}
      />

      {/* Confirm Purchase Dialog */}
      <Dialog open={showConfirmPurchase} onOpenChange={setShowConfirmPurchase}>
        <DialogContent className="sm:max-w-[400px] bg-white/90 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#2B2833]">
              <AlertTriangle className="h-5 w-5 text-[#FF9F43]" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#76707F]">
              You are about to complete this purchase for <strong className="text-[#2B2833]">${totals.totalPayout.toFixed(2)}</strong> with {items.length} item(s).
              {customer && <> Customer: <strong className="text-[#2B2833]">{customer.name}</strong>.</>}
              {' '}This action will create inventory records and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              className="btn-secondary-light"
              onClick={() => setShowConfirmPurchase(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary-dark"
              onClick={handleCompletePurchase}
              disabled={completing}
            >
              {completing ? 'Completing…' : 'Confirm Purchase'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
