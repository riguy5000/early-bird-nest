import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TakeInBalanced } from './TakeInBalanced';
import { TakeInSlim } from './TakeInSlim';
import { CustomerDrawer } from './CustomerDrawer';
import { SummaryFooter } from './SummaryFooter';
import { MetalPriceTicker } from './MetalPriceTicker';
import { AIAssistBanner } from './AIAssistBanner';
import { AICaptureModal } from './AICaptureModal';
import { toast } from 'sonner';
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
  Minus
} from 'lucide-react';

interface Item {
  id: string;
  category: 'Jewelry' | 'Watch' | 'Bullion' | 'Stones' | 'Silverware';
  subType?: string;
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

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  licenseNumber?: string;
}

interface TakeInPageProps {
  store: {
    id: string;
    name: string;
    defaultPayoutPercentage: number;
    hideProfit: boolean;
    hidePayout: boolean;
    enableFastEntry: boolean;
    autoPrintLabels: boolean;
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showAICaptureModal, setShowAICaptureModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Check' | 'Cash' | 'Store Credit'>('Check');
  const [checkNumber, setCheckNumber] = useState('');
  const [followUpReminder, setFollowUpReminder] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
        handleSave();
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

  const addNewItem = useCallback(() => {
    const newItem: Item = {
      id: `item_${Date.now()}`,
      category: 'Jewelry',
      metals: [{
        id: `metal_${Date.now()}`,
        type: 'Gold',
        karat: 14,
        weight: 0
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

  const handleSave = useCallback(() => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
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
      ...totals,
      status: 'Quote',
      createdAt: new Date().toISOString()
    };
    onComplete(transactionData);
    localStorage.removeItem(`takeInDraft_${batchId}`);
    toast.success('Transaction saved successfully');
  }, [batchId, store.id, employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, calculateTotals, onComplete]);

  const handleAIAssist = useCallback(() => {
    setShowAICaptureModal(true);
  }, []);

  const handleItemsDetected = useCallback((detectedItems: Array<{ type: string; count: number; notes?: string }>, batchPhotoUrl: string) => {
    const newItems: Item[] = [];
    for (const detected of detectedItems) {
      for (let i = 0; i < detected.count; i++) {
        const category = ['Watch'].includes(detected.type) ? 'Watch' 
          : ['Coin', 'Bar', 'Round'].includes(detected.type) ? 'Bullion'
          : ['Spoon', 'Fork', 'Knife'].includes(detected.type) ? 'Silverware'
          : 'Jewelry';
        newItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          category: category as Item['category'],
          subType: detected.type,
          metals: [{ id: `metal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type: 'Gold', karat: 14, weight: 0 }],
          stones: [],
          marketValue: 0,
          payoutPercentage: store.defaultPayoutPercentage,
          payoutAmount: 0,
          photos: batchPhotoUrl ? [batchPhotoUrl] : [],
          notes: detected.notes || '',
          status: 'In Stock',
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
    <div className="flex flex-col h-screen bg-background max-w-[1280px] mx-auto">
      {/* Global Header — frosted glass, no shadow */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
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

      {/* Metal Ticker — minimal strip */}
      <div className="border-b border-border/40 px-6 py-1.5">
        <MetalPriceTicker />
      </div>

      {/* Quick Controls Row */}
      <div className="px-6 py-3 flex items-center justify-between gap-6 border-b border-border/40">
        <div className="flex items-center gap-5">
          {/* Category Chips — soft pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware'].map((category) => {
              const isActive = items.some(item => item.category === category);
              return (
                <button
                  key={category}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                  onClick={() => {
                    const newItem: Item = {
                      id: `item_${Date.now()}`,
                      category: category as any,
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
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Item Count — segmented control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Items</span>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
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
                onClick={addNewItem}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Fast Entry Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="fast-entry" className="text-xs text-muted-foreground">Fast Entry</Label>
            <Switch
              id="fast-entry"
              checked={viewMode === 'slim'}
              onCheckedChange={(checked) => setViewMode(checked ? 'slim' : 'balanced')}
            />
          </div>
        </div>

        {/* AI Assist Button — frosted pill */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleAIAssist}
          className="flex items-center gap-2 text-slate-600 hover:text-primary bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full px-4 transition-all duration-200"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">AI Assist</span>
        </Button>
      </div>

      {/* AI Assist Banner */}
      {showAIAssist && (
        <AIAssistBanner onActivate={handleAIAssist} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'balanced' ? (
          <TakeInBalanced
            items={items}
            activeItemId={activeItemId}
            onItemAdd={addNewItem}
            onItemUpdate={updateItem}
            onItemRemove={removeItem}
            onItemSelect={setActiveItemId}
            store={store}
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

      {/* Summary Footer */}
      <SummaryFooter
        totals={totals}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        checkNumber={checkNumber}
        onCheckNumberChange={setCheckNumber}
        followUpReminder={followUpReminder}
        onFollowUpReminderChange={setFollowUpReminder}
        onCustomerInfo={() => setIsCustomerDrawerOpen(true)}
        onSave={handleSave}
        onPrintLabels={handlePrintLabels}
        hideProfit={store.hideProfit}
        hidePayout={store.hidePayout}
        hasItems={items.length > 0}
      />

      {/* Customer Drawer */}
      <CustomerDrawer
        isOpen={isCustomerDrawerOpen}
        onClose={() => setIsCustomerDrawerOpen(false)}
        customer={customer}
        onCustomerUpdate={setCustomer}
      />

      {/* AI Capture Modal */}
      <AICaptureModal
        open={showAICaptureModal}
        onClose={() => setShowAICaptureModal(false)}
        onItemsDetected={handleItemsDetected}
        batchId={batchId}
      />
    </div>
  );
}
