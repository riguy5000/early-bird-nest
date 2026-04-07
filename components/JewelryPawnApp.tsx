import { useState } from 'react';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CustomerModule } from './CustomerModule';
import { TakeInPage } from './store/TakeInPage';
import { InventoryModule } from './InventoryModule';
import { PayoutsModule } from './PayoutsModule';
import { StoreSettingsModule } from './StoreSettingsModule';
import { StatisticsModule } from './StatisticsModule';
import { 
  Store, 
  Package, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  Menu
} from 'lucide-react';
import { toast } from 'sonner';

interface JewelryPawnAppProps {
  user: any;
  onLogout: () => void;
}

export function JewelryPawnApp({ user, onLogout }: JewelryPawnAppProps) {
  const [activeModule, setActiveModule] = useState('dashboard');
  
  // Derive store/employee IDs from authenticated user
  const storeId = user?.storeId || user?.store?.id || '';
  const employeeId = user?.id || '';
  const storeName = user?.store?.name || user?.name || 'Store';
  const userPermissions = user?.permissions || {};
  const isStoreAdmin = user?.role === 'store_admin';

  const { resolved, refetch: refetchSettings, settings: storeSettings } = useStoreSettings(storeId, employeeId);

  // Merge user-level visibility with store settings
  const effectiveVisibility = {
    hideProfit: user?.visibility?.hideProfit ?? resolved.visibility.hideProfit,
    hidePayout: user?.visibility?.hidePercentagePaid ?? resolved.visibility.hidePayout,
    hideMarketValue: user?.visibility?.hideMarketValue ?? resolved.visibility.hideMarketValue,
  };

  // Build modules list based on permissions
  const allModules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, requiresPermission: 'accessStatistics', component: () => <StatisticsModule currentStore={{ id: storeId, name: storeName }} /> },
    { id: 'take-in', name: 'Take-In', icon: Plus, requiresPermission: 'accessTakeIn', component: () => (
      <TakeInPage 
        store={{ 
          id: storeId, 
          name: storeName, 
          defaultPayoutPercentage: 75, 
          hideProfit: effectiveVisibility.hideProfit, 
          hidePayout: effectiveVisibility.hidePayout, 
          hideMarketValue: effectiveVisibility.hideMarketValue, 
          enableFastEntry: resolved.enableFastEntry, 
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
    { id: 'inventory', name: 'Inventory', icon: Package, requiresPermission: 'accessInventory', component: () => <InventoryModule currentStore={{ id: storeId, name: storeName }} /> },
    { id: 'customers', name: 'Customers', icon: Users, requiresPermission: 'accessCustomers', component: () => <CustomerModule user={user} /> },
    { id: 'payouts', name: 'Payouts', icon: DollarSign, requiresPermission: 'accessPayouts', component: () => <PayoutsModule currentStore={{ id: storeId, name: storeName }} /> },
    { id: 'settings', name: 'Settings', icon: Settings, requiresPermission: 'accessSettings', component: () => (
      <StoreSettingsModule 
        currentStore={{ id: storeId, name: storeName, type: user?.store?.type || 'jewelry' }} 
        onSettingsSaved={refetchSettings}
      />
    )}
  ];

  // Filter modules based on permissions (store_admin sees everything)
  const modules = allModules.filter(m => {
    if (isStoreAdmin) return true;
    const perm = m.requiresPermission as keyof typeof userPermissions;
    return userPermissions[perm] !== false;
  });

  const quickStats = [
    { label: 'Items in Stock', value: '1,247', change: '+12%', trend: 'up' },
    { label: 'Total Value', value: '$89,450', change: '+8.2%', trend: 'up' },
    { label: 'Active Customers', value: '342', change: '+5%', trend: 'up' },
    { label: 'Daily Revenue', value: '$2,890', change: '-2.1%', trend: 'down' }
  ];

  const recentActivities = [
    { type: 'take-in', description: 'Gold ring intake - 14k, 3.2g', time: '2 minutes ago', value: '$85' },
    { type: 'customer', description: 'New customer registered', time: '15 minutes ago', value: null },
    { type: 'payout', description: 'Customer payout processed', time: '32 minutes ago', value: '$1,250' },
    { type: 'inventory', description: 'Silver bracelet marked as sold', time: '1 hour ago', value: '$450' }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'take-in':
        setActiveModule('take-in');
        toast.success('Take-In module opened');
        break;
      case 'find-customer':
        setActiveModule('customers');
        toast.success('Customer module opened');
        break;
      case 'inventory':
        setActiveModule('inventory');
        toast.success('Inventory module opened');
        break;
      case 'payout':
        setActiveModule('payouts');
        toast.success('Payouts module opened');
        break;
      default:
        toast.info(`${action} feature coming soon`);
    }
  };

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component;

  const isTakeIn = activeModule === 'take-in';

  return (
    <div className={`${isTakeIn ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'} bg-background`}>
      {/* Header */}
      <header className={`border-b bg-card px-6 py-4 ${isTakeIn ? 'flex-shrink-0' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{storeName || 'Jewelry & Pawn Store'}</h1>
                <p className="text-sm text-muted-foreground">Management System</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Button
                    key={module.id}
                    variant={activeModule === module.id ? 'default' : 'ghost'}
                    onClick={() => setActiveModule(module.id)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{module.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => toast.info('Search feature coming soon')}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => toast.info('Notifications feature coming soon')}>
              <Bell className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <DropdownMenuItem
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={activeModule === module.id ? 'bg-accent' : ''}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {module.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {user?.name?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{user?.name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="font-medium">{user?.name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {user?.role === 'store_admin' ? 'Store Admin' : 'Employee'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Profile settings coming soon')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveModule('settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Store Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={isTakeIn ? 'flex-1 min-h-0 overflow-hidden' : 'p-6'}>
        {activeModule === 'dashboard' ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <Badge 
                        variant={stat.trend === 'up' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                        {stat.change}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks at your fingertips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button onClick={() => handleQuickAction('take-in')} className="flex flex-col items-center gap-2 h-auto py-4">
                    <Plus className="h-5 w-5" />
                    <span>New Take-In</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleQuickAction('find-customer')} className="flex flex-col items-center gap-2 h-auto py-4">
                    <Users className="h-5 w-5" />
                    <span>Find Customer</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleQuickAction('inventory')} className="flex flex-col items-center gap-2 h-auto py-4">
                    <Package className="h-5 w-5" />
                    <span>View Inventory</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleQuickAction('payout')} className="flex flex-col items-center gap-2 h-auto py-4">
                    <DollarSign className="h-5 w-5" />
                    <span>Process Payout</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transactions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {activity.type === 'take-in' && <Plus className="h-4 w-4 text-primary" />}
                          {activity.type === 'customer' && <User className="h-4 w-4 text-primary" />}
                          {activity.type === 'payout' && <DollarSign className="h-4 w-4 text-primary" />}
                          {activity.type === 'inventory' && <Package className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      {activity.value && (
                        <span className="text-sm font-semibold">{activity.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          ActiveComponent && <ActiveComponent />
        )}
      </main>
    </div>
  );
}
