import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CustomerModule } from './CustomerModule';
import { TakeInPage } from './store/TakeInPage';
import { InventoryModule } from './InventoryModule';
import { PayoutsModule } from './PayoutsModule';
import { StoreSettingsModule } from './StoreSettingsModule';
import { StatisticsModule } from './StatisticsModule';
import { 
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
  TrendingDown,
  Clock,
  Gem,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface JewelryPawnAppProps {
  user: any;
  onLogout: () => void;
}

export function JewelryPawnApp({ user, onLogout }: JewelryPawnAppProps) {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, component: StatisticsModule },
    { id: 'take-in', name: 'Take-In', icon: Plus, component: () => <TakeInPage store={{ id: 'store1', name: user?.store?.name || 'Main Store', defaultPayoutPercentage: 75, hideProfit: false, hidePayout: false, enableFastEntry: false, autoPrintLabels: true }} employee={{ id: 'emp1', name: user?.name || 'Employee' }} onComplete={(data) => toast.success('Transaction saved')} onClose={() => setActiveModule('dashboard')} /> },
    { id: 'inventory', name: 'Inventory', icon: Package, component: InventoryModule },
    { id: 'customers', name: 'Customers', icon: Users, component: CustomerModule },
    { id: 'payouts', name: 'Payouts', icon: DollarSign, component: PayoutsModule },
    { id: 'settings', name: 'Settings', icon: Settings, component: StoreSettingsModule }
  ];

  const quickStats = [
    { label: 'Items in Stock', value: '1,247', change: '+12%', trend: 'up' as const, icon: Package },
    { label: 'Total Value', value: '$89,450', change: '+8.2%', trend: 'up' as const, icon: DollarSign },
    { label: 'Active Customers', value: '342', change: '+5%', trend: 'up' as const, icon: Users },
    { label: 'Daily Revenue', value: '$2,890', change: '-2.1%', trend: 'down' as const, icon: BarChart3 }
  ];

  const recentActivities = [
    { type: 'take-in', description: 'Gold ring intake — 14k, 3.2g', time: '2 min ago', value: '$85' },
    { type: 'customer', description: 'New customer registered', time: '15 min ago', value: null },
    { type: 'payout', description: 'Customer payout processed', time: '32 min ago', value: '$1,250' },
    { type: 'inventory', description: 'Silver bracelet marked as sold', time: '1 hr ago', value: '$450' }
  ];

  const handleQuickAction = (action: string) => {
    setMobileMenuOpen(false);
    switch (action) {
      case 'take-in':
        setActiveModule('take-in');
        break;
      case 'find-customer':
        setActiveModule('customers');
        break;
      case 'inventory':
        setActiveModule('inventory');
        break;
      case 'payout':
        setActiveModule('payouts');
        break;
      default:
        toast.info(`${action} feature coming soon`);
    }
  };

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component;

  const NavItem = ({ module }: { module: typeof modules[0] }) => {
    const Icon = module.icon;
    const isActive = activeModule === module.id;
    return (
      <button
        onClick={() => {
          setActiveModule(module.id);
          setMobileMenuOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!sidebarCollapsed && <span>{module.name}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className={`
        hidden lg:flex flex-col border-r border-border bg-card
        transition-all duration-200
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Gem className="h-4 w-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold truncate">{user?.store?.name || 'Jewelry & Pawn'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {modules.map((module) => (
            <NavItem key={module.id} module={module} />
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm
                hover:bg-accent transition-colors
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="text-left truncate">
                    <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Profile settings coming soon')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveModule('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-[280px] bg-card border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Gem className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{user?.store?.name || 'Jewelry & Pawn'}</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {modules.map((module) => (
                <NavItem key={module.id} module={module} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              className="hidden lg:block text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold">
              {modules.find(m => m.id === activeModule)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => toast.info('Search coming soon')}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => toast.info('Notifications coming soon')}>
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {activeModule === 'dashboard' ? (
            <div className="max-w-6xl mx-auto p-6 space-y-6">
              {/* Welcome */}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <Card key={i} className="card-hover">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                            <StatIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5">
                          {stat.trend === 'up' ? (
                            <TrendingUp className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                            {stat.change}
                          </span>
                          <span className="text-xs text-muted-foreground">vs last week</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {[
                      { label: 'New Take-In', icon: Plus, action: 'take-in' },
                      { label: 'Find Customer', icon: Search, action: 'find-customer' },
                      { label: 'Check Inventory', icon: Package, action: 'inventory' },
                      { label: 'Process Payout', icon: DollarSign, action: 'payout' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.action}
                          onClick={() => handleQuickAction(item.action)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {recentActivities.map((activity, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              activity.type === 'take-in' ? 'bg-primary' :
                              activity.type === 'customer' ? 'bg-success' :
                              activity.type === 'payout' ? 'bg-warning' :
                              'bg-muted-foreground'
                            }`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{activity.description}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{activity.time}</span>
                              </div>
                            </div>
                          </div>
                          {activity.value && (
                            <Badge variant="secondary" className="ml-3 shrink-0 font-mono text-xs">
                              {activity.value}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto p-6">
              {ActiveComponent && <ActiveComponent user={user} currentStore={user?.store} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
