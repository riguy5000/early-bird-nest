import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MetalApiKeysSettings } from './admin/MetalApiKeysSettings';
import { 
  Crown, 
  LogOut, 
  Settings, 
  Shield, 
  Users, 
  Building, 
  BarChart3, 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Wifi, 
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Bell,
  Star,
  Store
} from 'lucide-react';

interface RootAdminConsoleProps {
  user: any;
  onLogout: () => void;
}

export function RootAdminConsole({ user, onLogout }: RootAdminConsoleProps) {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'stores', name: 'Stores', icon: Building },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'system', name: 'System', icon: Server },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const systemStats = [
    { label: 'Total Stores', value: '47', change: '+3', trend: 'up', icon: Building },
    { label: 'Active Users', value: '1,247', change: '+12%', trend: 'up', icon: Users },
    { label: 'System Health', value: '99.9%', change: 'Stable', trend: 'stable', icon: Activity },
    { label: 'Revenue', value: '$89.4K', change: '+8.2%', trend: 'up', icon: TrendingUp }
  ];

  const recentStores = [
    { id: 1, name: 'Golden Jewelry Co.', location: 'New York, NY', status: 'Active', users: 12, created: '2024-01-15' },
    { id: 2, name: 'Silver Touch Pawn', location: 'Los Angeles, CA', status: 'Active', users: 8, created: '2024-01-20' },
    { id: 3, name: 'Diamond Palace', location: 'Chicago, IL', status: 'Pending', users: 5, created: '2024-01-25' }
  ];

  const systemAlerts = [
    { type: 'warning', message: 'Store #23 needs database optimization', time: '2 hours ago' },
    { type: 'info', message: 'System backup completed successfully', time: '4 hours ago' },
    { type: 'success', message: 'New store onboarded: Diamond Palace', time: '6 hours ago' }
  ];

  const handleStoreAction = (storeId: number, action: string) => {
    console.log(`Action ${action} for store ${storeId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              <div>
                <h1 className="text-xl font-bold text-yellow-700">Root Administration</h1>
                <p className="text-sm text-muted-foreground">Platform Management Console</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'default' : 'ghost'}
                    onClick={() => setActiveSection(section.id)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-yellow-100 text-yellow-800">
                      {user?.name?.charAt(0) || 'R'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{user?.name || 'Root Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="font-medium">{user?.name || 'Root Administrator'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                    <Badge className="w-fit text-xs bg-yellow-100 text-yellow-800">
                      Root Admin
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="w-4 h-4 mr-2" />
                  Security Center
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
        {activeSection === 'overview' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Platform Overview</h2>
                <p className="text-muted-foreground">
                  Manage all stores and users across the jewelry & pawn management platform
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className={`text-xs ${
                            stat.trend === 'up' ? 'text-green-600' : 
                            stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Stores and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Stores */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Stores</CardTitle>
                  <CardDescription>Newly registered stores in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentStores.map((store) => (
                      <div key={store.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Store className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="text-sm text-muted-foreground">{store.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={store.status === 'Active' ? 'default' : 'secondary'}>
                            {store.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleStoreAction(store.id, 'view')}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStoreAction(store.id, 'manage')}>
                                Manage Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStoreAction(store.id, 'suspend')}>
                                Suspend Store
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Recent system notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.type === 'warning' ? 'bg-yellow-500' :
                          alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                        {alert.type === 'warning' && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Settings section with Metal API Keys */}
        {activeSection === 'settings' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Platform Settings</h2>
              <p className="text-muted-foreground">Configure platform-wide integrations and preferences</p>
            </div>
            <MetalApiKeysSettings />
          </div>
        )}

        {/* Other sections placeholder */}
        {activeSection !== 'overview' && activeSection !== 'settings' && (
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Settings className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium capitalize">{activeSection} Section</h3>
                    <p className="text-muted-foreground">
                      This section is under development. Advanced admin features will be available here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
