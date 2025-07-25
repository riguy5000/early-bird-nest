import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
import { apiCall } from '../utils/supabase/simple-client';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  RotateCcw, 
  GripVertical,
  Check,
  X,
  AlertCircle,
  Store,
  DollarSign,
  CreditCard,
  Users,
  Shield,
  Package,
  Bell,
  QrCode,
  Upload
} from 'lucide-react';

interface Store {
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
  role: string;
  isActive: boolean;
  quickSwitchOrder: number;
  avatar?: string;
  storeId: string;
}

interface PricingRule {
  category: string;
  subcategory?: string;
  payoutPercent: number;
}

interface PayoutMethod {
  method: string;
  enabled: boolean;
  isDefault: boolean;
  requiresPhoto?: boolean;
  requiresCheckNumber?: boolean;
}

interface Permission {
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionTemplate {
  id: string;
  name: string;
  permissions: Permission[];
}

interface StoreSettingsModuleProps {
  currentStore: Store | null;
  onStoreUpdate: (store: Store) => void;
}

export function StoreSettingsModule({ currentStore, onStoreUpdate }: StoreSettingsModuleProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    name: '',
    type: 'jewelry',
    address: '',
    phone: '',
    email: '',
    timezone: 'America/New_York',
    weightUnit: 'g',
    currency: 'USD',
    quoteFooter: '',
    legalHoldPeriod: 30,
    reminderDefault: 7,
    logo: ''
  });

  // Pricing Rules State
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    { category: 'gold', payoutPercent: 78 },
    { category: 'silver', payoutPercent: 75 },
    { category: 'platinum', payoutPercent: 80 },
    { category: 'stones', payoutPercent: 65 },
    { category: 'watches', payoutPercent: 70 }
  ]);

  const [subcategoryRules, setSubcategoryRules] = useState<PricingRule[]>([]);
  const [roundToNearest, setRoundToNearest] = useState(true);

  // Payout Methods State
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([
    { method: 'Check', enabled: true, isDefault: true, requiresCheckNumber: true, requiresPhoto: false },
    { method: 'Cash', enabled: true, isDefault: false, requiresPhoto: true },
    { method: 'Store Credit', enabled: false, isDefault: false }
  ]);

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Permission Templates State
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>([
    {
      id: 'buyer',
      name: 'Buyer',
      permissions: [
        { module: 'dashboard', canView: true, canEdit: false, canDelete: false },
        { module: 'take-in', canView: true, canEdit: true, canDelete: false },
        { module: 'inventory', canView: true, canEdit: false, canDelete: false },
        { module: 'customers', canView: true, canEdit: true, canDelete: false }
      ]
    }
  ]);

  // Employee Visibility Settings
  const [employeeVisibility, setEmployeeVisibility] = useState({
    showPayoutPercent: true,
    showProfit: false
  });

  // Categories & Modules State
  const [enabledCategories, setEnabledCategories] = useState({
    jewelry: true,
    watches: true,
    bullion: true,
    silverware: false,
    stones: true
  });

  const [futureModules, setFutureModules] = useState({
    marketplace: false,
    auctions: false,
    layaway: false
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    dailySummaryEmail: true,
    apiFailureAlerts: true,
    lowPriceAlerts: true,
    priceDropPercent: 5,
    smsNumber: ''
  });

  // Label & QR Preferences State
  const [labelPreferences, setLabelPreferences] = useState({
    autoPrintAfterPurchase: true,
    includePayoutOnLabel: false,
    smartBadgePrefix: ''
  });

  useEffect(() => {
    if (currentStore) {
      loadStoreSettings();
    }
  }, [currentStore]);

  const loadStoreSettings = async () => {
    if (!currentStore) return;

    try {
      setIsLoading(true);
      
      // Load general settings
      setGeneralSettings({
        name: currentStore.name || '',
        type: currentStore.type || 'jewelry',
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        email: currentStore.email || '',
        timezone: currentStore.timezone || 'America/New_York',
        weightUnit: currentStore.weightUnit || 'g',
        currency: currentStore.currency || 'USD',
        quoteFooter: currentStore.quoteFooter || '',
        legalHoldPeriod: currentStore.legalHoldPeriod || 30,
        reminderDefault: currentStore.reminderDefault || 7,
        logo: currentStore.logo || ''
      });

      // Load employees
      const { employees: storeEmployees } = await apiCall(`/stores/${currentStore.id}/employees`);
      setEmployees(storeEmployees || []);

      // Load other settings from API
      // For now, using default values - in production these would come from the API
      
    } catch (error) {
      console.error('Error loading store settings:', error);
      setError('Failed to load store settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralSettingChange = (field: string, value: any) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePricingRuleChange = (category: string, payoutPercent: number) => {
    setPricingRules(prev => 
      prev.map(rule => 
        rule.category === category ? { ...rule, payoutPercent } : rule
      )
    );
    setHasUnsavedChanges(true);
  };

  const handlePayoutMethodToggle = (method: string, field: 'enabled' | 'isDefault', value: boolean) => {
    setPayoutMethods(prev => 
      prev.map(pm => {
        if (pm.method === method) {
          const updated = { ...pm, [field]: value };
          // If setting as default, unset others
          if (field === 'isDefault' && value) {
            return updated;
          }
          return updated;
        } else if (field === 'isDefault' && value) {
          // Unset default from other methods
          return { ...pm, isDefault: false };
        }
        return pm;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleAddEmployee = async (employeeData: Partial<Employee>) => {
    try {
      const newEmployee = {
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        email: employeeData.email || '',
        role: employeeData.role || 'buyer',
        isActive: true,
        quickSwitchOrder: employees.length + 1
      };

      const { employee } = await apiCall(`/stores/${currentStore!.id}/employees`, {
        method: 'POST',
        body: JSON.stringify(newEmployee)
      });

      setEmployees(prev => [...prev, employee]);
      setShowAddEmployee(false);
      setHasUnsavedChanges(true);
      toast.success('Employee added successfully');
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleUpdateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    try {
      await apiCall(`/stores/${currentStore!.id}/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      setEmployees(prev => 
        prev.map(emp => emp.id === employeeId ? { ...emp, ...updates } : emp)
      );
      setEditingEmployee(null);
      setHasUnsavedChanges(true);
      toast.success('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const handleSaveSettings = async () => {
    if (!currentStore) return;

    try {
      setIsLoading(true);
      setError('');

      // Save general settings
      const updatedStore = await apiCall(`/stores/${currentStore.id}`, {
        method: 'PATCH',
        body: JSON.stringify(generalSettings)
      });

      // Save other settings - would be separate API calls in production
      // For now, just showing the structure

      onStoreUpdate(updatedStore.store);
      setHasUnsavedChanges(false);
      toast.success('Settings saved successfully');
      
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (currentStore) {
      loadStoreSettings();
      setHasUnsavedChanges(false);
      toast.success('Settings reset to saved values');
    }
  };

  if (!currentStore) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a store to configure settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your store preferences, pricing rules, and system settings.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payouts</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Employees</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center space-x-2">
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Labels</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={generalSettings.logo} alt="Store logo" />
                    <AvatarFallback className="text-lg">
                      {generalSettings.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    <span className="text-xs">Upload</span>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Upload a square logo for your store</p>
                  <p>Recommended: 200x200px, PNG or JPG</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Store Name *</Label>
                  <Input
                    value={generalSettings.name}
                    onChange={(e) => handleGeneralSettingChange('name', e.target.value)}
                    placeholder="Enter store name"
                  />
                </div>
                
                <div>
                  <Label>Store Type</Label>
                  <Select 
                    value={generalSettings.type} 
                    onValueChange={(value) => handleGeneralSettingChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="pawn">Pawn</SelectItem>
                      <SelectItem value="estate">Estate</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={generalSettings.address}
                  onChange={(e) => handleGeneralSettingChange('address', e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={generalSettings.phone}
                    onChange={(e) => handleGeneralSettingChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) => handleGeneralSettingChange('email', e.target.value)}
                    placeholder="store@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Time Zone</Label>
                  <Select 
                    value={generalSettings.timezone} 
                    onValueChange={(value) => handleGeneralSettingChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Default Currency</Label>
                  <Select 
                    value={generalSettings.currency} 
                    onValueChange={(value) => handleGeneralSettingChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Default Weight Unit</Label>
                <RadioGroup 
                  value={generalSettings.weightUnit} 
                  onValueChange={(value) => handleGeneralSettingChange('weightUnit', value)}
                  className="flex space-x-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="g" id="grams" />
                    <Label htmlFor="grams">Grams (g)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dwt" id="dwt" />
                    <Label htmlFor="dwt">Pennyweight (dwt)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oz" id="oz" />
                    <Label htmlFor="oz">Ounces (oz)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Quote Footer Message</Label>
                <Textarea
                  value={generalSettings.quoteFooter}
                  onChange={(e) => handleGeneralSettingChange('quoteFooter', e.target.value)}
                  placeholder="Footer message for printed quotes"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Legal Hold Period (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={generalSettings.legalHoldPeriod}
                    onChange={(e) => handleGeneralSettingChange('legalHoldPeriod', parseInt(e.target.value) || 30)}
                  />
                </div>
                
                <div>
                  <Label>Reminder Default (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={generalSettings.reminderDefault}
                    onChange={(e) => handleGeneralSettingChange('reminderDefault', parseInt(e.target.value) || 7)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Rules Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Default Payout Percentages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set default payout percentages for each category. These can be overridden per transaction.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingRules.map((rule) => (
                  <div key={rule.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="font-medium capitalize">{rule.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.payoutPercent}
                        onChange={(e) => handlePricingRuleChange(rule.category, parseFloat(e.target.value) || 0)}
                        className="w-20 text-center"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Round payout to nearest $5</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically round final payout amounts
                    </p>
                  </div>
                  <Switch
                    checked={roundToNearest}
                    onCheckedChange={setRoundToNearest}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subcategory Overrides</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set specific payout percentages for subcategories (e.g., different gold karats)
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No subcategory overrides configured</p>
                <Button variant="outline" className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Override
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Methods Tab */}
        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure which payment methods are available and their requirements
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={method.enabled}
                        onCheckedChange={(checked) => handlePayoutMethodToggle(method.method, 'enabled', checked)}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{method.method}</span>
                          {method.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                        {method.requiresCheckNumber && (
                          <p className="text-xs text-muted-foreground">Requires check number</p>
                        )}
                        {method.requiresPhoto && (
                          <p className="text-xs text-muted-foreground">Photo documentation recommended</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">Default</Label>
                      <Switch
                        checked={method.isDefault}
                        onCheckedChange={(checked) => handlePayoutMethodToggle(method.method, 'isDefault', checked)}
                        disabled={!method.enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Management</CardTitle>
                <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>
                        Create a new employee account for your store.
                      </DialogDescription>
                    </DialogHeader>
                    <AddEmployeeForm onSubmit={handleAddEmployee} onCancel={() => setShowAddEmployee(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>No employees added yet</p>
                  <p className="text-sm">Add your first employee to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quick Switch Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees
                      .sort((a, b) => a.quickSwitchOrder - b.quickSwitchOrder)
                      .map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={employee.avatar} alt={employee.name} />
                                <AvatarFallback>
                                  {employee.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.isActive ? "default" : "secondary"}>
                              {employee.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee.quickSwitchOrder}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingEmployee(employee)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Templates Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Visibility Controls</CardTitle>
              <p className="text-sm text-muted-foreground">
                Control what information employees can see during take-in and inventory operations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Payout % to Employees</Label>
                  <p className="text-sm text-muted-foreground">
                    If disabled, payout percentages will be hidden from non-admin employees
                  </p>
                </div>
                <Switch
                  checked={employeeVisibility.showPayoutPercent}
                  onCheckedChange={(checked) => {
                    setEmployeeVisibility(prev => ({ ...prev, showPayoutPercent: checked }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Profit $ to Employees</Label>
                  <p className="text-sm text-muted-foreground">
                    If enabled, employees will see store profit calculations
                  </p>
                </div>
                <Switch
                  checked={employeeVisibility.showProfit}
                  onCheckedChange={(checked) => {
                    setEmployeeVisibility(prev => ({ ...prev, showProfit: checked }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Impact</h4>
                <p className="text-sm text-muted-foreground">
                  These settings will affect the Take-In, Inventory, and Quote views for employees with non-admin roles. 
                  Admins and managers will always see all information regardless of these settings.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permission Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create role presets with specific module access permissions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissionTemplates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {template.permissions.map((perm) => (
                        <div key={perm.module} className="text-sm">
                          <span className="font-medium capitalize">{perm.module}:</span>
                          <div className="text-muted-foreground">
                            {perm.canView && "View"} {perm.canEdit && "Edit"} {perm.canDelete && "Delete"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories & Modules Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enabled Categories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enable or disable item categories for your store
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(enabledCategories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium capitalize">{category}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category === 'jewelry' && 'Rings, necklaces, bracelets, earrings'}
                        {category === 'watches' && 'Luxury watches, sport watches, smart watches'}
                        {category === 'bullion' && 'Gold bars, silver bars, coins'}
                        {category === 'silverware' && 'Flatware, serving pieces, tea sets'}
                        {category === 'stones' && 'Loose diamonds and gemstones'}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        setEnabledCategories(prev => ({ ...prev, [category]: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future Modules</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enable upcoming features (disabled by default)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(futureModules).map(([module, enabled]) => (
                  <div key={module} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium capitalize">{module}</h3>
                      <p className="text-sm text-muted-foreground">
                        {module === 'marketplace' && 'Online marketplace integration'}
                        {module === 'auctions' && 'Auction management system'}
                        {module === 'layaway' && 'Layaway payment plans'}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        setFutureModules(prev => ({ ...prev, [module]: checked }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of transactions and activity
                  </p>
                </div>
                <Switch
                  checked={notifications.dailySummaryEmail}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => ({ ...prev, dailySummaryEmail: checked }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>API Failure Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when pricing APIs are unavailable
                  </p>
                </div>
                <Switch
                  checked={notifications.apiFailureAlerts}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => ({ ...prev, apiFailureAlerts: checked }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Price Drop Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when metal prices drop significantly
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={notifications.priceDropPercent}
                    onChange={(e) => {
                      setNotifications(prev => ({ ...prev, priceDropPercent: parseFloat(e.target.value) || 5 }));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-16"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Switch
                    checked={notifications.lowPriceAlerts}
                    onCheckedChange={(checked) => {
                      setNotifications(prev => ({ ...prev, lowPriceAlerts: checked }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>SMS Number (Optional)</Label>
                <Input
                  type="tel"
                  value={notifications.smsNumber}
                  onChange={(e) => {
                    setNotifications(prev => ({ ...prev, smsNumber: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="(555) 123-4567"
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Receive critical alerts via SMS
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Label & QR Preferences Tab */}
        <TabsContent value="labels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Label Printing Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-print batch label after purchase</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically print labels when completing a purchase
                  </p>
                </div>
                <Switch
                  checked={labelPreferences.autoPrintAfterPurchase}
                  onCheckedChange={(checked) => {
                    setLabelPreferences(prev => ({ ...prev, autoPrintAfterPurchase: checked }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Include payout amount on label</Label>
                  <p className="text-sm text-muted-foreground">
                    Show the payout amount on printed labels
                  </p>
                </div>
                <Switch
                  checked={labelPreferences.includePayoutOnLabel}
                  onCheckedChange={(checked) => {
                    setLabelPreferences(prev => ({ ...prev, includePayoutOnLabel: checked }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div>
                <Label>Smart Badge ID Prefix Override</Label>
                <Input
                  value={labelPreferences.smartBadgePrefix}
                  onChange={(e) => {
                    setLabelPreferences(prev => ({ ...prev, smartBadgePrefix: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Leave empty for auto-generated prefix"
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Custom prefix for batch IDs (e.g., "NYC", "MAIN")
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg py-3 px-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Unsaved changes</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={!hasUnsavedChanges || isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges || isLoading}
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddEmployeeFormProps {
  onSubmit: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

function AddEmployeeForm({ onSubmit, onCancel }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'buyer'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name *</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      
      <div>
        <Label>Role</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="trainee">Trainee</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Employee
        </Button>
      </div>
    </form>
  );
}