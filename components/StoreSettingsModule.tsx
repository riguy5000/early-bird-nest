import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { useStoreSettings } from '../hooks/useStoreSettings';
import {
  Camera, Plus, Trash2, Edit, Save, RotateCcw, GripVertical,
  Check, X, AlertCircle, Store, DollarSign, CreditCard, Users,
  Shield, Package, Bell, QrCode, Upload, Search, Eye, EyeOff,
  Palette, Wrench, UserPlus, KeyRound, Settings2, Printer,
  FileText, Clock, Lock, Unlock, ChevronRight, Mail
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StoreData {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  weightUnit?: string;
  currency?: string;
  quoteFooter?: string;
  legalHoldPeriod?: number;
  reminderDefault?: number;
  logo?: string;
}

interface Employee {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  quickSwitchOrder: number;
  avatar?: string;
  storeId: string;
  lastLogin?: string;
  permissions: EmployeePermissions;
  visibility: EmployeeVisibility;
}

interface EmployeePermissions {
  accessTakeIn: boolean;
  accessInventory: boolean;
  accessCustomers: boolean;
  accessPayouts: boolean;
  accessStatistics: boolean;
  accessSettings: boolean;
  accessSavedForLater: boolean;
  canEditRates: boolean;
  canEditFinalPayout: boolean;
  canPrintLabels: boolean;
  canDeleteItems: boolean;
  canCompletePurchase: boolean;
}

interface EmployeeVisibility {
  hideProfit: boolean;
  hidePercentagePaid: boolean;
  hideMarketValue: boolean;
  hideTotalPayoutBreakdown: boolean;
}

interface StoreSettingsModuleProps {
  currentStore: StoreData | null;
  onStoreUpdate?: (store: StoreData) => void;
  onSettingsSaved?: () => void;
}

const defaultPermissions: EmployeePermissions = {
  accessTakeIn: true, accessInventory: true, accessCustomers: true,
  accessPayouts: false, accessStatistics: false, accessSettings: false,
  accessSavedForLater: true, canEditRates: false, canEditFinalPayout: false,
  canPrintLabels: true, canDeleteItems: false, canCompletePurchase: true,
};

const defaultVisibility: EmployeeVisibility = {
  hideProfit: true, hidePercentagePaid: true, hideMarketValue: false, hideTotalPayoutBreakdown: false,
};

// ─── Sidebar Nav Item ───────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
        active
          ? 'bg-[#2B2833] text-white shadow-sm'
          : 'text-[#76707F] hover:text-[#2B2833] hover:bg-black/[0.04]'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Toggle Row helper ──────────────────────────────────────────────────────

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <p className="text-[14px] font-medium text-[#2B2833]">{label}</p>
        {description && <p className="text-[12px] text-[#76707F] mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Section Card helper ────────────────────────────────────────────────────

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card px-7 py-7 space-y-5">
      <div>
        <h2 className="text-[22px] font-semibold text-[#2B2833] tracking-tight">{title}</h2>
        {description && <p className="text-[13px] text-[#76707F] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StoreSettingsModule({ currentStore, onStoreUpdate, onSettingsSaved }: StoreSettingsModuleProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── General ──
  const [general, setGeneral] = useState({
    name: '', type: 'jewelry', address: '', phone: '', email: '',
    timezone: 'America/New_York', weightUnit: 'g', currency: 'USD',
    quoteFooter: '', legalHoldPeriod: 90, logo: '',
  });

  // ── Employees ──
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // ── Global Visibility ──
  const [globalVisibility, setGlobalVisibility] = useState({
    showProfit: false, showPayoutPercent: true, showMarketValue: true,
    showProfitInFooter: false, showAverageRateInFooter: true,
  });

  // ── Intake & Payout Defaults ──
  const [intakeDefaults, setIntakeDefaults] = useState({
    fastEntryDefault: false, defaultCategory: 'jewelry', autoFocusWeight: true,
    itemCardLayout: 'compact' as 'compact' | 'detailed',
    enableSaveForLater: true, enableBatchPhotos: true, enableAiAssist: true,
  });

  const [payoutDefaults, setPayoutDefaults] = useState({
    defaultMethod: 'check', allowSplitPayout: false,
    showConfirmationModal: true, requirePayoutInfoBeforeCompletion: true,
    requireCustomerInfoBeforeCompletion: true, allowOverrideFinalPayout: true,
    allowPerItemRateEdits: true, allowBatchRateEdits: false,
  });

  const [rateDefaults, setRateDefaults] = useState({
    gold: 78, silver: 75, platinum: 80, palladium: 75,
    stones: 65, watches: 70, bullion: 85,
  });

  // ── Customer & Compliance ──
  const [customerSettings, setCustomerSettings] = useState({
    requireIdScan: true, allowManualEntry: true,
    requirePhone: true, requireEmail: false, requireAddress: false,
    requireGender: false, requireDob: false,
  });

  const [complianceSettings, setComplianceSettings] = useState({
    holdPeriodDays: 90, requireSignature: false,
    requireEmployeeName: true, requireNoteOverAmount: false,
    noteThreshold: 500, showWarningOverThreshold: true,
    requireManagerApproval: false, approvalThreshold: 1000,
  });

  // ── Labels / Printing ──
  const [printSettings, setPrintSettings] = useState({
    enablePrintReceipt: true, enablePrintLabels: true,
    autoPrintReceipt: false, autoPrintBatchQr: false, autoPrintItemQr: false,
    showBatchNumber: true, showItemNumber: true, showItemDescription: true,
    showWeight: true, showPayoutAmount: false, showDate: true, showQrCode: true,
    showStoreLogo: true, showFooterNote: true, showDisclaimer: false,
    showSavedForLaterOnQuote: false, hidePayoutPercentsOnPrint: true,
  });

  // ── Notifications ──
  const [notifSettings, setNotifSettings] = useState({
    emailOnQuoteSaved: true, reminderSaveForLater: true,
    notifyAdminOnPurchase: false, notifyAdminPayoutThreshold: false,
    notifyAdminRateChange: false, dailySummary: true,
    reminderInterval: '3days' as string,
  });

  // ── Appearance ──
  const [appearance, setAppearance] = useState({
    theme: 'default' as 'default' | 'dark' | 'seasonal',
    accentColor: 'blue', compactMode: false,
    largeInputMode: false, sidebarCollapsed: false,
  });

  // ── Advanced ──
  const [advanced, setAdvanced] = useState({
    archiveAfterDays: 90, autoDraftSave: true,
    duplicateDetection: true, keyboardShortcuts: true,
    categoryGrouping: true, subcategoryGrouping: false,
    lockCompletedTransactions: true, allowReopenCompleted: false,
    confirmDeleteItem: true, confirmCompletePurchase: true,
    confirmChangePayoutMethod: true, confirmRemoveSavedForLater: true,
  });

  // ── Load settings from Supabase ──
  const { settings: dbSettings, loading: dbLoading, saveSettings, refetch } = useStoreSettings(currentStore?.id || '');

  useEffect(() => {
    if (dbLoading || !currentStore) return;
    
    // Merge DB settings with defaults
    if (dbSettings.general && Object.keys(dbSettings.general).length > 0) {
      setGeneral(prev => ({ ...prev, ...dbSettings.general }));
    } else if (currentStore) {
      setGeneral(prev => ({
        ...prev,
        name: currentStore.name || '',
        type: currentStore.type || 'jewelry',
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        email: currentStore.email || '',
        timezone: currentStore.timezone || 'America/New_York',
        weightUnit: currentStore.weightUnit || 'g',
        currency: currentStore.currency || 'USD',
        quoteFooter: currentStore.quoteFooter || '',
        legalHoldPeriod: currentStore.legalHoldPeriod || 90,
        logo: currentStore.logo || '',
      }));
    }

    if (dbSettings.globalVisibility) {
      setGlobalVisibility(prev => ({ ...prev, ...dbSettings.globalVisibility }));
    }
    if (dbSettings.intakeDefaults && Object.keys(dbSettings.intakeDefaults).length > 0) {
      setIntakeDefaults(prev => ({ ...prev, ...dbSettings.intakeDefaults }));
    }
    if (dbSettings.payoutDefaults && Object.keys(dbSettings.payoutDefaults).length > 0) {
      setPayoutDefaults(prev => ({ ...prev, ...dbSettings.payoutDefaults }));
    }
    if (dbSettings.rateDefaults && Object.keys(dbSettings.rateDefaults).length > 0) {
      setRateDefaults(prev => ({ ...prev, ...dbSettings.rateDefaults }));
    }
    if (dbSettings.customerSettings && Object.keys(dbSettings.customerSettings).length > 0) {
      setCustomerSettings(prev => ({ ...prev, ...dbSettings.customerSettings }));
    }
    if (dbSettings.complianceSettings && Object.keys(dbSettings.complianceSettings).length > 0) {
      setComplianceSettings(prev => ({ ...prev, ...dbSettings.complianceSettings }));
    }
    if (dbSettings.printSettings && Object.keys(dbSettings.printSettings).length > 0) {
      setPrintSettings(prev => ({ ...prev, ...dbSettings.printSettings }));
    }
    if (dbSettings.notificationSettings && Object.keys(dbSettings.notificationSettings).length > 0) {
      setNotifSettings(prev => ({ ...prev, ...dbSettings.notificationSettings }));
    }
    if (dbSettings.appearance && Object.keys(dbSettings.appearance).length > 0) {
      setAppearance(prev => ({ ...prev, ...dbSettings.appearance }));
    }
    if (dbSettings.advanced && Object.keys(dbSettings.advanced).length > 0) {
      setAdvanced(prev => ({ ...prev, ...dbSettings.advanced }));
    }
    if (dbSettings.employees && dbSettings.employees.length > 0) {
      setEmployees(dbSettings.employees);
    }
  }, [dbLoading, dbSettings, currentStore]);

  const markDirty = () => setHasUnsavedChanges(true);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await saveSettings({
        general,
        globalVisibility,
        intakeDefaults,
        payoutDefaults,
        rateDefaults,
        customerSettings,
        complianceSettings,
        printSettings,
        notificationSettings: notifSettings,
        appearance,
        advanced,
        employees,
      });
      if (success) {
        toast.success('Settings saved successfully');
        setHasUnsavedChanges(false);
        onSettingsSaved?.();
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    refetch();
    setHasUnsavedChanges(false);
    toast.success('Settings reset to saved values');
  };

  // ── Tab config ──
  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'employees', label: 'Employees / Users', icon: Users },
    { id: 'visibility', label: 'Visibility & Permissions', icon: Eye },
    { id: 'intake', label: 'Intake & Payout Defaults', icon: DollarSign },
    { id: 'customer', label: 'Customer & Compliance', icon: Shield },
    { id: 'labels', label: 'Labels / Printing', icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Wrench },
  ];

  const filteredTabs = useMemo(() => {
    if (!searchQuery) return tabs;
    const q = searchQuery.toLowerCase();
    return tabs.filter(t => t.label.toLowerCase().includes(q));
  }, [searchQuery]);

  if (!currentStore) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="tip-box flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-[#4889FA] flex items-center justify-center flex-shrink-0 mt-0.5"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p className="text-[13px] text-[#2B2833]">Please select a store to configure settings.</p></div>
      </div>
    );
  }

  // ── Render active tab content ──
  const renderContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab general={general} setGeneral={setGeneral} markDirty={markDirty} />;
      case 'employees': return <EmployeesTab employees={employees} setEmployees={setEmployees} showAdd={showAddEmployee} setShowAdd={setShowAddEmployee} markDirty={markDirty} storeId={currentStore?.id} />;
      case 'visibility': return <VisibilityTab global={globalVisibility} setGlobal={setGlobalVisibility} employees={employees} setEmployees={setEmployees} markDirty={markDirty} />;
      case 'intake': return <IntakePayoutTab intake={intakeDefaults} setIntake={setIntakeDefaults} payout={payoutDefaults} setPayout={setPayoutDefaults} rates={rateDefaults} setRates={setRateDefaults} markDirty={markDirty} />;
      case 'customer': return <CustomerComplianceTab customer={customerSettings} setCustomer={setCustomerSettings} compliance={complianceSettings} setCompliance={setComplianceSettings} markDirty={markDirty} />;
      case 'labels': return <LabelsPrintingTab settings={printSettings} setSettings={setPrintSettings} markDirty={markDirty} />;
      case 'notifications': return <NotificationsTab settings={notifSettings} setSettings={setNotifSettings} markDirty={markDirty} />;
      case 'appearance': return <AppearanceTab settings={appearance} setSettings={setAppearance} markDirty={markDirty} />;
      case 'advanced': return <AdvancedTab settings={advanced} setSettings={setAdvanced} markDirty={markDirty} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight leading-tight title-gradient">Store Settings</h1>
          <p className="text-[15px] text-[#76707F]">{general.name || 'Configure your store'}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1.5 mr-2">
              <div className="w-2 h-2 bg-[#FF9F43] rounded-full animate-pulse" />
              <span className="text-[12px] text-[#76707F]">Unsaved changes</span>
            </div>
          )}
          <button onClick={handleReset} disabled={!hasUnsavedChanges || isLoading} className="btn-secondary-light disabled:opacity-50">
            Reset
          </button>
          <button onClick={handleSave} disabled={!hasUnsavedChanges || isLoading} className="btn-primary-dark disabled:opacity-50">
            {isLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Body: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <aside className="w-52 flex-shrink-0 space-y-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A3AE]" />
            <input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass pl-10 text-[13px]"
            />
          </div>
          <nav className="space-y-0.5">
            {filteredTabs.map((tab) => (
              <NavItem key={tab.id} icon={tab.icon} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. General ──────────────────────────────────────────────────────────────

function GeneralTab({ general, setGeneral, markDirty }: any) {
  const set = (field: string, value: any) => { setGeneral((p: any) => ({ ...p, [field]: value })); markDirty(); };

  return (
    <div className="glass-card px-8 py-8 space-y-10">

      {/* ── Store Profile ── */}
      <div className="space-y-5">
        <h2 className="text-[22px] font-semibold text-[#2B2833] tracking-tight">Store Profile</h2>

        {/* Logo tile */}
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-[12px] flex items-center justify-center text-[20px] font-bold text-[#6B5EF9] flex-shrink-0 cursor-pointer"
            style={{ background: 'linear-gradient(to bottom right, #ECEAFF, #C8DCFF)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            {general.name?.substring(0, 2)?.toUpperCase() || 'ST'}
          </div>
          <p className="text-[13px] text-[#A8A3AE]">Upload a square logo (200×200 recommended)</p>
        </div>

        {/* Store name + type */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label className="form-label">Store Name *</Label>
            <Input value={general.name} onChange={(e) => set('name', e.target.value)} placeholder="Enter store name" className="mt-1.5" />
          </div>
          <div>
            <Label className="form-label">Store Type</Label>
            <Select value={general.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jewelry">Jewelry</SelectItem>
                <SelectItem value="pawn">Pawn</SelectItem>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address — single line */}
        <div>
          <Label className="form-label">Address</Label>
          <Input value={general.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, City, State, ZIP" className="mt-1.5" />
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label className="form-label">Phone</Label>
            <Input type="tel" value={general.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 123-4567" className="mt-1.5" />
          </div>
          <div>
            <Label className="form-label">Email</Label>
            <Input type="email" value={general.email} onChange={(e) => set('email', e.target.value)} placeholder="store@example.com" className="mt-1.5" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.04]" />

      {/* ── Operational Defaults ── */}
      <div className="space-y-5">
        <h2 className="text-[22px] font-semibold text-[#2B2833] tracking-tight">Operational Defaults</h2>

        {/* Timezone + Currency */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label className="form-label">Time Zone</Label>
            <Select value={general.timezone} onValueChange={(v) => set('timezone', v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern</SelectItem>
                <SelectItem value="America/Chicago">Central</SelectItem>
                <SelectItem value="America/Denver">Mountain</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="form-label">Currency</Label>
            <Select value={general.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Default Weight Unit */}
        <div>
          <Label className="form-label">Default Weight Unit</Label>
          <RadioGroup value={general.weightUnit} onValueChange={(v) => set('weightUnit', v)} className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2"><RadioGroupItem value="g"   id="wg"   /><Label htmlFor="wg"   className="text-[14px] text-[#2B2833] cursor-pointer font-normal">Grams</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="dwt" id="wdwt" /><Label htmlFor="wdwt" className="text-[14px] text-[#2B2833] cursor-pointer font-normal">DWT</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="oz"  id="woz"  /><Label htmlFor="woz"  className="text-[14px] text-[#2B2833] cursor-pointer font-normal">Ounces</Label></div>
          </RadioGroup>
        </div>

        {/* Default Hold Period */}
        <div>
          <Label className="form-label">Default Hold Period (days)</Label>
          <Input type="number" min={1} max={365} value={general.legalHoldPeriod} onChange={(e) => set('legalHoldPeriod', parseInt(e.target.value) || 90)} className="mt-1.5 w-28" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.04]" />

      {/* ── Quote / Receipt Footer ── */}
      <div className="space-y-4">
        <h2 className="text-[22px] font-semibold text-[#2B2833] tracking-tight">Quote / Receipt Footer</h2>
        <p className="text-[13px] text-[#76707F] -mt-2">Footer message for printed quotes and receipts</p>
        <Textarea
          value={general.quoteFooter}
          onChange={(e) => set('quoteFooter', e.target.value)}
          placeholder="Footer message for printed quotes and receipts"
          rows={4}
          className="textarea-glass"
        />
      </div>
    </div>
  );
}

// ── 2. Employees / Users ────────────────────────────────────────────────────

function EmployeesTab({ employees, setEmployees, showAdd, setShowAdd, markDirty, storeId }: any) {
  const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'buyer', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('buyer');
  const [showInvite, setShowInvite] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleAdd = async () => {
    if (!newEmp.firstName || !newEmp.lastName || !newEmp.email) {
      toast.error('First name, last name, and email are required');
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: {
          action: 'create-employee',
          storeId,
          firstName: newEmp.firstName,
          lastName: newEmp.lastName,
          email: newEmp.email,
          phone: newEmp.phone,
          role: newEmp.role,
          password: newEmp.password || undefined,
          isActive: true,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      
      // Refresh employee list
      await refreshEmployees();
      setNewEmp({ firstName: '', lastName: '', email: '', phone: '', role: 'buyer', password: '' });
      setShowAdd(false);
      toast.success('Employee created with real login credentials');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) { toast.error('Email is required'); return; }
    setIsInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: { action: 'invite-employee', storeId, email: inviteEmail, role: inviteRole },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      await refreshEmployees();
      setInviteEmail('');
      setShowInvite(false);
      toast.success('Invite sent! Employee will complete setup via link.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const refreshEmployees = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: { action: 'list-employees', storeId },
      });
      if (!error && data?.employees) {
        // Convert DB format to local format
        const mapped = data.employees.map((e: any) => ({
          id: e.id,
          authUserId: e.auth_user_id,
          name: `${e.first_name} ${e.last_name}`.trim(),
          firstName: e.first_name,
          lastName: e.last_name,
          email: e.email,
          phone: e.phone,
          role: e.role,
          isActive: e.is_active,
          quickSwitchOrder: 0,
          storeId: e.store_id,
          lastLogin: e.last_login_at ? new Date(e.last_login_at).toLocaleDateString() : null,
          inviteStatus: e.invite_status,
          permissions: e.employee_permissions?.[0] ? {
            accessTakeIn: e.employee_permissions[0].can_access_take_in,
            accessInventory: e.employee_permissions[0].can_access_inventory,
            accessCustomers: e.employee_permissions[0].can_access_customers,
            accessPayouts: e.employee_permissions[0].can_access_payouts,
            accessStatistics: e.employee_permissions[0].can_access_statistics,
            accessSettings: e.employee_permissions[0].can_access_settings,
            accessSavedForLater: e.employee_permissions[0].can_access_saved_for_later,
            canEditRates: e.employee_permissions[0].can_edit_rates,
            canEditFinalPayout: e.employee_permissions[0].can_edit_final_payout_amount,
            canPrintLabels: e.employee_permissions[0].can_print_labels,
            canDeleteItems: e.employee_permissions[0].can_delete_items,
            canCompletePurchase: e.employee_permissions[0].can_complete_purchase,
          } : { ...defaultPermissions },
          visibility: e.employee_visibility_overrides?.[0] ? {
            hideProfit: e.employee_visibility_overrides[0].hide_profit,
            hidePercentagePaid: e.employee_visibility_overrides[0].hide_percentage_paid,
            hideMarketValue: e.employee_visibility_overrides[0].hide_market_value,
            hideTotalPayoutBreakdown: e.employee_visibility_overrides[0].hide_total_payout_breakdown,
          } : { ...defaultVisibility },
        }));
        setEmployees(mapped);
      }
    } catch (err) {
      console.error('Failed to refresh employees:', err);
    }
  };

  // Load employees from DB on mount
  useState(() => { if (storeId) refreshEmployees(); });

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('employee-management', {
        body: { action: 'toggle-employee-status', storeId, employeeProfileId: id, isActive: !currentlyActive },
      });
      if (error) throw error;
      setEmployees((prev: Employee[]) => prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
      toast.success(`Employee ${!currentlyActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const removeEmployee = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('employee-management', {
        body: { action: 'delete-employee', storeId, employeeProfileId: id },
      });
      if (error) throw error;
      setEmployees((prev: Employee[]) => prev.filter(e => e.id !== id));
      toast.success('Employee removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove employee');
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('employee-management', {
        body: { action: 'reset-employee-password', storeId, employeeProfileId: id },
      });
      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset');
    }
  };

  return (
    <>
      <SettingsCard title="Employees" description="Manage employee accounts and access. Employees created here get real login credentials.">
        <div className="flex justify-end gap-2 mb-3">
          {/* Invite by Email */}
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Mail className="w-4 h-4 mr-1.5" />Invite by Email</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Employee</DialogTitle>
                <DialogDescription>Send an invite link. The employee will set up their own password and profile.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label className="form-label">Email *</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="mt-1" placeholder="employee@example.com" /></div>
                <div>
                  <Label className="form-label">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="front_desk">Front Desk</SelectItem>
                      <SelectItem value="read_only">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleInvite} disabled={!inviteEmail || isInviting}>{isInviting ? 'Sending…' : 'Send Invite'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Manually */}
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="w-4 h-4 mr-1.5" />Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Create an employee account with login credentials.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="form-label">First Name *</Label><Input value={newEmp.firstName} onChange={e => setNewEmp(p => ({ ...p, firstName: e.target.value }))} className="mt-1" /></div>
                  <div><Label className="form-label">Last Name *</Label><Input value={newEmp.lastName} onChange={e => setNewEmp(p => ({ ...p, lastName: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label className="form-label">Email *</Label><Input type="email" value={newEmp.email} onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
                <div><Label className="form-label">Phone</Label><Input type="tel" value={newEmp.phone} onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
                <div>
                  <Label className="form-label">Role</Label>
                  <Select value={newEmp.role} onValueChange={v => setNewEmp(p => ({ ...p, role: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_admin">Store Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="front_desk">Front Desk</SelectItem>
                      <SelectItem value="read_only">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="form-label">Temporary Password</Label><Input type="password" value={newEmp.password} onChange={e => setNewEmp(p => ({ ...p, password: e.target.value }))} className="mt-1" placeholder="Min 6 chars. Employee can reset later." /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAdd} disabled={!newEmp.firstName || !newEmp.lastName || !newEmp.email || isCreating}>{isCreating ? 'Creating…' : 'Add Employee'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-10 text-[#76707F]">
            <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-[14px] text-[#2B2833] cursor-pointer">No employees added yet</p>
          </div>
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-black/[0.06]">
            <table className="w-full">
              <thead className="table-header-gradient border-b border-black/[0.04]">
                <tr className="hover:bg-[#FAFAF9] transition-colors">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Invite</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {employees.map((emp: any) => (
                  <tr className="hover:bg-[#FAFAF9] transition-colors" key={emp.id}>
                    <td className="px-6 py-3 text-[14px] text-[#2B2833]">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">{emp.firstName?.[0]}{emp.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[14px] font-medium text-[#2B2833]">{emp.name || `${emp.firstName} ${emp.lastName}`.trim()}</p>
                          <p className="text-[12px] text-[#76707F]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[14px] text-[#2B2833]"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E8E6FF] text-[#6B5EF9] capitalize">{(emp.role || '').replace('_', ' ')}</span></td>
                    <td className="px-6 py-3 text-[14px] text-[#2B2833]"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${emp.isActive ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F5F5F5] text-[#76707F]'}`}>{emp.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-3 text-[14px] text-[#2B2833]">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E8E6FF] text-[#6B5EF9] capitalize">
                        {emp.inviteStatus || 'active'}
                      </span>
                    </td>
                    <td className="text-[12px] text-[#76707F]">{emp.lastLogin || '—'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset password" onClick={() => handleResetPassword(emp.id)}>
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={emp.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(emp.id, emp.isActive)}>
                          {emp.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => removeEmployee(emp.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      {/* Per-Employee Permissions */}
      {employees.length > 0 && (
        <SettingsCard title="Employee-Specific Permissions" description="Toggle individual access per employee">
          <div className="space-y-4">
            {employees.map((emp: Employee) => (
              <EmployeePermissionsCard key={emp.id} employee={emp} setEmployees={setEmployees} markDirty={markDirty} />
            ))}
          </div>
        </SettingsCard>
      )}
    </>
  );
}

function EmployeePermissionsCard({ employee, setEmployees, markDirty }: { employee: Employee; setEmployees: any; markDirty: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const togglePerm = (key: keyof EmployeePermissions) => {
    setEmployees((prev: Employee[]) => prev.map(e => e.id === employee.id ? { ...e, permissions: { ...e.permissions, [key]: !e.permissions[key] } } : e));
    markDirty();
  };

  const permLabels: { key: keyof EmployeePermissions; label: string }[] = [
    { key: 'accessTakeIn', label: 'Access Take-In' },
    { key: 'accessInventory', label: 'Access Inventory' },
    { key: 'accessCustomers', label: 'Access Customers' },
    { key: 'accessPayouts', label: 'Access Payouts' },
    { key: 'accessStatistics', label: 'Access Statistics' },
    { key: 'accessSettings', label: 'Access Settings' },
    { key: 'accessSavedForLater', label: 'Access Saved For Later' },
    { key: 'canEditRates', label: 'Can Edit Rates' },
    { key: 'canEditFinalPayout', label: 'Can Edit Final Payout' },
    { key: 'canPrintLabels', label: 'Can Print Labels / Receipts' },
    { key: 'canDeleteItems', label: 'Can Delete Items' },
    { key: 'canCompletePurchase', label: 'Can Complete Purchase' },
  ];

  return (
    <div className="rounded-[12px] border border-black/[0.06] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 hover:bg-black/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px]">{employee.firstName?.[0]}{employee.lastName?.[0]}</AvatarFallback></Avatar>
          <span className="text-[14px] font-medium text-[#2B2833]">{employee.name}</span>
          <Badge variant="outline" className="text-[10px] capitalize">{employee.role.replace('_', ' ')}</Badge>
        </div>
        <ChevronRight className={`w-4 h-4 text-[#76707F] transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t px-4 py-3 grid grid-cols-2 gap-y-2 gap-x-6">
          {permLabels.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-[13px] text-[#2B2833] cursor-pointer">
              <Checkbox checked={employee.permissions[key]} onCheckedChange={() => togglePerm(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 3. Visibility & Permissions ─────────────────────────────────────────────

function VisibilityTab({ global, setGlobal, employees, setEmployees, markDirty }: any) {
  const setG = (key: string, val: boolean) => { setGlobal((p: any) => ({ ...p, [key]: val })); markDirty(); };

  const toggleEmpVis = (empId: string, key: keyof EmployeeVisibility) => {
    setEmployees((prev: Employee[]) => prev.map(e => e.id === empId ? { ...e, visibility: { ...e.visibility, [key]: !e.visibility[key] } } : e));
    markDirty();
  };

  return (
    <>
      <SettingsCard title="Global Visibility Toggles" description="These apply to all non-admin employees by default">
        <ToggleRow label="Show Profit on Take-In page" checked={global.showProfit} onChange={v => setG('showProfit', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show Payout Percentage on Take-In page" checked={global.showPayoutPercent} onChange={v => setG('showPayoutPercent', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show Market Value on Take-In page" checked={global.showMarketValue} onChange={v => setG('showMarketValue', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show Profit in footer summary" checked={global.showProfitInFooter} onChange={v => setG('showProfitInFooter', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show Average Rate in footer summary" checked={global.showAverageRateInFooter} onChange={v => setG('showAverageRateInFooter', v)} />

        <div className="pt-3 text-[12px] text-[#76707F] bg-black/[0.03] rounded-[8px] p-3 mt-3">
          <strong>Note:</strong> Store Admins always see everything. These toggles affect Managers, Buyers, Front Desk, and Read Only roles.
        </div>
      </SettingsCard>

      {employees.length > 0 && (
        <SettingsCard title="Employee-Level Overrides" description="Override the global defaults for individual employees">
          <div className="rounded-[12px] overflow-hidden border border-black/[0.06]">
            <table className="w-full">
              <thead className="table-header-gradient border-b border-black/[0.04]">
                <tr className="hover:bg-[#FAFAF9] transition-colors">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Hide Profit</th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Hide % Paid</th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Hide Market</th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Hide Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {employees.map((emp: Employee) => (
                  <tr className="hover:bg-[#FAFAF9] transition-colors" key={emp.id}>
                    <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833]">{emp.name}</td>
                    <td className="text-center"><Checkbox checked={emp.visibility.hideProfit} onCheckedChange={() => toggleEmpVis(emp.id, 'hideProfit')} /></td>
                    <td className="text-center"><Checkbox checked={emp.visibility.hidePercentagePaid} onCheckedChange={() => toggleEmpVis(emp.id, 'hidePercentagePaid')} /></td>
                    <td className="text-center"><Checkbox checked={emp.visibility.hideMarketValue} onCheckedChange={() => toggleEmpVis(emp.id, 'hideMarketValue')} /></td>
                    <td className="text-center"><Checkbox checked={emp.visibility.hideTotalPayoutBreakdown} onCheckedChange={() => toggleEmpVis(emp.id, 'hideTotalPayoutBreakdown')} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsCard>
      )}
    </>
  );
}

// ── 4. Intake & Payout Defaults ─────────────────────────────────────────────

function IntakePayoutTab({ intake, setIntake, payout, setPayout, rates, setRates, markDirty }: any) {
  const setI = (k: string, v: any) => { setIntake((p: any) => ({ ...p, [k]: v })); markDirty(); };
  const setP = (k: string, v: any) => { setPayout((p: any) => ({ ...p, [k]: v })); markDirty(); };
  const setR = (k: string, v: number) => { setRates((p: any) => ({ ...p, [k]: v })); markDirty(); };

  return (
    <>
      <SettingsCard title="Intake Defaults" description="How the Take-In page behaves when opened">
        <ToggleRow label="Fast Entry mode ON by default" checked={intake.fastEntryDefault} onChange={v => setI('fastEntryDefault', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Auto-focus first weight field" checked={intake.autoFocusWeight} onChange={v => setI('autoFocusWeight', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable Save For Later" checked={intake.enableSaveForLater} onChange={v => setI('enableSaveForLater', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable Batch Photos" checked={intake.enableBatchPhotos} onChange={v => setI('enableBatchPhotos', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable AI Assist button" checked={intake.enableAiAssist} onChange={v => setI('enableAiAssist', v)} />

        <div className="pt-3 grid grid-cols-2 gap-4">
          <div>
            <Label className="form-label">Default Category</Label>
            <Select value={intake.defaultCategory} onValueChange={v => setI('defaultCategory', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jewelry">Jewelry</SelectItem>
                <SelectItem value="watches">Watches</SelectItem>
                <SelectItem value="bullion">Bullion</SelectItem>
                <SelectItem value="stones">Stones</SelectItem>
                <SelectItem value="silverware">Silverware</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="form-label">Item Card Layout</Label>
            <Select value={intake.itemCardLayout} onValueChange={v => setI('itemCardLayout', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Payout Defaults">
        <div className="pb-3">
          <Label className="form-label">Default Payout Method</Label>
          <Select value={payout.defaultMethod} onValueChange={v => setP('defaultMethod', v)}>
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="store_credit">Store Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Allow split payout methods" checked={payout.allowSplitPayout} onChange={v => setP('allowSplitPayout', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show confirmation modal before purchase" checked={payout.showConfirmationModal} onChange={v => setP('showConfirmationModal', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require payout info before completion" checked={payout.requirePayoutInfoBeforeCompletion} onChange={v => setP('requirePayoutInfoBeforeCompletion', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require customer info before completion" checked={payout.requireCustomerInfoBeforeCompletion} onChange={v => setP('requireCustomerInfoBeforeCompletion', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Allow override of final payout amount" checked={payout.allowOverrideFinalPayout} onChange={v => setP('allowOverrideFinalPayout', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Allow per-item rate edits" checked={payout.allowPerItemRateEdits} onChange={v => setP('allowPerItemRateEdits', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Allow batch-wide rate edits" checked={payout.allowBatchRateEdits} onChange={v => setP('allowBatchRateEdits', v)} />
      </SettingsCard>

      <SettingsCard title="Base Payout Percentages" description="Default payout % per metal/category">
        <div className="space-y-3">
          {Object.entries(rates).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-[#2B2833] capitalize">{key}</span>
              <div className="flex items-center gap-1.5">
                <Input type="number" min={0} max={100} value={val as number} onChange={e => setR(key, parseFloat(e.target.value) || 0)} className="w-20 text-center text-[14px]" />
                <span className="text-[14px] text-[#76707F]">%</span>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>
    </>
  );
}

// ── 5. Customer & Compliance ────────────────────────────────────────────────

function CustomerComplianceTab({ customer, setCustomer, compliance, setCompliance, markDirty }: any) {
  const setC = (k: string, v: any) => { setCustomer((p: any) => ({ ...p, [k]: v })); markDirty(); };
  const setCo = (k: string, v: any) => { setCompliance((p: any) => ({ ...p, [k]: v })); markDirty(); };

  return (
    <>
      <SettingsCard title="Customer Capture" description="What information is required from customers">
        <ToggleRow label="Require customer ID scan" checked={customer.requireIdScan} onChange={v => setC('requireIdScan', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Allow manual entry if no ID scanned" checked={customer.allowManualEntry} onChange={v => setC('allowManualEntry', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require phone number" checked={customer.requirePhone} onChange={v => setC('requirePhone', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require email" checked={customer.requireEmail} onChange={v => setC('requireEmail', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require address" checked={customer.requireAddress} onChange={v => setC('requireAddress', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require gender" checked={customer.requireGender} onChange={v => setC('requireGender', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require date of birth" checked={customer.requireDob} onChange={v => setC('requireDob', v)} />
      </SettingsCard>

      <SettingsCard title="Compliance Settings">
        <div className="grid grid-cols-2 gap-4 pb-3">
          <div><Label className="form-label">Hold Period (days)</Label><Input type="number" min={1} max={365} value={compliance.holdPeriodDays} onChange={e => setCo('holdPeriodDays', parseInt(e.target.value) || 90)} className="mt-1 w-28" /></div>
        </div>
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require customer signature before purchase" checked={compliance.requireSignature} onChange={v => setCo('requireSignature', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require employee name on transaction" checked={compliance.requireEmployeeName} onChange={v => setCo('requireEmployeeName', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require note if payout over threshold" description={compliance.requireNoteOverAmount ? `Currently: $${compliance.noteThreshold}` : undefined} checked={compliance.requireNoteOverAmount} onChange={v => setCo('requireNoteOverAmount', v)} />
        {compliance.requireNoteOverAmount && (
          <div className="pl-6 pb-2">
            <Label className="form-label">Threshold Amount ($)</Label>
            <Input type="number" min={0} value={compliance.noteThreshold} onChange={e => setCo('noteThreshold', parseInt(e.target.value) || 500)} className="mt-1 w-28" />
          </div>
        )}
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show warning for transactions over threshold" checked={compliance.showWarningOverThreshold} onChange={v => setCo('showWarningOverThreshold', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Require manager approval over threshold" description={compliance.requireManagerApproval ? `Currently: $${compliance.approvalThreshold}` : undefined} checked={compliance.requireManagerApproval} onChange={v => setCo('requireManagerApproval', v)} />
        {compliance.requireManagerApproval && (
          <div className="pl-6 pb-2">
            <Label className="form-label">Approval Threshold ($)</Label>
            <Select value={String(compliance.approvalThreshold)} onValueChange={v => setCo('approvalThreshold', parseInt(v))}>
              <SelectTrigger className="mt-1 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="500">$500</SelectItem>
                <SelectItem value="1000">$1,000</SelectItem>
                <SelectItem value="5000">$5,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </SettingsCard>
    </>
  );
}

// ── 6. Labels / Printing ────────────────────────────────────────────────────

function LabelsPrintingTab({ settings, setSettings, markDirty }: any) {
  const set = (k: string, v: any) => { setSettings((p: any) => ({ ...p, [k]: v })); markDirty(); };

  return (
    <>
      <SettingsCard title="Printing Controls">
        <ToggleRow label="Enable Print Receipt button" checked={settings.enablePrintReceipt} onChange={v => set('enablePrintReceipt', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable Print Labels button" checked={settings.enablePrintLabels} onChange={v => set('enablePrintLabels', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Auto-print receipt after completion" checked={settings.autoPrintReceipt} onChange={v => set('autoPrintReceipt', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Auto-print batch QR label" checked={settings.autoPrintBatchQr} onChange={v => set('autoPrintBatchQr', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Auto-print item QR labels" checked={settings.autoPrintItemQr} onChange={v => set('autoPrintItemQr', v)} />
      </SettingsCard>

      <SettingsCard title="Label Content" description="What appears on printed labels">
        <div className="grid grid-cols-2 gap-y-2 gap-x-6">
          {[
            ['showBatchNumber', 'Batch Number'],
            ['showItemNumber', 'Item Number'],
            ['showItemDescription', 'Item Description'],
            ['showWeight', 'Weight'],
            ['showPayoutAmount', 'Payout Amount'],
            ['showDate', 'Date'],
            ['showQrCode', 'QR Code'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[13px] text-[#2B2833] py-1.5 cursor-pointer">
              <Checkbox checked={settings[key]} onCheckedChange={(v) => set(key, !!v)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Quote / Receipt Options">
        <ToggleRow label="Show store logo" checked={settings.showStoreLogo} onChange={v => set('showStoreLogo', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show footer note" checked={settings.showFooterNote} onChange={v => set('showFooterNote', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show custom disclaimer" checked={settings.showDisclaimer} onChange={v => set('showDisclaimer', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Show Saved-For-Later items on quote" checked={settings.showSavedForLaterOnQuote} onChange={v => set('showSavedForLaterOnQuote', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Hide payout percentages on printed documents" checked={settings.hidePayoutPercentsOnPrint} onChange={v => set('hidePayoutPercentsOnPrint', v)} />
      </SettingsCard>
    </>
  );
}

// ── 7. Notifications ────────────────────────────────────────────────────────

function NotificationsTab({ settings, setSettings, markDirty }: any) {
  const set = (k: string, v: any) => { setSettings((p: any) => ({ ...p, [k]: v })); markDirty(); };

  return (
    <>
      <SettingsCard title="Alert Toggles">
        <ToggleRow label="Send email when a quote is saved" checked={settings.emailOnQuoteSaved} onChange={v => set('emailOnQuoteSaved', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Send reminder for Save For Later items" checked={settings.reminderSaveForLater} onChange={v => set('reminderSaveForLater', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Notify admin when employee completes purchase" checked={settings.notifyAdminOnPurchase} onChange={v => set('notifyAdminOnPurchase', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Notify admin when payout exceeds threshold" checked={settings.notifyAdminPayoutThreshold} onChange={v => set('notifyAdminPayoutThreshold', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Notify admin when employee changes rate" checked={settings.notifyAdminRateChange} onChange={v => set('notifyAdminRateChange', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Daily summary email" checked={settings.dailySummary} onChange={v => set('dailySummary', v)} />
      </SettingsCard>

      <SettingsCard title="Reminder Timing" description="When to follow up on Save For Later items">
        <RadioGroup value={settings.reminderInterval} onValueChange={v => { set('reminderInterval', v); }} className="space-y-2">
          <div className="flex items-center gap-2"><RadioGroupItem value="1day" id="r1" /><Label htmlFor="r1" className="text-[14px] text-[#2B2833] cursor-pointer">After 1 day</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="3days" id="r3" /><Label htmlFor="r3" className="text-[14px] text-[#2B2833] cursor-pointer">After 3 days</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="7days" id="r7" /><Label htmlFor="r7" className="text-[14px] text-[#2B2833] cursor-pointer">After 7 days</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="custom" id="rc" /><Label htmlFor="rc" className="text-[14px] text-[#2B2833] cursor-pointer">Custom interval</Label></div>
        </RadioGroup>
      </SettingsCard>
    </>
  );
}

// ── 8. Appearance ───────────────────────────────────────────────────────────

function AppearanceTab({ settings, setSettings, markDirty }: any) {
  const set = (k: string, v: any) => { setSettings((p: any) => ({ ...p, [k]: v })); markDirty(); };

  return (
    <>
      <SettingsCard title="Theme">
        <div>
          <Label className="form-label">Theme Mode</Label>
          <Select value={settings.theme} onValueChange={v => set('theme', v)}>
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Light)</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-3">
          <Label className="form-label">Accent Color</Label>
          <div className="flex gap-2 mt-2">
            {['blue', 'indigo', 'green', 'amber', 'rose'].map(color => (
              <button
                key={color}
                onClick={() => set('accentColor', color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${settings.accentColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color === 'blue' ? 'hsl(217,91%,60%)' : color === 'indigo' ? 'hsl(239,84%,67%)' : color === 'green' ? 'hsl(142,71%,45%)' : color === 'amber' ? 'hsl(38,92%,50%)' : 'hsl(347,77%,50%)' }}
              />
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Layout Preferences">
        <ToggleRow label="Compact mode" description="Reduce spacing and padding throughout the app" checked={settings.compactMode} onChange={v => set('compactMode', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Large input mode" description="Increase size of text inputs for easier use" checked={settings.largeInputMode} onChange={v => set('largeInputMode', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Sidebar collapsed by default" checked={settings.sidebarCollapsed} onChange={v => set('sidebarCollapsed', v)} />
      </SettingsCard>
    </>
  );
}

// ── 9. Advanced ─────────────────────────────────────────────────────────────

function AdvancedTab({ settings, setSettings, markDirty }: any) {
  const set = (k: string, v: any) => { setSettings((p: any) => ({ ...p, [k]: v })); markDirty(); };

  return (
    <>
      <SettingsCard title="Data & Storage">
        <div className="pb-3">
          <Label className="form-label">Archive completed take-ins after (days)</Label>
          <Input type="number" min={1} max={365} value={settings.archiveAfterDays} onChange={e => set('archiveAfterDays', parseInt(e.target.value) || 90)} className="mt-1 w-28" />
        </div>
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable automatic draft save" checked={settings.autoDraftSave} onChange={v => set('autoDraftSave', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable duplicate item detection" checked={settings.duplicateDetection} onChange={v => set('duplicateDetection', v)} />
      </SettingsCard>

      <SettingsCard title="Workflow">
        <ToggleRow label="Enable keyboard shortcuts" checked={settings.keyboardShortcuts} onChange={v => set('keyboardShortcuts', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable category grouping on Take-In page" checked={settings.categoryGrouping} onChange={v => set('categoryGrouping', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Enable subcategory grouping on Take-In page" checked={settings.subcategoryGrouping} onChange={v => set('subcategoryGrouping', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Lock completed transactions from editing" checked={settings.lockCompletedTransactions} onChange={v => set('lockCompletedTransactions', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Allow reopening completed transactions" checked={settings.allowReopenCompleted} onChange={v => set('allowReopenCompleted', v)} />
      </SettingsCard>

      <SettingsCard title="Safety Confirmations" description="Require confirmation before critical actions">
        <ToggleRow label="Confirm before deleting item" checked={settings.confirmDeleteItem} onChange={v => set('confirmDeleteItem', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Confirm before completing purchase" checked={settings.confirmCompletePurchase} onChange={v => set('confirmCompletePurchase', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Confirm before changing payout method" checked={settings.confirmChangePayoutMethod} onChange={v => set('confirmChangePayoutMethod', v)} />
        <div className="border-t border-black/[0.04]" />
        <ToggleRow label="Confirm before removing saved-for-later item" checked={settings.confirmRemoveSavedForLater} onChange={v => set('confirmRemoveSavedForLater', v)} />
      </SettingsCard>
    </>
  );
}
