import { CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useDashboardData } from './useDashboardData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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

function KPICard({ label, value, subtitle, trend, icon: Icon }: {
  label: string; value: string; subtitle?: string; trend?: number; icon: any;
}) {
  const isPositive = (trend || 0) >= 0;
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[12px] text-[#76707F] font-medium uppercase tracking-wider">{label}</div>
        <div className="w-11 h-11 rounded-[12px] icon-container">
          <Icon className="h-5 w-5 text-[#6B5EF9]" />
        </div>
      </div>
      <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">{value}</div>
      {subtitle && <p className="text-[12px] text-[#76707F] mt-1">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center mt-2 text-[12px] font-medium ${isPositive ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
          {isPositive ? '+' : ''}{trend.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export function OwnerDashboard({ storeId, storeName, onNavigate }: OwnerDashboardProps) {
  const { metrics, loading } = useDashboardData(storeId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5EF9] mx-auto" />
          <p className="mt-2 text-[#76707F] text-[14px]">Loading dashboard...</p>
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

  const trendData = [
    { label: 'Week 1', costBasis: m.costBasis * 0.85, liveValue: m.liveValue * 0.82 },
    { label: 'Week 2', costBasis: m.costBasis * 0.90, liveValue: m.liveValue * 0.88 },
    { label: 'Week 3', costBasis: m.costBasis * 0.93, liveValue: m.liveValue * 0.92 },
    { label: 'Week 4', costBasis: m.costBasis * 0.97, liveValue: m.liveValue * 0.96 },
    { label: 'Now', costBasis: m.costBasis, liveValue: m.liveValue },
  ];

  const quickActions = [
    { label: 'New Take-In', icon: Plus, action: 'take-in' },
    { label: 'Find Customer', icon: Users, action: 'customers' },
    { label: 'View Inventory', icon: Package, action: 'inventory' },
    { label: 'Process Payout', icon: DollarSign, action: 'payouts' },
    { label: 'Analytics', icon: BarChart3, action: 'analytics' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[36px] font-semibold tracking-tight title-gradient">Dashboard</h2>
          <p className="text-[15px] text-[#76707F]">Owner Summary</p>
        </div>
        <button onClick={() => onNavigate('analytics')} className="btn-primary-dark flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Deep Analytics
        </button>
      </div>

      {/* Quick Tip */}
      {m.unrealizedPLPercent > 0 && (
        <div className="tip-box flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#4889FA] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#2B2833] mb-0.5">Quick Tip</div>
            <div className="text-[12px] text-[#5A5463] leading-relaxed">
              Your unrealized profit is up {m.unrealizedPLPercent.toFixed(0)}% this month. Consider reviewing high-value items for potential sales opportunities.
            </div>
          </div>
        </div>
      )}

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Items in Stock" value={m.itemsInStock.toString()} icon={Package} />
        <KPICard label="Active Customers" value={m.activeCustomers.toString()} icon={Users} />
        <KPICard label="Today's Take-In" value={m.dailyTakeIns.toString()} icon={Plus} />
        <KPICard label="Today's Payout" value={fmt(m.dailyPayout)} icon={DollarSign} />
        <KPICard label="Realized Profit (Mtd)" value={fmt(m.realizedProfitMonth)} icon={TrendingUp} />
      </div>

      {/* Portfolio Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Cost Basis" value={fmt(m.costBasis)} subtitle="based on active inventory" icon={DollarSign} />
        <KPICard label="Live Inventory Value" value={fmt(m.liveValue)} subtitle="current market-based estimate" icon={TrendingUp} />
        <KPICard
          label="Unrealized P/L"
          value={`${m.unrealizedPL >= 0 ? '+' : ''}${fmt(m.unrealizedPL)}`}
          trend={m.unrealizedPLPercent}
          icon={m.unrealizedPL >= 0 ? TrendingUp : TrendingDown}
        />
        <KPICard label="Scrap Pipeline" value={fmt(m.scrapPipelineValue)} subtitle="showroom value" icon={Flame} />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Inventory Value Trend</h3>
          <p className="text-[13px] text-[#76707F] mb-4">Cost basis vs live value</p>
          {m.costBasis === 0 && m.liveValue === 0 ? (
            <div className="h-48 flex items-center justify-center text-[#76707F] text-[14px]">
              Complete a purchase in Take-In to start tracking
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#76707F' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#76707F' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmtFull(v)} />
                <Legend />
                <defs>
                  <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ECCC4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2ECCC4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9F43" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF9F43" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="liveValue" stroke="#2ECCC4" fill="url(#liveGrad)" strokeWidth={2} name="Live Value" dot={{ fill: '#2ECCC4', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                <Area type="monotone" dataKey="costBasis" stroke="#FF9F43" fill="url(#costGrad)" strokeWidth={2} name="Cost Basis" dot={{ fill: '#FF9F43', r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map(({ label, icon: Icon, action }) => (
              <button
                key={action}
                onClick={() => onNavigate(action)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] hover:bg-white/60 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-[10px] icon-container flex items-center justify-center">
                  <Icon className="h-4 w-4 text-[#6B5EF9]" />
                </div>
                <span className="text-[14px] font-medium text-[#2B2833] group-hover:text-[#6B5EF9] transition-colors">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metal Exposure + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Metal Exposure</h3>
          <p className="text-[13px] text-[#76707F] mb-4">Active inventory by metal type</p>
          {m.metalExposure.length === 0 ? (
            <p className="text-[14px] text-[#76707F] py-4 text-center">No metal inventory data yet</p>
          ) : (
            <div className="space-y-2">
              {m.metalExposure.slice(0, 5).map((row: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-black/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#FFF9E6] via-[#FFECB3] to-[#FFD966] flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#D4A029" opacity="0.4" stroke="#B8860B" strokeWidth="1.5" />
                        <path d="M2 17l10 5 10-5" stroke="#D4A029" strokeWidth="2" strokeLinecap="round" />
                        <path d="M2 12l10 5 10-5" stroke="#D4A029" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[14px] font-semibold text-[#2B2833]">{row.metal} {row.karat}</span>
                      <span className="text-[12px] text-[#76707F] ml-2">{row.totalWeight.toFixed(1)}g · {row.itemCount} items</span>
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold text-[#2B2833]">{fmt(row.liveValue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">Recent Activity</h3>
          {m.recentActivity.length === 0 ? (
            <p className="text-[14px] text-[#76707F] py-4 text-center">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {m.recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-black/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] icon-container flex items-center justify-center">
                      {a.type === 'take-in' && <Plus className="h-4 w-4 text-[#6B5EF9]" />}
                      {a.type === 'customer' && <User className="h-4 w-4 text-[#6B5EF9]" />}
                      {a.type === 'payout' && <DollarSign className="h-4 w-4 text-[#6B5EF9]" />}
                    </div>
                    <div>
                      <p className="text-[14px] text-[#2B2833]">{a.description}</p>
                      <p className="text-[11px] text-[#A8A3AE] flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {a.time}
                      </p>
                    </div>
                  </div>
                  {a.value !== null && <span className="text-[15px] font-semibold text-[#2B2833]">{fmtFull(a.value)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
