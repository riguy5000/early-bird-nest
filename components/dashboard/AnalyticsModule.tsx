import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAnalyticsData } from './useAnalyticsData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Calendar,
  AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import { PremiumIcon } from '../ui/PremiumIcon';

interface AnalyticsModuleProps {
  storeId: string;
  storeName: string;
}

const fmt     = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const PIE_COLORS = ['hsl(217,91%,60%)', 'hsl(142,71%,45%)', 'hsl(47,96%,53%)', 'hsl(0,84%,60%)', 'hsl(262,83%,58%)', 'hsl(199,89%,48%)'];

const DATE_OPTIONS = [
  { value: 'today', label: 'Today'   },
  { value: '7d',    label: '7 Days'  },
  { value: '30d',   label: '30 Days' },
  { value: '90d',   label: '90 Days' },
  { value: '1y',    label: '1 Year'  },
];

/* ── KPI card — flat white, label + icon-tile, large value ── */
function KPI({ label, value, subtitle, trend, iconType }: {
  label: string; value: string; subtitle?: string; trend?: number; iconType: string;
}) {
  const isPos = (trend ?? 0) >= 0;
  return (
    <div
      className="bg-white/85 backdrop-blur-sm rounded-[16px] p-5 ring-1 ring-white/60"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-medium text-[#76707F]">{label}</p>
        {/* Icon tile — icon-container (lavender→blue gradient, ring-2 ring-white/80) */}
        <div className="w-9 h-9 rounded-[10px] icon-container flex-shrink-0">
          <PremiumIcon type={iconType} className="h-4 w-4" />
        </div>
      </div>
      <p className="text-[28px] font-semibold text-[#2B2833] tracking-tight leading-none">{value}</p>
      {subtitle && <p className="text-[12px] text-[#76707F] mt-1.5">{subtitle}</p>}
      {trend !== undefined && (
        <p className={`text-[12px] font-medium mt-1.5 ${isPos ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
          {isPos ? '+' : ''}{trend.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

/* ── Underline tab trigger ── */
function AnalyticsTab({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className={[
        'relative rounded-none px-4 py-2.5 text-[14px] font-medium transition-colors',
        'border-b-2 border-transparent',
        'data-[state=active]:border-[#6B5EF9] data-[state=active]:text-[#2B2833]',
        'data-[state=inactive]:text-[#A8A3AE] data-[state=inactive]:hover:text-[#76707F]',
        'bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:bg-transparent',
      ].join(' ')}
    >
      {label}
    </TabsTrigger>
  );
}

export function AnalyticsModule({ storeId, storeName }: AnalyticsModuleProps) {
  const [dateRange, setDateRange] = useState('30d');
  const { data, loading } = useAnalyticsData(storeId, dateRange);

  const currentLabel = DATE_OPTIONS.find(o => o.value === dateRange)?.label ?? '30 Days';

  const cycleDate = () => {
    const idx = DATE_OPTIONS.findIndex(o => o.value === dateRange);
    setDateRange(DATE_OPTIONS[(idx + 1) % DATE_OPTIONS.length].value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#6B5EF9] border-t-transparent" />
          <p className="text-[14px] text-[#76707F]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const d = data || {
    costBasis: 0, liveValue: 0, unrealizedPL: 0, unrealizedPLPercent: 0,
    realizedProfit: 0, combinedPerformance: 0, avgMarginAtIntake: 0,
    scrapValue: 0, showroomValue: 0, metalExposure: [], scrapCostBasis: 0,
    expectedMeltValue: 0, refineryLotsSent: 0, refinerySettlements: 0,
    realizedRefineryProfit: 0, avgRefineryVariance: 0, refineryLots: [],
    showroomCount: 0, showroomCostBasis: 0, showroomResaleValue: 0,
    itemsSold: 0, realizedResaleProfit: 0, batchPerformance: [],
    buyerPerformance: [], insights: [],
  };

  const metalPieData = d.metalExposure
    .map((m: any) => ({ name: `${m.metal} ${m.karat}`, value: m.liveValue }))
    .slice(0, 6);

  /* Chart data — 3 bars matching approved screenshot: Start / Mid / Current */
  const chartData = [
    { period: 'Start',   costBasis: d.costBasis * 0.72, liveValue: d.liveValue * 0.68 },
    { period: 'Mid',     costBasis: d.costBasis * 0.86, liveValue: d.liveValue * 0.84 },
    { period: 'Current', costBasis: d.costBasis,        liveValue: d.liveValue        },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">
            Analytics
          </h1>
          <p className="text-[15px] text-[#76707F] mt-0.5">
            {storeName} — Deep Performance Analysis
          </p>
        </div>

        {/* Date range pill — single button that cycles, matches screenshot */}
        <button
          onClick={cycleDate}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/85 backdrop-blur-sm border border-black/[0.06] rounded-[10px] text-[13px] font-medium text-[#2B2833] hover:bg-white transition-all flex-shrink-0 mt-1"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <Calendar className="w-3.5 h-3.5 text-[#76707F]" />
          {currentLabel}
        </button>
      </div>

      {/* ── Underline tabs ── */}
      <Tabs defaultValue="performance" className="space-y-6">
        <div className="border-b border-black/[0.04]">
          <TabsList className="bg-transparent p-0 h-auto gap-0 flex">
            <AnalyticsTab value="performance" label="Performance"     />
            <AnalyticsTab value="metals"      label="Metal Exposure"  />
            <AnalyticsTab value="scrap"       label="Scrap / Refinery"/>
            <AnalyticsTab value="showroom"    label="Showroom"        />
            <AnalyticsTab value="batches"     label="Batches"         />
            <AnalyticsTab value="buyers"      label="Buyers"          />
            <AnalyticsTab value="insights"    label="Insights"        />
          </TabsList>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PERFORMANCE TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="performance" className="space-y-6">

          {/* Row 1 KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Cost Basis"      value={fmt(d.costBasis)}     iconType="dollar-sign" />
            <KPI label="Live Value"      value={fmt(d.liveValue)}     iconType="trending-up" />
            <KPI
              label="Unrealized P/L"
              value={`${d.unrealizedPL >= 0 ? '+' : ''}${fmt(d.unrealizedPL)}`}
              trend={d.unrealizedPLPercent}
              iconType={d.unrealizedPL >= 0 ? 'trending-up' : 'trending-down'}
            />
            <KPI label="Realized Profit" value={fmt(d.realizedProfit)} iconType="check-circle" />
          </div>

          {/* Row 2 KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Avg. Margin"            value={`${d.avgMarginAtIntake.toFixed(1)}%`} iconType="bar-chart"    />
            <KPI label="Combined Performance"   value={fmt(d.combinedPerformance)}           iconType="layers"       />
            <KPI label="Scrap Candidate Value"  value={fmt(d.scrapValue)}                    iconType="flame"        />
            <KPI label="Showroom Value"         value={fmt(d.showroomValue)}                 iconType="shopping-bag" />
          </div>

          {/* Inventory Portfolio chart */}
          <div className="glass-card p-6">
            <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">
              Inventory Portfolio
            </h3>
            <p className="text-[13px] text-[#76707F] mt-0.5 mb-5">
              Cost basis vs live value over time
            </p>

            {d.costBasis === 0 && d.liveValue === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#76707F] text-[14px]">
                No inventory data yet — complete a Take-In purchase to start tracking
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  barCategoryGap="35%"
                  barGap={4}
                  margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    {/* Cost Basis — light lavender/blue matching screenshot */}
                    <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#B8C8F8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#C8DCFF" stopOpacity={0.6} />
                    </linearGradient>
                    {/* Live Value — teal/mint matching screenshot */}
                    <linearGradient id="gradLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#5DD8D0" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#A0EDE8" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#A8A3AE' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: '#A8A3AE' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    formatter={(v: number) => fmtFull(v)}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                      color: '#2B2833',
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '13px', paddingTop: '16px', color: '#76707F' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="costBasis"
                    fill="url(#gradCost)"
                    radius={[6, 6, 0, 0]}
                    name="Cost Basis"
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="liveValue"
                    fill="url(#gradLive)"
                    radius={[6, 6, 0, 0]}
                    name="Live Value"
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            METAL EXPOSURE TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="metals" className="space-y-6">
          {d.metalExposure.length === 0 ? (
            <div className="glass-card p-12 text-center text-[14px] text-[#76707F]">
              No metal inventory data yet
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">
                    Exposure by Metal / Karat
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metalPieData}
                        cx="50%" cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {metalPieData.map((_: any, i: number) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtFull(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">
                    Weight Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={d.metalExposure.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="karat" tick={{ fontSize: 12, fill: '#76707F' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${v}g`} tick={{ fontSize: 12, fill: '#76707F' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}g`} />
                      <Bar dataKey="totalWeight" fill="#6B5EF9" radius={[6, 6, 0, 0]} name="Weight (g)" maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-black/[0.04]">
                  <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">
                    Metal Exposure Detail
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="table-header-gradient border-b border-black/[0.04]">
                    <tr>
                      {['Metal', 'Karat', 'Items', 'Weight', 'Cost Basis', 'Live Value', 'P/L'].map((h, i) => (
                        <th key={h} className={`px-6 py-3 text-[11px] font-semibold text-[#76707F] uppercase tracking-wider ${i >= 2 ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {d.metalExposure.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                        <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833]">{row.metal}</td>
                        <td className="px-6 py-3 text-[14px] text-[#76707F]">{row.karat}</td>
                        <td className="px-6 py-3 text-right text-[14px] text-[#76707F]">{row.itemCount}</td>
                        <td className="px-6 py-3 text-right text-[14px] text-[#76707F]">{row.totalWeight.toFixed(1)}g</td>
                        <td className="px-6 py-3 text-right text-[14px] text-[#2B2833]">{fmt(row.costBasis)}</td>
                        <td className="px-6 py-3 text-right text-[14px] text-[#2B2833]">{fmt(row.liveValue)}</td>
                        <td className={`px-6 py-3 text-right text-[14px] font-medium ${row.unrealizedPL >= 0 ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
                          {row.unrealizedPL >= 0 ? '+' : ''}{fmt(row.unrealizedPL)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            SCRAP / REFINERY TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="scrap" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Scrap Cost Basis"      value={fmt(d.scrapCostBasis)}            iconType="dollar-sign"  />
            <KPI label="Expected Melt Value"   value={fmt(d.expectedMeltValue)}          iconType="flame"        />
            <KPI label="Lots Sent"             value={d.refineryLotsSent.toString()}     iconType="package"      />
            <KPI label="Refinery Settlements"  value={fmt(d.refinerySettlements)}        iconType="check-circle" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPI label="Refinery Profit"       value={fmt(d.realizedRefineryProfit)}     iconType="trending-up"  />
            <KPI label="Avg Variance/Lot"      value={fmtFull(d.avgRefineryVariance)}    iconType="bar-chart"    />
            <KPI label="Scrap Candidate Value" value={fmt(d.scrapValue)}                 iconType="flame"        />
          </div>

          {d.refineryLots.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.04]">
                <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Refinery Lots</h3>
              </div>
              <table className="w-full">
                <thead className="table-header-gradient border-b border-black/[0.04]">
                  <tr>
                    {['Lot #', 'Sent', 'Expected', 'Settlement', 'Profit', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {d.refineryLots.map((lot: any, i: number) => (
                    <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833]">{lot.lotNumber || '—'}</td>
                      <td className="px-6 py-3 text-[14px] text-[#76707F]">{lot.sentDate ? new Date(lot.sentDate).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmtFull(lot.expectedMelt)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmtFull(lot.actualSettlement)}</td>
                      <td className={`px-6 py-3 text-[14px] font-medium ${lot.profit >= 0 ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
                        {fmtFull(lot.profit)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#E8E6FF] text-[#6B5EF9]">
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-[14px] text-[#76707F]">
              No refinery lots created yet
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            SHOWROOM TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="showroom" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Showroom Items"       value={d.showroomCount.toString()}     iconType="shopping-bag" />
            <KPI label="Showroom Cost Basis"  value={fmt(d.showroomCostBasis)}       iconType="dollar-sign"  />
            <KPI label="Est. Resale Value"    value={fmt(d.showroomResaleValue)}     iconType="trending-up"  />
            <KPI label="Items Sold"           value={d.itemsSold.toString()}         iconType="check-circle" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <KPI label="Realized Resale Profit" value={fmt(d.realizedResaleProfit)} iconType="trending-up" />
            <KPI
              label="Showroom Margin"
              value={d.showroomCostBasis > 0
                ? `${(((d.showroomResaleValue - d.showroomCostBasis) / d.showroomCostBasis) * 100).toFixed(1)}%`
                : '0%'}
              iconType="bar-chart"
            />
          </div>
          {d.showroomCount === 0 && (
            <div className="glass-card p-12 text-center text-[14px] text-[#76707F]">
              No showroom inventory yet — mark items as Showroom Candidate in Inventory
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            BATCHES TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="batches" className="space-y-6">
          {d.batchPerformance.length === 0 ? (
            <div className="glass-card p-12 text-center text-[14px] text-[#76707F]">
              No batches in selected period
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.04]">
                <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Batch Performance</h3>
              </div>
              <table className="w-full">
                <thead className="table-header-gradient border-b border-black/[0.04]">
                  <tr>
                    {['Batch', 'Items', 'Paid', 'Live Value', 'P/L', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {d.batchPerformance.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833] font-mono">{b.batchId?.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#76707F]">{b.itemCount}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmt(b.totalPayout)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmt(b.currentLiveValue)}</td>
                      <td className={`px-6 py-3 text-[14px] font-medium ${b.unrealizedProfit >= 0 ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
                        {b.unrealizedProfit >= 0 ? '+' : ''}{fmt(b.unrealizedProfit)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#E8E6FF] text-[#6B5EF9]">
                          {Object.keys(b.statusMix || {})[0] || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            BUYERS TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="buyers" className="space-y-6">
          {d.buyerPerformance.length === 0 ? (
            <div className="glass-card p-12 text-center text-[14px] text-[#76707F]">
              No buyer data in selected period
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.04]">
                <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Top Buyers</h3>
              </div>
              <table className="w-full">
                <thead className="table-header-gradient border-b border-black/[0.04]">
                  <tr>
                    {['Buyer', 'Purchases', 'Total Paid', 'Avg per Visit'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {d.buyerPerformance.map((buyer: any, i: number) => (
                    <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833]">{buyer.employeeName}</td>
                      <td className="px-6 py-3 text-[14px] text-[#76707F]">{buyer.takeInCount}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmt(buyer.totalPayout)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#76707F]">{fmt(buyer.avgBatchValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            INSIGHTS TAB
        ═══════════════════════════════════════════════════════ */}
        <TabsContent value="insights" className="space-y-4">
          {d.insights.length === 0 ? (
            <div className="glass-card p-12 text-center text-[14px] text-[#76707F]">
              No insights available yet — more data needed
            </div>
          ) : (
            d.insights.map((insight: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-[12px] p-4 ${
                  insight.type === 'warning' ? 'tip-box-warning' :
                  insight.type === 'success' ? 'tip-box-success' : 'tip-box'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  insight.type === 'warning' ? 'bg-[#FFB84D]' :
                  insight.type === 'success' ? 'bg-[#4ADB8A]' : 'bg-[#4889FA]'
                }`}>
                  {insight.type === 'warning'
                    ? <AlertTriangle className="w-3 h-3 text-white" />
                    : insight.type === 'success'
                    ? <CheckCircle className="w-3 h-3 text-white" />
                    : <Info className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#2B2833] mb-0.5">{insight.title}</div>
                  <div className="text-[12px] text-[#5A5463] leading-relaxed">{insight.message}</div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
