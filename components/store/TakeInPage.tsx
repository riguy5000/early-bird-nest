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
import { toast } from 'sonner';
import { 
  Settings, 
  Zap, 
  Camera, 
  Save, 
  Printer, 
  Clock,
  User,
  Package
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

    return {
      totalMarketValue,
      totalPayout,
      avgPayoutPercentage,
      profit
    };
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
    
    // Clear draft
    localStorage.removeItem(`takeInDraft_${batchId}`);
    toast.success('Transaction saved successfully');
  }, [batchId, store.id, employee.id, items, customer, paymentMethod, checkNumber, followUpReminder, calculateTotals, onComplete]);

  const handleAIAssist = useCallback(() => {
    toast.info('AI Assist: Take a photo of your tray to auto-detect items');
    // Implementation would connect to AI service
  }, []);

  const handlePrintLabels = useCallback(() => {
    toast.success('Printing item labels...');
    // Implementation would connect to label printer
  }, []);

  const totals = calculateTotals();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Take-In Portal</h1>
              <p className="text-sm text-muted-foreground">
                Batch #{batchId} • {employee.name}
              </p>
            </div>
          </div>
          
          {lastSaved && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <MetalPriceTicker />
          
          <div className="flex items-center gap-2">
            <Label htmlFor="view-mode" className="text-sm">Fast Entry</Label>
            <Switch
              id="view-mode"
              checked={viewMode === 'slim'}
              onCheckedChange={(checked) => setViewMode(checked ? 'slim' : 'balanced')}
            />
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
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
    </div>
  );
}