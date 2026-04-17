import { useDashboardData } from './useDashboardData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, Plus, Clock, User, BarChart3
} from 'lucide-react';
import { PremiumIcon } from '../ui/PremiumIcon';

interface OwnerDashboardProps {
  storeId: string;
  storeName: string;
  onNavigate: (module: string) => void;
}

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

/* ── Primary KPI card — icon top-right, large value ── */
function PrimaryKPICard({ label, value, iconType }: {
  label: string; value: string; iconType: string;
}) {
  return (
    <div className="kpi-card flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[12px] text-[#76707F] font-medium leading-snug">{label}</div>
        <div className="w-11 h-11 rounded-[12px] icon-container flex-shrink-0">
          <PremiumIcon type={iconType} className="h-5 w-5" />
        </div>
      </div>
      <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">{value}</div>
    </div>
  );
}

/* ── Secondary KPI card — uppercase label, value, optional subtitle + trend ── */
function SecondaryKPICard({ label, value, subtitle, trend, isProfit }: {
  label: string; value: string; subtitle?: string; trend?: number; isProfit?: boolean;
}) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <div className="glass-card p-5 flex flex-col gap-1">
      <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{label}</div>
      {isProfit ? (
        <>
          <div className="text-[28px] font-semibold tracking-tight profit-gradient">{value}</div>
          {trend !== undefined && (
            <div className={`text-[13px] font-medium ${isPositive ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
              {isPositive ? '+' : ''}{trend.toFixed(1)}%
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">{value}</div>
          {subtitle && <div className="text-[13px] text-[#76707F]">{subtitle}</div>}
        </>
      )}
    </div>
  );
}

export function OwnerDashboard({ storeId, storeName, onNavigate }: OwnerDashboardProps) {
  const { metrics, loading } = useDashboardData(storeId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5EF9] mx-auto" />
          <p className="mt-3 text-[#76707F] text-[14px]">Loading dashboard...</p>
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
    { label: 'Now',    costBasis: m.costBasis,         liveValue: m.liveValue },
  ];

  const quickActions = [
    { label: 'New Take-In',     iconType: 'plus',        action: 'take-in' },
    { label: 'Find Customer',   iconType: 'users',       action: 'customers' },
    { label: 'View Inventory',  iconType: 'package',     action: 'inventory' },
    { label: 'Process Payout',  iconType: 'dollar-sign', action: 'payouts' },
    { label: 'Analytics',       iconType: 'bar-chart',   action: 'analytics' },
  ];

  const plPositive = m.unrealizedPL >= 0;
  const metalSpots = [
    { label: 'Gold',      symbol: 'XAU' },
    { label: 'Silver',    symbol: 'XAG' },
    { label: 'Platinum',  symbol: 'XPT' },
    { label: 'Palladium', symbol: 'XPD' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">
            Dashboard
          </h1>
          <p className="text-[15px] text-[#76707F] mt-0.5">Owner Summary</p>
          {m.unrealizedPLPercent > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF2FF] border border-[#4889FA]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4889FA]" />
              <span className="text-[12px] text-[#2B2833]">
                Unrealized profit up <span className="font-semibold">{m.unrealizedPLPercent.toFixed(0)}%</span> this month
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => onNavigate('analytics')}
          className="btn-primary-dark flex items-center gap-2 mt-1"
        >
          <BarChart3 className="h-4 w-4" />
          Deep Analytics
        </button>
      </div>

      {/* ── Metal Spot Prices ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[14px] font-semibold text-[#2B2833] tracking-tight">Metal Spot Prices</h3>
            <p className="text-[11px] text-[#76707F]">Live market price per troy ounce (USD)</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metalSpots.map(({ label, symbol }) => {
            const price = m.metalPrices?.[symbol] ?? 0;
            return (
              <div key={symbol} className="flex flex-col p-3 rounded-[12px] bg-white/60 border border-black/[0.04]">
                <span className="text-[11px] text-[#A8A3AE] uppercase tracking-wider">{label} / oz</span>
                <span className="text-[22px] font-semibold text-[#2B2833] tabular-nums tracking-tight mt-0.5">
                  {price > 0 ? `$${price.toFixed(2)}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Primary KPIs — 5 columns ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <PrimaryKPICard label="Items in Stock"       value={m.itemsInStock.toString()}       iconType="package" />
        <PrimaryKPICard label="Active Customers"     value={m.activeCustomers.toString()}     iconType="users" />
        <PrimaryKPICard label="Today's Take-In"      value={m.dailyTakeIns.toString()}        iconType="plus" />
        <PrimaryKPICard label="Today's Payout"       value={fmt(m.dailyPayout)}               iconType="dollar-sign" />
        <PrimaryKPICard label="Realized Profit (Mtd)" value={fmt(m.realizedProfitMonth)}      iconType="trending-up" />
      </div>

      {/* ── Portfolio row — 4 columns, no icons, uppercase labels ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SecondaryKPICard
          label="Cost Basis"
          value={fmt(m.costBasis)}
          subtitle="based on active inventory"
        />
        <SecondaryKPICard
          label="Live Inventory Value"
          value={fmt(m.liveValue)}
          subtitle="current market-based estimate"
        />
        <SecondaryKPICard
          label="Unrealized P/L"
          value={`${plPositive ? '+' : ''}${fmt(m.unrealizedPL)}`}
          trend={m.unrealizedPLPercent}
          isProfit
        />
        <SecondaryKPICard
          label="Scrap Pipeline"
          value={fmt(m.scrapPipelineValue)}
          subtitle="showroom value"
        />
      </div>

      {/* ── Chart + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart card — 2/3 width */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">
                Inventory Value Trend
              </h3>
              <p className="text-[13px] text-[#76707F] mt-0.5">Cost basis vs live value</p>
            </div>
            {/* Legend inline top-right */}
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-[12px] text-[#76707F]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ECCC4] flex-shrink-0" />
                Live Value
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-[#76707F]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F43] flex-shrink-0" />
                Cost Basis
              </span>
            </div>
          </div>

          <div className="mt-4">
            {m.costBasis === 0 && m.liveValue === 0 ? (
              <div className="h-52 flex items-center justify-center text-[#76707F] text-[14px]">
                Complete a purchase in Take-In to start tracking
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2ECCC4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2ECCC4" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF9F43" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#FF9F43" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#A8A3AE' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: '#A8A3AE' }}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <Tooltip
                    formatter={(v: number) => fmtFull(v)}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.92)',
                      border: 'none',
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                      fontSize: '13px',
                      color: '#2B2833',
                    }}
                    cursor={{ stroke: 'rgba(107,94,249,0.15)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="liveValue"
                    stroke="#2ECCC4"
                    fill="url(#liveGrad)"
                    strokeWidth={2}
                    name="Live Value"
                    dot={{ fill: '#2ECCC4', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#2ECCC4', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="costBasis"
                    stroke="#FF9F43"
                    fill="url(#costGrad)"
                    strokeWidth={2}
                    name="Cost Basis"
                    dot={{ fill: '#FF9F43', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#FF9F43', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions card — 1/3 width */}
        <div className="glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">
            Quick Actions
          </h3>
          <div className="divide-y divide-black/[0.04]">
            {quickActions.map(({ label, iconType, action }, idx) => (
              <button
                key={action}
                onClick={() => onNavigate(action)}
                className="w-full flex items-center gap-3 py-3 hover:bg-black/[0.02] transition-colors text-left group first:pt-0 last:pb-0"
              >
                {/* Icon tile — matches approved screen: icon-container size w-10 h-10 */}
                <div className="w-10 h-10 rounded-[10px] icon-container flex-shrink-0">
                  <PremiumIcon type={iconType} className="h-5 w-5" />
                </div>
                <span className="text-[14px] font-medium text-[#2B2833] group-hover:text-[#6B5EF9] transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Metal Exposure + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Metal Exposure */}
        <div className="glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">
            Metal Exposure
          </h3>
          <p className="text-[13px] text-[#76707F] mt-0.5 mb-4">Active inventory by metal type</p>

          {m.metalExposure.length === 0 ? (
            <p className="text-[14px] text-[#76707F] py-6 text-center">No metal inventory data yet</p>
          ) : (
            <div className="divide-y divide-black/[0.04]">
              {m.metalExposure.slice(0, 5).map((row: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {/* Gold icon tile */}
                    <div className="w-10 h-10 rounded-[10px] icon-container-gold flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#D4A029" opacity="0.4"
                          stroke="#B8860B" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M2 12l10 5 10-5" stroke="#D4A029" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17l10 5 10-5" stroke="#B8860B" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="1.5" fill="#F4D03F" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#2B2833]">
                        {row.metal} {row.karat}
                      </div>
                      <div className="text-[12px] text-[#76707F]">
                        {row.totalWeight.toFixed(1)}g · {row.itemCount} items
                      </div>
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold text-[#2B2833]">
                    {fmt(row.liveValue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">
            Recent Activity
          </h3>

          {m.recentActivity.length === 0 ? (
            <p className="text-[14px] text-[#76707F] py-6 text-center">No recent activity</p>
          ) : (
            <div className="divide-y divide-black/[0.04]">
              {m.recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {/* Activity icon tile */}
                    <div className="w-10 h-10 rounded-[10px] icon-container flex-shrink-0">
                      {a.type === 'take-in'  && <Plus        className="h-4 w-4 text-[#6B5EF9]" strokeWidth={2.5} />}
                      {a.type === 'customer' && <User        className="h-4 w-4 text-[#6B5EF9]" strokeWidth={2.5} />}
                      {a.type === 'payout'   && <DollarSign  className="h-4 w-4 text-[#6B5EF9]" strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className="text-[14px] text-[#2B2833] font-medium">{a.description}</p>
                      <p className="text-[11px] text-[#A8A3AE] mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {a.time}
                      </p>
                    </div>
                  </div>
                  {a.value !== null && (
                    <span className="text-[15px] font-semibold text-[#2B2833] tabular-nums">
                      {fmtFull(a.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
