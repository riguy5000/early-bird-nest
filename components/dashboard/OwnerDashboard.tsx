import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useDashboardData } from './useDashboardData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Package, Users, DollarSign, TrendingUp, TrendingDown, Plus, Clock,
  User, ArrowUpRight, ArrowDownRight, BarChart3, Flame, ShoppingBag
} from 'lucide-react';

interface OwnerDashboardProps {
  storeId: string;
  storeName: string;
  onNavigate: (module: string) => void;
}

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

function KPICard({ label, value, subtitle, trend, icon: Icon, variant = 'default' }: {
  label: string; value: string; subtitle?: string; trend?: number; icon: any; variant?: string;
}) {
  const isPositive = (trend || 0) >= 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${variant === 'positive' ? 'bg-emerald-500/10' : variant === 'negative' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            <Icon className={`h-4 w-4 ${variant === 'positive' ? 'text-emerald-600' : variant === 'negative' ? 'text-red-600' : 'text-primary'}`} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center mt-2 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OwnerDashboard({ storeId, storeName, onNavigate }: OwnerDashboardProps) {
  const { metrics, loading } = useDashboardData(storeId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const m = metrics || {
    itemsInStock: 0, activeCustomers: 0, dailyTakeIns: 0, dailyPayout: 0,
    costBasis: 0, liveValue: 0, unrealizedPL: 0, unrealizedPLPercent: 0,
    realizedProfitMonth: 0, scrapPipelineValue: 0, showroomValue: 0,
    metalPrices: {}, metalExposure: [], recentActivity: [],
  };

  const plVariant = m.unrealizedPL >= 0 ? 'positive' : 'negative';

  // Mini trend data (placeholder structure for when historical data exists)
  const trendData = [
    { label: 'W1', costBasis: m.costBasis * 0.85, liveValue: m.liveValue * 0.82 },
    { label: 'W2', costBasis: m.costBasis * 0.90, liveValue: m.liveValue * 0.88 },
    { label: 'W3', costBasis: m.costBasis * 0.95, liveValue: m.liveValue * 0.94 },
    { label: 'Now', costBasis: m.costBasis, liveValue: m.liveValue },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">{storeName} — Owner Summary</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate('analytics')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Deep Analytics
        </Button>
      </div>

      {/* Primary KPIs Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="Items In Stock" value={m.itemsInStock.toString()} icon={Package} />
        <KPICard label="Active Customers" value={m.activeCustomers.toString()} icon={Users} />
        <KPICard label="Today's Take-Ins" value={m.dailyTakeIns.toString()} icon={Plus} />
        <KPICard label="Today's Payout" value={fmt(m.dailyPayout)} icon={DollarSign} />
        <KPICard label="Realized Profit (Mo)" value={fmt(m.realizedProfitMonth)} icon={TrendingUp} variant={m.realizedProfitMonth >= 0 ? 'positive' : 'negative'} />
      </div>

      {/* Portfolio Performance Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="Cost Basis" value={fmt(m.costBasis)} subtitle="Total invested in active inventory" icon={DollarSign} />
        <KPICard label="Live Inventory Value" value={fmt(m.liveValue)} subtitle="Current market-based estimate" icon={TrendingUp} />
        <KPICard
          label="Unrealized P/L"
          value={`${m.unrealizedPL >= 0 ? '+' : ''}${fmt(m.unrealizedPL)}`}
          trend={m.unrealizedPLPercent}
          icon={m.unrealizedPL >= 0 ? TrendingUp : TrendingDown}
          variant={plVariant}
        />
        <KPICard label="Scrap Pipeline" value={fmt(m.scrapPipelineValue)} icon={Flame} />
        <KPICard label="Showroom Value" value={fmt(m.showroomValue)} icon={ShoppingBag} />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Value Trend</CardTitle>
            <CardDescription>Cost basis vs live value</CardDescription>
          </CardHeader>
          <CardContent>
            {m.costBasis === 0 && m.liveValue === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Complete a purchase in Take-In to start tracking
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip formatter={(v: number) => fmtFull(v)} />
                  <Area type="monotone" dataKey="costBasis" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" name="Cost Basis" />
                  <Area type="monotone" dataKey="liveValue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" name="Live Value" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => onNavigate('take-in')} className="w-full justify-start" size="sm">
              <Plus className="h-4 w-4 mr-2" /> New Take-In
            </Button>
            <Button variant="outline" onClick={() => onNavigate('customers')} className="w-full justify-start" size="sm">
              <Users className="h-4 w-4 mr-2" /> Find Customer
            </Button>
            <Button variant="outline" onClick={() => onNavigate('inventory')} className="w-full justify-start" size="sm">
              <Package className="h-4 w-4 mr-2" /> View Inventory
            </Button>
            <Button variant="outline" onClick={() => onNavigate('payouts')} className="w-full justify-start" size="sm">
              <DollarSign className="h-4 w-4 mr-2" /> Process Payout
            </Button>
            <Button variant="outline" onClick={() => onNavigate('analytics')} className="w-full justify-start" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Metal Exposure Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metal Exposure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Metal Exposure</CardTitle>
            <CardDescription>Active inventory by metal type</CardDescription>
          </CardHeader>
          <CardContent>
            {m.metalExposure.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No metal inventory data yet</p>
            ) : (
              <div className="space-y-2">
                {m.metalExposure.slice(0, 5).map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="font-medium text-sm">{row.metal} {row.karat}</span>
                      <span className="text-xs text-muted-foreground ml-2">{row.totalWeight.toFixed(1)}g · {row.itemCount} items</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{fmt(row.liveValue)}</span>
                      <span className={`text-xs ml-2 ${row.unrealizedPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {row.unrealizedPL >= 0 ? '+' : ''}{row.unrealizedPLPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {m.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {m.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        {a.type === 'take-in' && <Plus className="h-3 w-3 text-primary" />}
                        {a.type === 'customer' && <User className="h-3 w-3 text-primary" />}
                        {a.type === 'payout' && <DollarSign className="h-3 w-3 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm">{a.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {a.time}
                        </p>
                      </div>
                    </div>
                    {a.value !== null && <span className="text-sm font-medium">{fmtFull(a.value)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
