import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomerData } from './CustomerDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TakeInBalanced } from './TakeInBalanced';
import { TakeInSlim } from './TakeInSlim';
import { CustomerDrawer } from './CustomerDrawer';
import { MetalPriceTicker } from './MetalPriceTicker';
import { AIAssistBanner } from './AIAssistBanner';
import { AICaptureModal } from './AICaptureModal';
import { toast } from 'sonner';
import { syncTakeInToInventory } from '../inventory/syncTakeInToInventory';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings, 
  Zap, 
  Camera, 
  Save, 
  Printer, 
  Clock,
  User,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2
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

  // Generate batch ID on mount
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = Math.floor(Math.random() * 999) + 1;
    setBatchId(`${store.id}-${dateStr}-${counter.toString().padStart(3, '0')}`);
  }, [store.id]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (items.length > 0 || customer) {
        const draft = {
          batchId,
          items,
          customer,
          paymentMethod,
          checkNumber,
          followUpReminder,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`takeInDraft_${batchId}`, JSON.stringify(draft));
        setLastSaved(new Date());
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [batchId, items, customer, paymentMethod, checkNumber, followUpReminder]);

  // Show AI assist banner for multiple items
  useEffect(() => {
    setShowAIAssist(items.length > 5);
  }, [items.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveQuote();
      }
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setViewMode(prev => prev === 'balanced' ? 'slim' : 'balanced');
      }
      if (e.key === '+' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        addNewItem();
      }
      if (e.metaKey && e.key === 'j') {
        e.preventDefault();
        handleAIAssist();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addNewItem = useCallback((category: Item['category'] = 'Jewelry') => {
    const newItem: Item = {
      id: `item_${Date.now()}`,
      category,
      metals: [{
        id: `metal_${Date.now()}`,
        type: 'Gold',
        karat: 14,
        weight: 0,
      }],
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
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    if (activeItemId === itemId) {
      setActiveItemId(null);
    }
  }, [activeItemId]);

  const calculateTotals = useCallback(() => {
    const totalMarketValue = items.reduce((sum, item) => sum + item.marketValue, 0);
    const totalPayout = items.reduce((sum, item) => sum + item.payoutAmount, 0);
    const avgPayoutPercentage = items.length > 0 
      ? items.reduce((sum, item) => sum + item.payoutPercentage, 0) / items.length 
      : 0;
    const profit = totalMarketValue - totalPayout;
    return { totalMarketValue, totalPayout, avgPayoutPercentage, profit };
  }, [items]);

  // ---- VALIDATION ----
  const validateForPurchase = useCallback((): string[] => {
    const errors: string[] = [];
    if (items.length === 0) {
      errors.push('Add at least one item before completing');
    }
    if (store.requireCustomerInfoBeforeCompletion && !customer) {
      errors.push('Customer information is required before completing');
    }
    if (store.requireIdScan && !customer) {
      errors.push('A scanned government ID is required before completing');
    } else if (store.requireIdScan && customer && customer.source !== 'scan' && !store.allowManualEntry) {
      errors.push('A scanned government ID is required — manual entry is not allowed');
    }
    if (store.canCompletePurchase === false) {
      errors.push('You do not have permission to complete purchases');
    }
    if (paymentMethod === 'Check' && !checkNumber.trim()) {
      errors.push('Check number is required for check payments');
    }
    // Check items have weight
    const zeroWeightItems = items.filter(item => {
      const totalWeight = (item.metals || []).reduce((s: number, m: any) => s + (parseFloat(m.weight) || 0), 0);
      return totalWeight === 0 && item.category !== 'Watch';
    });
    if (zeroWeightItems.length > 0) {
      errors.push(`${zeroWeightItems.length} item(s) have zero weight — add weight before completing`);
    }
    return errors;
  }, [items, customer, store, paymentMethod, checkNumber]);

  // ---- COMPLETE PURCHASE ----
  const handleCompletePurchase = useCallback(async () => {
    const errors = validateForPurchase();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }
    // Confirmation dialog if enabled
    if (store.confirmCompletePurchase && !showConfirmPurchase) {
      setShowConfirmPurchase(true);
      return;
    }
    setShowConfirmPurchase(false);
    setCompleting(true);
    try {
      const totals = calculateTotals();
      const transactionData = {
        batchId,
        storeId: store.id,
        employeeId: employee.id,
        items,
        customer,
        paymentMethod,
        checkNumber,
        followUpReminder,
        batchPhotos: batchPhotoUrl ? [batchPhotoUrl] : [],
        ...totals,
        status: 'Purchase',
        createdAt: new Date().toISOString()
      };
      await syncTakeInToInventory(transactionData);
      setCompletionSuccess(true);
      toast.success('Purchase completed — inventory updated');
      localStorage.removeItem(`takeInDraft_${batchId}`);
      onComplete(transactionData);
      // Reset after short delay so user sees success
      setTimeout(() => {
        setItems([]);
        setCustomer(null);
        setCheckNumber('');
        setCompletionSuccess(false);
        // Generate new batch ID
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const counter = Math.floor(Math.random() * 999) + 1;
        setBatchId(`${store.id}-${dateStr}-${counter.toString().padStart(3, '0')}`);
      }, 2000);
    } catch (err: any) {
      console.error('Purchase completion error:', err);
      toast.error(`Failed to complete purchase: ${err.message || 'Unknown error'}`);
    } finally {
      setCompleting(false);
    }
  }, [validateForPurchase, store, batchId, employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, batchPhotoUrl, calculateTotals, onComplete, showConfirmPurchase]);

  // ---- SAVE QUOTE ----
  const handleSaveQuote = useCallback(() => {
    if (items.length === 0) {
      toast.error('Add at least one item before saving');
      return;
    }
    const totals = calculateTotals();
    const quoteData = {
      batchId,
      storeId: store.id,
      employeeId: employee.id,
      items,
      customer,
      paymentMethod,
      checkNumber,
      followUpReminder,
      ...totals,
      status: 'Quote',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(`takeInDraft_${batchId}`, JSON.stringify(quoteData));
    setLastSaved(new Date());
    toast.success('Quote saved');
  }, [batchId, store.id, employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, calculateTotals]);

  const handleAIAssist = useCallback(() => {
    setShowAICaptureModal(true);
  }, []);

  const handleItemsDetected = useCallback((detectedItems: Array<{ type: string; count: number; notes?: string; color_notes?: string; cropUrl?: string }>, batchPhotoUrlArg: string) => {
    if (batchPhotoUrlArg) setBatchPhotoUrl(batchPhotoUrlArg);
    const newItems: Item[] = [];
    for (const detected of detectedItems) {
      for (let i = 0; i < detected.count; i++) {
        const category = ['Watch'].includes(detected.type) ? 'Watch' 
          : ['Coin', 'Bar', 'Round'].includes(detected.type) ? 'Bullion'
          : ['Spoon', 'Fork', 'Knife'].includes(detected.type) ? 'Silverware'
          : 'Jewelry';
        // Build photos array: crop first (item-specific), then batch photo as fallback
        const photos: string[] = [];
        if (detected.cropUrl) photos.push(detected.cropUrl);
        if (batchPhotoUrlArg && !photos.includes(batchPhotoUrlArg)) photos.push(batchPhotoUrlArg);
        newItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          category: category as Item['category'],
          subType: detected.type,
          itemType: detected.type,
          metals: category === 'Watch' ? [] : [{ id: `metal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type: 'Gold', karat: 14, weight: 0 }],
          stones: [],
          marketValue: 0,
          payoutPercentage: store.defaultPayoutPercentage,
          payoutAmount: 0,
          photos,
          notes: detected.notes || '',
          colorNotes: detected.color_notes || '',
          status: 'In Stock',
          source: 'AI Assist',
        });
      }
    }
    setItems(prev => [...prev, ...newItems]);
    if (newItems.length > 0) setActiveItemId(newItems[0].id);
  }, [store.defaultPayoutPercentage]);

  const handlePrintLabels = useCallback(() => {
    toast.success('Printing item labels...');
  }, []);

  const totals = calculateTotals();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Completion success overlay */}
      {completionSuccess && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-3">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold">Purchase Completed!</h2>
            <p className="text-sm text-muted-foreground">Items have been added to inventory</p>
          </div>
        </div>
      )}

      {/* Global Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/40 bg-white/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Take-In</h1>
          <span className="text-xs text-muted-foreground font-normal bg-muted/60 px-2.5 py-0.5 rounded-full">
            #{batchId}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-full">
            Close
          </Button>
        </div>
      </div>

      {/* Metal Ticker */}
      <div className="border-b border-white/40 px-6 py-1.5 bg-white/30">
        <MetalPriceTicker />
      </div>

      {/* Quick Controls Row */}
      <div className="px-6 py-3 flex items-center justify-between gap-6 border-b border-white/40 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware'].map((category) => {
              const isActive = items.some(item => item.category === category);
              return (
                <button
                  key={category}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                  onClick={() => addNewItem(category as Item['category'])}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Items</span>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              <button 
                className="px-2.5 py-1 hover:bg-slate-200 transition-colors text-slate-500"
                onClick={() => items.length > 1 && removeItem(items[items.length - 1].id)}
                disabled={items.length === 0}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-foreground min-w-[28px] text-center">
                {items.length}
              </span>
              <button 
                className="px-2.5 py-1 hover:bg-slate-200 transition-colors text-slate-500"
                onClick={() => addNewItem()}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
            <Label htmlFor="fast-entry" className="text-xs font-medium text-slate-700 cursor-pointer">Fast Entry</Label>
            <Switch
              id="fast-entry"
              checked={viewMode === 'slim'}
              onCheckedChange={(checked) => setViewMode(checked ? 'slim' : 'balanced')}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300"
            />
          </div>
        </div>

        {store.enableAiAssist && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleAIAssist}
            className="flex items-center gap-2 text-slate-600 hover:text-primary bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-4 transition-all duration-200"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">AI Assist</span>
          </Button>
        )}
      </div>

      {showAIAssist && (
        <AIAssistBanner onActivate={handleAIAssist} />
      )}

      {/* Main Content */}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>
              You are about to complete this purchase for <strong>${totals.totalPayout.toFixed(2)}</strong> with {items.length} item(s).
              {customer && <> Customer: <strong>{customer.name}</strong>.</>}
              {' '}This action will create inventory records and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmPurchase(false)}>Cancel</Button>
            <Button onClick={handleCompletePurchase} disabled={completing}>
              {completing ? 'Completing…' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
