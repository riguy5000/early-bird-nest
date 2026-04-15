import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAnalyticsData } from './useAnalyticsData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Flame, ShoppingBag, Zap, AlertTriangle,
  Info, CheckCircle, BarChart3, Layers
} from 'lucide-react';
import { PremiumIcon } from '../ui/PremiumIcon';

interface AnalyticsModuleProps {
  storeId: string;
  storeName: string;
}

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const PIE_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(47, 96%, 53%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)', 'hsl(199, 89%, 48%)'];

function KPI({ label, value, subtitle, trend, iconType, variant = 'default' }: any) {
  const isPos = (trend || 0) >= 0;
  return (
    <div className="kpi-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{label}</p>
          <p className="text-[28px] font-semibold text-[#2B2833] tracking-tight">{value}</p>
          {subtitle && <p className="text-[12px] text-[#76707F]">{subtitle}</p>}
        </div>
        <div className="icon-container w-11 h-11 rounded-[12px]">
          <PremiumIcon type={iconType} className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center mt-1.5 text-[12px] font-medium ${isPos ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
          {isPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isPos ? '+' : ''}{trend.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export function AnalyticsModule({ storeId, storeName }: AnalyticsModuleProps) {
  const [dateRange, setDateRange] = useState('30d');
  const { data, loading } = useAnalyticsData(storeId, dateRange);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5EF9] mx-auto" />
          <p className="mt-2 text-[#76707F] text-[14px]">Loading analytics...</p>
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

  const plVariant = d.unrealizedPL >= 0 ? 'positive' : 'negative';
  const metalPieData = d.metalExposure.map(m => ({ name: `${m.metal} ${m.karat}`, value: m.liveValue })).slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[36px] font-semibold tracking-tight title-gradient">Analytics</h2>
          <p className="text-[15px] text-[#76707F]">{storeName} — Deep Performance Analysis</p>
        </div>
        <button className="btn-secondary-light flex items-center gap-2 text-[13px]">
          <Calendar className="w-4 h-4 text-[#76707F]" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-[13px] font-medium text-[#2B2833] shadow-none ring-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-xl rounded-[14px] border-white/60 shadow-2xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </button>
      </div>

      {/* Underline Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <div className="border-b border-black/[0.04]">
          <TabsList className="bg-transparent p-0 h-auto gap-0">
            {[
              { value: 'performance', label: 'Performance' },
              { value: 'metals', label: 'Metal Exposure' },
              { value: 'scrap', label: 'Scrap / Refinery' },
              { value: 'showroom', label: 'Showroom' },
              { value: 'batches', label: 'Batches' },
              { value: 'buyers', label: 'Buyers' },
              { value: 'insights', label: 'Insights' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6B5EF9] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#2B2833] text-[#A8A3AE] hover:text-[#76707F] px-4 py-2.5 text-[14px] font-medium"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── PERFORMANCE ── */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Cost Basis" value={fmt(d.costBasis)} iconType="dollar-sign" />
            <KPI label="Live Value" value={fmt(d.liveValue)} iconType="trending-up" />
            <KPI label="Unrealized P/L" value={`${d.unrealizedPL >= 0 ? '+' : ''}${fmt(d.unrealizedPL)}`} trend={d.unrealizedPLPercent} iconType={d.unrealizedPL >= 0 ? 'trending-up' : 'trending-down'} variant={plVariant} />
            <KPI label="Realized Profit" value={fmt(d.realizedProfit)} iconType="check-circle" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Avg. Margin" value={`${d.avgMarginAtIntake.toFixed(1)}%`} iconType="bar-chart" />
            <KPI label="Combined Performance" value={fmt(d.combinedPerformance)} iconType="layers" />
            <KPI label="Scrap Candidate Value" value={fmt(d.scrapValue)} iconType="flame" />
            <KPI label="Showroom Value" value={fmt(d.showroomValue)} iconType="shopping-bag" />
          </div>

          {/* Portfolio chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Inventory Portfolio</h3>
              <p className="text-[13px] text-[#76707F]">Cost basis vs live value over time</p>
            </div>
            {d.costBasis === 0 && d.liveValue === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#76707F] text-[14px]">No inventory data yet — complete a Take-In purchase to start tracking</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { period: 'Start', costBasis: d.costBasis * 0.8, liveValue: d.liveValue * 0.75 },
                  { period: 'Mid', costBasis: d.costBasis * 0.9, liveValue: d.liveValue * 0.88 },
                  { period: 'Current', costBasis: d.costBasis, liveValue: d.liveValue },
                ]} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#76707F' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#76707F' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} />
                  <Legend />
                  <Bar dataKey="costBasis" fill="#A8A3AE" radius={[6, 6, 0, 0]} name="Cost Basis" />
                  <Bar dataKey="liveValue" fill="#6B5EF9" radius={[6, 6, 0, 0]} name="Live Value" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        {/* ── METAL EXPOSURE ── */}
        <TabsContent value="metals" className="space-y-6">
          {d.metalExposure.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F]">No metal inventory data yet</div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">Exposure by Metal / Karat</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={metalPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {metalPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtFull(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight mb-4">Weight Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={d.metalExposure.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="karat" tick={{ fontSize: 12, fill: '#76707F' }} />
                      <YAxis tickFormatter={(v) => `${v}g`} tick={{ fontSize: 12, fill: '#76707F' }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}g`} />
                      <Bar dataKey="totalWeight" fill="#6B5EF9" radius={[6, 6, 0, 0]} name="Weight (g)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-black/[0.04]">
                  <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Metal Exposure Detail</h3>
                </div>
                <table className="w-full">
                  <thead className="table-header-gradient">
                    <tr>
                      {['Metal', 'Karat', 'Items', 'Weight', 'Cost Basis', 'Live Value', 'P/L'].map((h, i) => (
                        <th key={h} className={`px-6 py-3 text-[11px] font-semibold text-[#76707F] uppercase tracking-wider ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {d.metalExposure.map((row, i) => (
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

        {/* ── SCRAP / REFINERY ── */}
        <TabsContent value="scrap" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Scrap Cost Basis" value={fmt(d.scrapCostBasis)} iconType="dollar-sign" />
            <KPI label="Expected Melt Value" value={fmt(d.expectedMeltValue)} iconType="flame" />
            <KPI label="Lots Sent" value={d.refineryLotsSent.toString()} iconType="package" />
            <KPI label="Refinery Settlements" value={fmt(d.refinerySettlements)} iconType="check-circle" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPI label="Refinery Profit" value={fmt(d.realizedRefineryProfit)} iconType="trending-up" />
            <KPI label="Avg Variance/Lot" value={fmtFull(d.avgRefineryVariance)} iconType="bar-chart" />
            <KPI label="Scrap Candidate Value" value={fmt(d.scrapValue)} iconType="flame" />
          </div>

          {d.refineryLots.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.04]">
                <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Refinery Lots</h3>
              </div>
              <table className="w-full">
                <thead className="table-header-gradient">
                  <tr>
                    {['Lot #', 'Sent', 'Expected', 'Settlement', 'Profit', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {d.refineryLots.map((lot, i) => (
                    <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833]">{lot.lotNumber || '—'}</td>
                      <td className="px-6 py-3 text-[14px] text-[#76707F]">{lot.sentDate ? new Date(lot.sentDate).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmtFull(lot.expectedMelt)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmtFull(lot.actualSettlement)}</td>
                      <td className={`px-6 py-3 text-[14px] font-medium ${lot.profit >= 0 ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>{fmtFull(lot.profit)}</td>
                      <td className="px-6 py-3"><Badge className="bg-[#F8F7FB] text-[#6B5EF9] border-0 text-[11px] rounded-full px-3 py-0.5">{lot.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-[#76707F] text-[14px]">No refinery lots created yet</div>
          )}
        </TabsContent>

        {/* ── SHOWROOM ── */}
        <TabsContent value="showroom" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Showroom Items" value={d.showroomCount.toString()} iconType="shopping-bag" />
            <KPI label="Showroom Cost Basis" value={fmt(d.showroomCostBasis)} iconType="dollar-sign" />
            <KPI label="Est. Resale Value" value={fmt(d.showroomResaleValue)} iconType="trending-up" />
            <KPI label="Items Sold" value={d.itemsSold.toString()} iconType="check-circle" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <KPI label="Realized Resale Profit" value={fmt(d.realizedResaleProfit)} iconType="trending-up" />
            <KPI label="Showroom Margin" value={d.showroomCostBasis > 0 ? `${(((d.showroomResaleValue - d.showroomCostBasis) / d.showroomCostBasis) * 100).toFixed(1)}%` : '0%'} iconType="bar-chart" />
          </div>
          {d.showroomCount === 0 && (
            <div className="glass-card p-12 text-center text-[#76707F] text-[14px]">No showroom inventory yet — mark items as Showroom Candidate in Inventory</div>
          )}
        </TabsContent>

        {/* ── BATCHES ── */}
        <TabsContent value="batches" className="space-y-6">
          {d.batchPerformance.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F] text-[14px]">No batches in selected period</div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.04]">
                <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Batch Performance</h3>
              </div>
              <table className="w-full">
                <thead className="table-header-gradient">
                  <tr>
                    {['Batch', 'Items', 'Paid', 'Live Value', 'P/L', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {d.batchPerformance.map((b, i) => (
                    <tr key={i} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-6 py-3 text-[14px] font-medium text-[#2B2833]">{b.batchId?.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#76707F]">{b.itemCount}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmt(b.totalPayout)}</td>
                      <td className="px-6 py-3 text-[14px] text-[#2B2833]">{fmt(b.currentLiveValue)}</td>
                      <td className={`px-6 py-3 text-[14px] font-medium ${b.unrealizedProfit >= 0 ? 'text-[#4ADB8A]' : 'text-[#F87171]'}`}>
                        {b.unrealizedProfit >= 0 ? '+' : ''}{fmt(b.unrealizedProfit)}
                      </td>
                      <td className="px-6 py-3"><Badge className="bg-[#F8F7FB] text-[#6B5EF9] border-0 text-[11px] rounded-full px-3 py-0.5">{Object.keys(b.statusMix || {})[0] || 'Active'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── BUYERS ── */}
        <TabsContent value="buyers" className="space-y-6">
          {d.buyerPerformance.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F] text-[14px]">No buyer data in selected period</div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.04]">
                <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Top Buyers</h3>
              </div>
              <table className="w-full">
                <thead className="table-header-gradient">
                  <tr>
                    {['Buyer', 'Purchases', 'Total Paid', 'Avg per Visit'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {d.buyerPerformance.map((buyer, i) => (
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

        {/* ── INSIGHTS ── */}
        <TabsContent value="insights" className="space-y-4">
          {d.insights.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F] text-[14px]">No insights available yet — more data needed</div>
          ) : (
            d.insights.map((insight: any, i: number) => (
              <div key={i} className={`tip-box flex items-start gap-3 ${
                insight.type === 'warning' ? 'bg-gradient-to-r from-[#FFF9E6] to-[#FFFBF0]' :
                insight.type === 'success' ? 'bg-gradient-to-r from-[#E8F5E9] to-[#F0FFF4]' : ''
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  insight.type === 'warning' ? 'bg-[#FFB84D]' :
                  insight.type === 'success' ? 'bg-[#4ADB8A]' : 'bg-[#4889FA]'
                }`}>
                  {insight.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-white" /> :
                   insight.type === 'success' ? <CheckCircle className="w-3 h-3 text-white" /> :
                   <Info className="w-3 h-3 text-white" />}
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
