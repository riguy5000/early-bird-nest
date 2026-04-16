import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { JewelryPawnApp } from './JewelryPawnApp';
import { RootAdminUsers } from './admin/RootAdminUsers';
import { RootAdminSystem } from './admin/RootAdminSystem';
import { RootAdminAnalytics } from './admin/RootAdminAnalytics';
import { RootAdminPlatformSettings } from './admin/RootAdminPlatformSettings';
import { RootAdminAddStore } from './admin/RootAdminAddStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Crown, LogOut, Settings, Shield, Users, Building, BarChart3, Activity, Server,
  AlertTriangle, TrendingUp, Calendar, Search, MoreHorizontal, Bell, Store,
  ChevronLeft, ChevronRight, Eye, Ban, PlayCircle, PauseCircle, Download,
  UserCheck, X, ArrowUpDown, Plus
} from 'lucide-react';

interface RootAdminConsoleProps {
  user: any;
  onLogout: () => void;
}

// Helper to call the root-admin edge function
async function rootAdminApi(action: string, data: any = {}) {
  const { data: result, error } = await supabase.functions.invoke('root-admin', {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message || 'API error');
  if (result?.error) throw new Error(result.error);
  return result;
}

// Build store user data for impersonation (mirrors src/App.tsx)
function buildImpersonationUser(data: any) {
  const { store, profile, permissions, visibility } = data;
  if (!profile) return null;
  return {
    id: profile.id,
    authUserId: profile.auth_user_id,
    email: profile.email,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role,
    storeId: profile.store_id,
    store: store ? {
      id: store.id, name: store.name, type: store.type,
      address: store.address, phone: store.phone, email: store.email, timezone: store.timezone,
    } : null,
    permissions: permissions ? {
      accessTakeIn: permissions.can_access_take_in, accessInventory: permissions.can_access_inventory,
      accessCustomers: permissions.can_access_customers, accessPayouts: permissions.can_access_payouts,
      accessStatistics: permissions.can_access_statistics, accessSettings: permissions.can_access_settings,
      accessSavedForLater: permissions.can_access_saved_for_later, canEditRates: permissions.can_edit_rates,
      canEditFinalPayout: permissions.can_edit_final_payout_amount, canPrintLabels: permissions.can_print_labels,
      canPrintReceipts: permissions.can_print_receipts, canDeleteItems: permissions.can_delete_items,
      canCompletePurchase: permissions.can_complete_purchase, canReopenTransactions: permissions.can_reopen_transactions,
    } : null,
    visibility: visibility ? {
      hideProfit: visibility.hide_profit, hidePercentagePaid: visibility.hide_percentage_paid,
      hideMarketValue: visibility.hide_market_value, hideTotalPayoutBreakdown: visibility.hide_total_payout_breakdown,
      hideAverageRate: visibility.hide_average_rate,
    } : null,
    isActive: profile.is_active,
  };
}

export function RootAdminConsole({ user, onLogout }: RootAdminConsoleProps) {
  const [activeSection, setActiveSection] = useState('overview');
  
  // Overview
  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Stores
  const [stores, setStores] = useState<any[]>([]);
  const [storesTotal, setStoresTotal] = useState(0);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesPage, setStoresPage] = useState(1);
  const [storesSearch, setStoresSearch] = useState('');
  const [storesStatusFilter, setStoresStatusFilter] = useState('all');
  const [storesSortBy, setStoresSortBy] = useState('created_at');
  const [storesSortDir, setStoresSortDir] = useState<'asc' | 'desc'>('desc');
  const pageSize = 15;

  // Store Details
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Status change confirmation
  const [statusAction, setStatusAction] = useState<{ storeId: string; storeName: string; newStatus: string } | null>(null);

  const [impersonating, setImpersonating] = useState<any>(null);
  const [addStoreOpen, setAddStoreOpen] = useState(false);

  const sections = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'stores', name: 'Stores', icon: Building },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'system', name: 'System', icon: Server },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  // ── Load Overview ──
  useEffect(() => {
    if (activeSection === 'overview') {
      setOverviewLoading(true);
      rootAdminApi('get-overview')
        .then(setOverview)
        .catch((e) => toast.error('Failed to load overview: ' + e.message))
        .finally(() => setOverviewLoading(false));
    }
  }, [activeSection]);

  // ── Load Stores ──
  const loadStores = useCallback(() => {
    setStoresLoading(true);
    rootAdminApi('list-stores', {
      search: storesSearch || undefined,
      status: storesStatusFilter,
      sortBy: storesSortBy,
      sortDir: storesSortDir,
      page: storesPage,
      pageSize,
    })
      .then((res) => {
        setStores(res.stores || []);
        setStoresTotal(res.total || 0);
      })
      .catch((e) => toast.error('Failed to load stores: ' + e.message))
      .finally(() => setStoresLoading(false));
  }, [storesSearch, storesStatusFilter, storesSortBy, storesSortDir, storesPage]);

  useEffect(() => {
    if (activeSection === 'stores') loadStores();
  }, [activeSection, loadStores]);

  // ── Load Store Details ──
  const openStoreDetails = async (storeId: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const details = await rootAdminApi('get-store-details', { storeId });
      setStoreDetails(details);
    } catch (e: any) {
      toast.error('Failed to load store details: ' + e.message);
    }
    setDetailsLoading(false);
  };

  // ── Status Change ──
  const confirmStatusChange = async () => {
    if (!statusAction) return;
    try {
      await rootAdminApi('update-store-status', { storeId: statusAction.storeId, status: statusAction.newStatus });
      toast.success(`Store "${statusAction.storeName}" status changed to ${statusAction.newStatus}`);
      setStatusAction(null);
      loadStores();
      if (storeDetails?.store?.id === statusAction.storeId) {
        openStoreDetails(statusAction.storeId);
      }
    } catch (e: any) {
      toast.error('Failed to update status: ' + e.message);
    }
  };

  // ── Impersonate ──
  const handleImpersonate = async (storeId: string) => {
    try {
      const data = await rootAdminApi('impersonate-store', { storeId });
      const impUser = buildImpersonationUser(data);
      if (!impUser) {
        toast.error('Could not build impersonation context — no store admin found');
        return;
      }
      setImpersonating({ user: impUser, impersonatedBy: data.impersonatedBy });
      toast.success(`Impersonating store: ${data.store.name}`);
    } catch (e: any) {
      toast.error('Impersonation failed: ' + e.message);
    }
  };

  const exitImpersonation = () => {
    setImpersonating(null);
    toast.info('Returned to Root Admin Console');
  };

  // ── Sort toggle ──
  const toggleSort = (col: string) => {
    if (storesSortBy === col) {
      setStoresSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setStoresSortBy(col);
      setStoresSortDir('asc');
    }
    setStoresPage(1);
  };

  // If impersonating, render store app with banner
  if (impersonating) {
    return (
      <div className="min-h-screen">
        <div className="bg-yellow-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Impersonating: <strong>{impersonating.user.store?.name}</strong> as {impersonating.user.name}</span>
            <span className="text-yellow-800">— by {impersonating.impersonatedBy.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={exitImpersonation} className="bg-white/80 hover:bg-white">
            <X className="h-3 w-3 mr-1" /> Exit Impersonation
          </Button>
        </div>
        <JewelryPawnApp user={impersonating.user} onLogout={exitImpersonation} />
      </div>
    );
  }

  const totalPages = Math.ceil(storesTotal / pageSize);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      banned: 'bg-red-100 text-red-800',
    };
    return <Badge className={map[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen">
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
            <nav className="hidden lg:flex items-center space-x-1">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <Button key={s.id} variant={activeSection === s.id ? 'default' : 'ghost'}
                    onClick={() => setActiveSection(s.id)} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" /><span>{s.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-yellow-100 text-yellow-800">{user?.name?.charAt(0) || 'R'}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{user?.name || 'Root Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="font-medium">{user?.name || 'Root Administrator'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                    <Badge className="w-fit text-xs bg-yellow-100 text-yellow-800">Root Admin</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* ═══════ OVERVIEW ═══════ */}
        {activeSection === 'overview' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Platform Overview</h2>
                <p className="text-muted-foreground">Real-time system-wide metrics</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /><span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {overviewLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : overview ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Building} label="Registered Stores" value={overview.totalStores} />
                  <StatCard icon={Users} label="Total Employees" value={overview.totalEmployees} />
                  <StatCard icon={Activity} label="Active Stores" value={overview.activeStores} />
                  <StatCard icon={TrendingUp} label="MRR" value="$0" subtitle="Not yet tracked" />
                </div>

                {/* Onboarding Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Store Onboarding Trend</CardTitle>
                    <CardDescription>Monthly new store registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OnboardingChart data={overview.monthlyOnboarding || {}} />
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Stores</CardTitle>
                      <CardDescription>Newly registered stores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(overview.recentStores || []).length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4">No stores registered yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {overview.recentStores.slice(0, 5).map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Store className="h-8 w-8 text-primary" />
                                <div>
                                  <p className="font-medium">{s.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.owner?.email || 'No owner'} · {s.employeeCount} employees
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {statusBadge(s.status)}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(s.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Employees</CardTitle>
                      <CardDescription>Latest employee additions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(overview.recentEmployees || []).length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4">No employees added yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {overview.recentEmployees.map((e: any) => (
                            <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <UserCheck className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{e.first_name} {e.last_name}</p>
                                  <p className="text-xs text-muted-foreground">{e.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">{e.role}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">{e.storeName}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Failed to load overview data.</p>
            )}
          </div>
        )}

        {/* ═══════ STORES ═══════ */}
        {activeSection === 'stores' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">All Stores</h2>
                <p className="text-muted-foreground">{storesTotal} registered store{storesTotal !== 1 ? 's' : ''}</p>
              </div>
              <Button onClick={() => setAddStoreOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Store
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stores..."
                  value={storesSearch}
                  onChange={(e) => { setStoresSearch(e.target.value); setStoresPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={storesStatusFilter} onValueChange={(v) => { setStoresStatusFilter(v); setStoresPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <SortableHeader label="Store Name" col="name" current={storesSortBy} dir={storesSortDir} onSort={toggleSort} />
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                        <SortableHeader label="Status" col="status" current={storesSortBy} dir={storesSortDir} onSort={toggleSort} />
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employees</th>
                        <SortableHeader label="Registered" col="created_at" current={storesSortBy} dir={storesSortDir} onSort={toggleSort} />
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storesLoading ? (
                        <tr><td colSpan={7} className="text-center py-12">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                        </td></tr>
                      ) : stores.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No stores found.</td></tr>
                      ) : stores.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.type}</td>
                          <td className="px-4 py-3">{statusBadge(s.status)}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm">{s.owner?.name || '—'}</p>
                              <p className="text-xs text-muted-foreground">{s.owner?.email || ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{s.employeeCount}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openStoreDetails(s.id)}>
                                  <Eye className="h-4 w-4 mr-2" />View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleImpersonate(s.id)}>
                                  <UserCheck className="h-4 w-4 mr-2" />Impersonate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {s.status === 'active' && (
                                  <DropdownMenuItem onClick={() => setStatusAction({ storeId: s.id, storeName: s.name, newStatus: 'suspended' })}>
                                    <PauseCircle className="h-4 w-4 mr-2" />Suspend
                                  </DropdownMenuItem>
                                )}
                                {s.status === 'suspended' && (
                                  <DropdownMenuItem onClick={() => setStatusAction({ storeId: s.id, storeName: s.name, newStatus: 'active' })}>
                                    <PlayCircle className="h-4 w-4 mr-2" />Reactivate
                                  </DropdownMenuItem>
                                )}
                                {s.status !== 'banned' && (
                                  <DropdownMenuItem onClick={() => setStatusAction({ storeId: s.id, storeName: s.name, newStatus: 'banned' })}
                                    className="text-destructive focus:text-destructive">
                                    <Ban className="h-4 w-4 mr-2" />Ban
                                  </DropdownMenuItem>
                                )}
                                {s.status === 'banned' && (
                                  <DropdownMenuItem onClick={() => setStatusAction({ storeId: s.id, storeName: s.name, newStatus: 'active' })}>
                                    <PlayCircle className="h-4 w-4 mr-2" />Unban
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {storesPage} of {totalPages} ({storesTotal} stores)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={storesPage <= 1} onClick={() => setStoresPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={storesPage >= totalPages} onClick={() => setStoresPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users */}
        {activeSection === 'users' && <RootAdminUsers />}

        {/* System */}
        {activeSection === 'system' && <RootAdminSystem />}

        {/* Analytics */}
        {activeSection === 'analytics' && <RootAdminAnalytics />}

        {/* Settings */}
        {activeSection === 'settings' && <RootAdminPlatformSettings />}
      </main>

      {/* Add Store Modal */}
      <RootAdminAddStore open={addStoreOpen} onOpenChange={setAddStoreOpen} onCreated={loadStores} />

      {/* Store Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Store Details</SheetTitle>
            <SheetDescription>Detailed information about this store</SheetDescription>
          </SheetHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : storeDetails ? (
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{storeDetails.store.name}</h3>
                <div className="flex items-center gap-2">
                  {statusBadge(storeDetails.store.status)}
                  <Badge variant="outline">{storeDetails.store.type}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <DetailItem label="Address" value={storeDetails.store.address || '—'} />
                <DetailItem label="Phone" value={storeDetails.store.phone || '—'} />
                <DetailItem label="Email" value={storeDetails.store.email || '—'} />
                <DetailItem label="Timezone" value={storeDetails.store.timezone} />
                <DetailItem label="Registered" value={new Date(storeDetails.store.created_at).toLocaleDateString()} />
                <DetailItem label="Employees" value={storeDetails.employeeCount} />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Employees by Role</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(storeDetails.roleCounts || {}).map(([role, count]) => (
                    <Badge key={role} variant="outline">{role}: {count as number}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Employee List</h4>
                <div className="space-y-2">
                  {(storeDetails.employees || []).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                        <p className="text-xs text-muted-foreground">{e.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{e.role}</Badge>
                        <Badge variant={e.is_active ? 'default' : 'secondary'} className="text-xs">
                          {e.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleImpersonate(storeDetails.store.id)}>
                  <Eye className="h-3 w-3 mr-1" />Impersonate
                </Button>
                {storeDetails.store.status === 'active' && (
                  <Button size="sm" variant="outline" onClick={() => setStatusAction({
                    storeId: storeDetails.store.id, storeName: storeDetails.store.name, newStatus: 'suspended',
                  })}>
                    <PauseCircle className="h-3 w-3 mr-1" />Suspend
                  </Button>
                )}
                {storeDetails.store.status === 'suspended' && (
                  <Button size="sm" variant="outline" onClick={() => setStatusAction({
                    storeId: storeDetails.store.id, storeName: storeDetails.store.name, newStatus: 'active',
                  })}>
                    <PlayCircle className="h-3 w-3 mr-1" />Reactivate
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-8">No details available.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Change Confirmation */}
      <Dialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change <strong>{statusAction?.storeName}</strong> to <strong>{statusAction?.newStatus}</strong>?
              {statusAction?.newStatus === 'banned' && (
                <span className="block mt-2 text-destructive">This will block the store from accessing the platform.</span>
              )}
              {statusAction?.newStatus === 'suspended' && (
                <span className="block mt-2">The store will be temporarily unable to access the platform.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusAction(null)}>Cancel</Button>
            <Button variant={statusAction?.newStatus === 'banned' ? 'destructive' : 'default'} onClick={confirmStatusChange}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ icon: Icon, label, value, subtitle }: { icon: any; label: string; value: any; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function SortableHeader({ label, col, current, dir, onSort }: { label: string; col: string; current: string; dir: string; onSort: (col: string) => void }) {
  return (
    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => onSort(col)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${current === col ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      </div>
    </th>
  );
}

function OnboardingChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  if (entries.length === 0) return <p className="text-muted-foreground text-sm py-4">No onboarding data yet.</p>;
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {entries.map(([month, count]) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium">{count}</span>
          <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(count / maxVal) * 100}%`, minHeight: 4 }} />
          <span className="text-[10px] text-muted-foreground">{month.substring(5)}</span>
        </div>
      ))}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
