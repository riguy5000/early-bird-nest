import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building, Users, ShoppingCart, DollarSign, TrendingUp, Activity,
  BarChart3, Package, Calendar, RefreshCw
} from 'lucide-react';

async function rootAdminApi(action: string, data: any = {}) {
  const { data: result, error } = await supabase.functions.invoke('root-admin', {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message || 'API error');
  if (result?.error) throw new Error(result.error);
  return result;
}

export function RootAdminAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await rootAdminApi('get-analytics', { dateRange });
      setAnalytics(result);
    } catch (e: any) {
      toast.error('Failed to load analytics: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadAnalytics(); }, [dateRange]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const kpis = analytics?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground">Platform-wide performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard icon={Building} label="Registered Stores" value={kpis.registeredStores ?? 0} />
        <KPICard icon={Users} label="Total Users" value={kpis.totalUsers ?? 0} />
        <KPICard icon={Users} label="Total Customers" value={kpis.totalCustomers ?? 0} />
        <KPICard icon={Activity} label="Active Stores (24h)" value={kpis.activeStores24h ?? 0} />
        <KPICard icon={DollarSign} label="MRR / Billing" value="$0" subtitle="Not yet tracked" />
      </div>

      {/* Onboarding Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Store Onboarding Trend</CardTitle>
          <CardDescription>Monthly new store registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChartSimple data={analytics?.onboardingTrend || {}} />
        </CardContent>
      </Card>

      {/* Store Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Stores by Employees</CardTitle>
            <CardDescription>Stores with the most team members</CardDescription>
          </CardHeader>
          <CardContent>
            {(analytics?.topStoresByEmployees || []).length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No data available.</p>
            ) : (
              <div className="space-y-3">
                {analytics.topStoresByEmployees.map((s: any, i: number) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{s.employeeCount} employees</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Stores by Customers</CardTitle>
            <CardDescription>Stores with the most customers</CardDescription>
          </CardHeader>
          <CardContent>
            {(analytics?.topStoresByCustomers || []).length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No data available.</p>
            ) : (
              <div className="space-y-3">
                {analytics.topStoresByCustomers.map((s: any, i: number) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{s.customerCount} customers</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users by Role Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
          <CardDescription>Users by type and role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.userBreakdown?.platformAdmins ?? 0}</p>
              <p className="text-xs text-muted-foreground">Platform Admins</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.userBreakdown?.storeAdmins ?? 0}</p>
              <p className="text-xs text-muted-foreground">Store Admins</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.userBreakdown?.employees ?? 0}</p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{analytics?.userBreakdown?.pendingInvites ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending Invites</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stores by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-800">{analytics?.storesByStatus?.active ?? 0}</p>
              <p className="text-xs text-green-600">Active</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-800">{analytics?.storesByStatus?.suspended ?? 0}</p>
              <p className="text-xs text-yellow-600">Suspended</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-800">{analytics?.storesByStatus?.banned ?? 0}</p>
              <p className="text-xs text-red-600">Banned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle }: { icon: any; label: string; value: any; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartSimple({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  if (entries.length === 0) return <p className="text-muted-foreground text-sm py-4">No data yet.</p>;
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
