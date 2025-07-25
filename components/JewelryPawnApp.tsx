import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CustomerModule } from './CustomerModule';
import { EnhancedTakeInModule } from './EnhancedTakeInModule';
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

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, component: StatisticsModule },
    { id: 'take-in', name: 'Take-In', icon: Plus, component: EnhancedTakeInModule },
    { id: 'inventory', name: 'Inventory', icon: Package, component: InventoryModule },
    { id: 'customers', name: 'Customers', icon: Users, component: CustomerModule },
    { id: 'payouts', name: 'Payouts', icon: DollarSign, component: PayoutsModule },
    { id: 'settings', name: 'Settings', icon: Settings, component: StoreSettingsModule }
  ];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{user?.store?.name || 'Jewelry & Pawn Store'}</h1>
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
      <main className="p-6">
        {activeModule === 'dashboard' ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h2>
                <p className="text-muted-foreground">
                  Here's what's happening at your store today
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>

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
                      <div className={`flex items-center space-x-1 text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('take-in')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Take-In
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('find-customer')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Customer
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('inventory')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Check Inventory
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('payout')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Process Payout
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest transactions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'take-in' ? 'bg-blue-500' :
                            activity.type === 'customer' ? 'bg-green-500' :
                            activity.type === 'payout' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{activity.description}</p>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{activity.time}</span>
                            </div>
                          </div>
                        </div>
                        {activity.value && (
                          <Badge variant="secondary">{activity.value}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Development Status */}
            <Card className="border-dashed border-2">
              <CardContent className="flex items-center justify-center py-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">All Modules Available</h3>
                    <p className="text-muted-foreground max-w-md">
                      Click on the navigation buttons above to access Take-In, Inventory, 
                      Customers, Payouts, and Settings modules. Each module is fully functional.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="outline">✅ Take-In Module</Badge>
                    <Badge variant="outline">✅ Inventory System</Badge>
                    <Badge variant="outline">✅ Customer CRM</Badge>
                    <Badge variant="outline">✅ Payouts Module</Badge>
                    <Badge variant="outline">✅ Store Settings</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {ActiveComponent && <ActiveComponent user={user} currentStore={user?.store} />}
          </div>
        )}
      </main>
    </div>
  );
}