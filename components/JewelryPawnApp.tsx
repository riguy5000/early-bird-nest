import { useState } from 'react';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CustomerModule } from './CustomerModule';
import { TakeInPage } from './store/TakeInPage';
import { InventoryModule } from './InventoryModule';
import { PayoutsModule } from './PayoutsModule';
import { StoreSettingsModule } from './StoreSettingsModule';
import { OwnerDashboard } from './dashboard/OwnerDashboard';
import { AnalyticsModule } from './dashboard/AnalyticsModule';
import { 
  Store, Package, Users, DollarSign, BarChart3, Settings, LogOut, User,
  Bell, Search, Plus, TrendingUp, Menu
} from 'lucide-react';
import { toast } from 'sonner';

interface JewelryPawnAppProps {
  user: any;
  onLogout: () => void;
}

export function JewelryPawnApp({ user, onLogout }: JewelryPawnAppProps) {
  const [activeModule, setActiveModule] = useState('dashboard');
  
  const storeId = user?.storeId || user?.store?.id || '';
  const employeeId = user?.id || '';
  const storeName = user?.store?.name || user?.name || 'Store';
  const userPermissions = user?.permissions || {};
  const isStoreAdmin = user?.role === 'store_admin';

  const { resolved, refetch: refetchSettings, settings: storeSettings } = useStoreSettings(storeId, employeeId);

  const effectiveVisibility = {
    hideProfit: user?.visibility?.hideProfit ?? resolved.visibility.hideProfit,
    hidePayout: user?.visibility?.hidePercentagePaid ?? resolved.visibility.hidePayout,
    hideMarketValue: user?.visibility?.hideMarketValue ?? resolved.visibility.hideMarketValue,
  };

  const allModules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, requiresPermission: 'accessStatistics', component: () => <OwnerDashboard storeId={storeId} storeName={storeName} onNavigate={setActiveModule} /> },
    { id: 'take-in', name: 'Take-In', icon: Plus, requiresPermission: 'accessTakeIn', component: () => (
      <TakeInPage 
        store={{ 
          id: storeId, name: storeName, defaultPayoutPercentage: resolved.rateDefaults?.gold ?? 75, 
          hideProfit: effectiveVisibility.hideProfit, hidePayout: effectiveVisibility.hidePayout, 
          hideMarketValue: effectiveVisibility.hideMarketValue, enableFastEntry: resolved.enableFastEntry, 
          autoPrintLabels: resolved.enablePrintLabels,
          requireCustomerInfoBeforeCompletion: resolved.requireCustomerInfoBeforeCompletion,
          defaultPayoutMethod: resolved.defaultPayoutMethod,
          enablePrintReceipt: resolved.enablePrintReceipt && (isStoreAdmin || userPermissions.canPrintReceipts !== false),
          enablePrintLabels: resolved.enablePrintLabels && (isStoreAdmin || userPermissions.canPrintLabels !== false),
          enableAiAssist: resolved.enableAiAssist,
          confirmCompletePurchase: resolved.confirmCompletePurchase,
          confirmDeleteItem: resolved.confirmDeleteItem,
          requireIdScan: resolved.requireIdScan,
          allowManualEntry: resolved.allowManualEntry,
          rateDefaults: resolved.rateDefaults,
          canEditRates: isStoreAdmin || userPermissions.canEditRates === true,
          canDeleteItems: isStoreAdmin || userPermissions.canDeleteItems === true,
          canCompletePurchase: isStoreAdmin || userPermissions.canCompletePurchase !== false,
          enableSaveForLater: storeSettings?.intakeDefaults?.enableSaveForLater !== false && (isStoreAdmin || userPermissions.accessSavedForLater !== false),
          enableBatchPhotos: storeSettings?.intakeDefaults?.enableBatchPhotos !== false,
        }} 
        employee={{ id: employeeId, name: user?.name || 'Employee' }} 
        onComplete={(data) => toast.success('Transaction saved')} 
        onClose={() => setActiveModule('dashboard')} 
      />
    )},
    { id: 'inventory', name: 'Inventory', icon: Package, requiresPermission: 'accessInventory', component: () => <InventoryModule currentStore={{ id: storeId, name: storeName }} employeeId={employeeId} hideProfit={effectiveVisibility.hideProfit} permissions={userPermissions} /> },
    { id: 'customers', name: 'Customers', icon: Users, requiresPermission: 'accessCustomers', component: () => <CustomerModule user={user} /> },
    { id: 'payouts', name: 'Payouts', icon: DollarSign, requiresPermission: 'accessPayouts', component: () => <PayoutsModule currentStore={{ id: storeId, name: storeName }} /> },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp, requiresPermission: 'accessStatistics', component: () => <AnalyticsModule storeId={storeId} storeName={storeName} /> },
    { id: 'settings', name: 'Settings', icon: Settings, requiresPermission: 'accessSettings', component: () => (
      <StoreSettingsModule 
        currentStore={{ id: storeId, name: storeName, type: user?.store?.type || 'jewelry' }} 
        onSettingsSaved={refetchSettings}
      />
    )}
  ];

  const modules = allModules.filter(m => {
    if (isStoreAdmin) return true;
    const perm = m.requiresPermission as keyof typeof userPermissions;
    return userPermissions[perm] !== false;
  });

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component;
  const isTakeIn = activeModule === 'take-in';
  const userInitials = (user?.name?.split(' ').map((n: string) => n[0]).join('') || user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className={`${isTakeIn ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'} relative`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Gradient now applied globally on body via index.css */}

      {/* Header — frosted glass */}
      <header className={`sticky top-0 z-50 ${isTakeIn ? 'flex-shrink-0' : ''}`}>
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] icon-container flex items-center justify-center">
                <Store className="h-4.5 w-4.5 text-[#6B5EF9]" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-[#2B2833] leading-tight">{storeName || 'Bravo Jewellers'}</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {modules.map((module) => {
                const isActive = activeModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all ${
                      isActive
                        ? 'nav-tab-active'
                        : 'nav-tab-inactive'
                    }`}
                  >
                    {module.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A3AE]" />
              <input
                type="text"
                placeholder="Search..."
                className="input-search-header"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
              />
            </div>

            {/* Notifications */}
            <button className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
              <Bell className="w-5 h-5 text-[#76707F]" />
            </button>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden">
                <button className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
                  <Menu className="w-5 h-5 text-[#76707F]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white/90 backdrop-blur-xl rounded-[14px] border border-white/60 shadow-2xl">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <DropdownMenuItem
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`rounded-[8px] ${activeModule === module.id ? 'bg-[#F8F7FB]' : ''}`}
                    >
                      <Icon className="w-4 h-4 mr-2 text-[#76707F]" />
                      {module.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-[#6B5EF9] flex items-center justify-center text-white text-[13px] font-semibold hover:opacity-90 transition-opacity ring-2 ring-white/80">
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white/90 backdrop-blur-xl rounded-[14px] border border-white/60 shadow-2xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <div className="text-[14px] font-semibold text-[#2B2833]">{user?.name || 'User'}</div>
                    <div className="text-[12px] text-[#76707F]">{user?.email}</div>
                    <Badge className="w-fit text-[10px] bg-[#F8F7FB] text-[#6B5EF9] border-0 mt-0.5">
                      {user?.role === 'store_admin' ? 'Store Admin' : 'Employee'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-[8px]" onClick={() => setActiveModule('settings')}>
                  <Settings className="w-4 h-4 mr-2 text-[#76707F]" />
                  Store Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="rounded-[8px] text-[#F87171] focus:text-[#F87171]">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={isTakeIn ? 'flex-1 min-h-0 overflow-hidden' : 'max-w-[1600px] mx-auto px-8 py-8'}>
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
}
