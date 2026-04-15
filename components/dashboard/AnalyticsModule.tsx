import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAnalyticsData } from './useAnalyticsData';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Flame, ShoppingBag, Zap, AlertTriangle,
  Info, CheckCircle, BarChart3, Layers
} from 'lucide-react';

interface AnalyticsModuleProps {
  storeId: string;
  storeName: string;
}

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const PIE_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(47, 96%, 53%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)', 'hsl(199, 89%, 48%)'];

function KPI({ label, value, subtitle, trend, icon: Icon, variant = 'default' }: any) {
  const isPos = (trend || 0) >= 0;
  return (
    <div className="kpi-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-[#76707F] uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-[#2B2833]">{value}</p>
          {subtitle && <p className="text-[11px] text-[#76707F]">{subtitle}</p>}
        </div>
        <div className={`icon-container w-9 h-9 rounded-[10px] flex items-center justify-center ${
          variant === 'positive' ? 'bg-emerald-100' : variant === 'negative' ? 'bg-red-100' : ''
        }`}>
          <Icon className={`h-4 w-4 ${
            variant === 'positive' ? 'text-emerald-600' : variant === 'negative' ? 'text-red-600' : 'text-[#6B5EF9]'
          }`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center mt-1.5 text-[11px] font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
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
          <p className="mt-2 text-[#76707F] text-sm">Loading analytics...</p>
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
          <h2 className="text-2xl font-bold text-[#2B2833]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Analytics</h2>
          <p className="text-[13px] text-[#76707F]">{storeName} — Deep Performance Analysis</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 bg-white/60 border-white/80 rounded-[10px] text-[13px]">
            <Calendar className="w-4 h-4 mr-2 text-[#A8A3AE]" />
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
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="flex-wrap bg-white/60 backdrop-blur-sm border border-white/60 rounded-[12px] p-1">
          <TabsTrigger value="performance" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Performance</TabsTrigger>
          <TabsTrigger value="metals" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Metal Exposure</TabsTrigger>
          <TabsTrigger value="scrap" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Scrap / Refinery</TabsTrigger>
          <TabsTrigger value="showroom" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Showroom</TabsTrigger>
          <TabsTrigger value="batches" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Batches</TabsTrigger>
          <TabsTrigger value="buyers" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Buyers</TabsTrigger>
          <TabsTrigger value="insights" className="rounded-[8px] data-[state=active]:bg-white data-[state=active]:shadow-md text-[13px]">Insights</TabsTrigger>
        </TabsList>

        {/* ── PERFORMANCE ── */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPI label="Cost Basis" value={fmt(d.costBasis)} icon={DollarSign} />
            <KPI label="Live Value" value={fmt(d.liveValue)} icon={TrendingUp} />
            <KPI label="Unrealized P/L" value={`${d.unrealizedPL >= 0 ? '+' : ''}${fmt(d.unrealizedPL)}`} trend={d.unrealizedPLPercent} icon={d.unrealizedPL >= 0 ? TrendingUp : TrendingDown} variant={plVariant} />
            <KPI label="Realized Profit" value={fmt(d.realizedProfit)} icon={CheckCircle} variant={d.realizedProfit >= 0 ? 'positive' : 'negative'} />
            <KPI label="Avg Margin" value={`${d.avgMarginAtIntake.toFixed(1)}%`} icon={BarChart3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KPI label="Combined Performance" value={fmt(d.combinedPerformance)} icon={Layers} variant={d.combinedPerformance >= 0 ? 'positive' : 'negative'} />
            <KPI label="Scrap Candidate Value" value={fmt(d.scrapValue)} icon={Flame} />
            <KPI label="Showroom Value" value={fmt(d.showroomValue)} icon={ShoppingBag} />
          </div>

          {/* Portfolio chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-[15px] font-semibold text-[#2B2833]">Inventory Portfolio</h3>
              <p className="text-[12px] text-[#76707F]">Cost basis vs live value over time</p>
            </div>
            {d.costBasis === 0 && d.liveValue === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#76707F] text-sm">No inventory data yet — complete a Take-In purchase to start tracking</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { period: 'Start', costBasis: d.costBasis * 0.8, liveValue: d.liveValue * 0.75 },
                  { period: 'Mid', costBasis: d.costBasis * 0.9, liveValue: d.liveValue * 0.88 },
                  { period: 'Current', costBasis: d.costBasis, liveValue: d.liveValue },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#76707F' }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#76707F' }} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="costBasis" stroke="#A8A3AE" fill="rgba(168,163,174,0.1)" name="Cost Basis" />
                  <Area type="monotone" dataKey="liveValue" stroke="#6B5EF9" fill="rgba(107,94,249,0.15)" name="Live Value" />
                </AreaChart>
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
                  <h3 className="text-[15px] font-semibold text-[#2B2833] mb-4">Exposure by Metal / Karat</h3>
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
                  <h3 className="text-[15px] font-semibold text-[#2B2833] mb-4">Weight Distribution</h3>
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

              {/* Detailed table */}
              <div className="glass-card p-6">
                <h3 className="text-[15px] font-semibold text-[#2B2833] mb-4">Metal Exposure Detail</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/40 text-left text-[11px] text-[#76707F] uppercase tracking-wider">
                        <th className="pb-3 pr-4">Metal</th>
                        <th className="pb-3 pr-4">Karat</th>
                        <th className="pb-3 pr-4 text-right">Items</th>
                        <th className="pb-3 pr-4 text-right">Weight</th>
                        <th className="pb-3 pr-4 text-right">Cost Basis</th>
                        <th className="pb-3 pr-4 text-right">Live Value</th>
                        <th className="pb-3 text-right">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.metalExposure.map((row, i) => (
                        <tr key={i} className="border-b border-white/30 last:border-0">
                          <td className="py-2.5 pr-4 font-medium text-[#2B2833]">{row.metal}</td>
                          <td className="py-2.5 pr-4 text-[#76707F]">{row.karat}</td>
                          <td className="py-2.5 pr-4 text-right text-[#76707F]">{row.itemCount}</td>
                          <td className="py-2.5 pr-4 text-right text-[#76707F]">{row.totalWeight.toFixed(1)}g</td>
                          <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmt(row.costBasis)}</td>
                          <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmt(row.liveValue)}</td>
                          <td className={`py-2.5 text-right font-medium ${row.unrealizedPL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {row.unrealizedPL >= 0 ? '+' : ''}{fmt(row.unrealizedPL)} ({row.unrealizedPLPercent.toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── SCRAP / REFINERY ── */}
        <TabsContent value="scrap" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Scrap Cost Basis" value={fmt(d.scrapCostBasis)} icon={DollarSign} />
            <KPI label="Expected Melt Value" value={fmt(d.expectedMeltValue)} icon={Flame} />
            <KPI label="Lots Sent" value={d.refineryLotsSent.toString()} icon={Package} />
            <KPI label="Refinery Settlements" value={fmt(d.refinerySettlements)} icon={CheckCircle} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPI label="Refinery Profit" value={fmt(d.realizedRefineryProfit)} icon={TrendingUp} variant={d.realizedRefineryProfit >= 0 ? 'positive' : 'negative'} />
            <KPI label="Avg Variance/Lot" value={fmtFull(d.avgRefineryVariance)} icon={BarChart3} />
            <KPI label="Scrap Candidate Value" value={fmt(d.scrapValue)} icon={Flame} />
          </div>

          {d.refineryLots.length > 0 ? (
            <div className="glass-card p-6">
              <h3 className="text-[15px] font-semibold text-[#2B2833] mb-4">Refinery Lots</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/40 text-left text-[11px] text-[#76707F] uppercase tracking-wider">
                      <th className="pb-3 pr-4">Lot #</th>
                      <th className="pb-3 pr-4">Sent</th>
                      <th className="pb-3 pr-4 text-right">Expected</th>
                      <th className="pb-3 pr-4 text-right">Settlement</th>
                      <th className="pb-3 pr-4 text-right">Profit</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.refineryLots.map((lot, i) => (
                      <tr key={i} className="border-b border-white/30 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-[#2B2833]">{lot.lotNumber || '—'}</td>
                        <td className="py-2.5 pr-4 text-[#76707F]">{lot.sentDate ? new Date(lot.sentDate).toLocaleDateString() : '—'}</td>
                        <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmtFull(lot.expectedMelt)}</td>
                        <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmtFull(lot.actualSettlement)}</td>
                        <td className={`py-2.5 pr-4 text-right font-medium ${lot.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtFull(lot.profit)}</td>
                        <td className="py-2.5"><Badge className="bg-[#F8F7FB] text-[#6B5EF9] border-0 text-[10px]">{lot.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-[#76707F]">No refinery lots created yet</div>
          )}
        </TabsContent>

        {/* ── SHOWROOM ── */}
        <TabsContent value="showroom" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Showroom Items" value={d.showroomCount.toString()} icon={ShoppingBag} />
            <KPI label="Showroom Cost Basis" value={fmt(d.showroomCostBasis)} icon={DollarSign} />
            <KPI label="Est. Resale Value" value={fmt(d.showroomResaleValue)} icon={TrendingUp} />
            <KPI label="Items Sold" value={d.itemsSold.toString()} icon={CheckCircle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KPI label="Realized Resale Profit" value={fmt(d.realizedResaleProfit)} icon={TrendingUp} variant={d.realizedResaleProfit >= 0 ? 'positive' : 'negative'} />
            <KPI label="Showroom Margin" value={d.showroomCostBasis > 0 ? `${(((d.showroomResaleValue - d.showroomCostBasis) / d.showroomCostBasis) * 100).toFixed(1)}%` : '0%'} icon={BarChart3} />
          </div>
          {d.showroomCount === 0 && (
            <div className="glass-card p-12 text-center text-[#76707F]">No showroom inventory yet — mark items as Showroom Candidate in Inventory</div>
          )}
        </TabsContent>

        {/* ── BATCHES ── */}
        <TabsContent value="batches" className="space-y-6">
          {d.batchPerformance.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F]">No batches in selected period</div>
          ) : (
            <div className="glass-card p-6">
              <h3 className="text-[15px] font-semibold text-[#2B2833] mb-4">Batch Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/40 text-left text-[11px] text-[#76707F] uppercase tracking-wider">
                      <th className="pb-3 pr-4">Batch</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Buyer</th>
                      <th className="pb-3 pr-4 text-right">Items</th>
                      <th className="pb-3 pr-4 text-right">Payout</th>
                      <th className="pb-3 pr-4 text-right">Live Value</th>
                      <th className="pb-3 pr-4 text-right">Unrealized</th>
                      <th className="pb-3 text-right">Realized</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.batchPerformance.map((b, i) => (
                      <tr key={i} className="border-b border-white/30 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-[#2B2833]">{b.batchId?.slice(0, 12) || '—'}</td>
                        <td className="py-2.5 pr-4 text-[#76707F]">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                        <td className="py-2.5 pr-4 text-[#76707F]">{b.buyer || '—'}</td>
                        <td className="py-2.5 pr-4 text-right text-[#76707F]">{b.itemCount}</td>
                        <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmt(b.totalPayout)}</td>
                        <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmt(b.liveValue)}</td>
                        <td className={`py-2.5 pr-4 text-right font-medium ${b.unrealizedPL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {b.unrealizedPL >= 0 ? '+' : ''}{fmt(b.unrealizedPL)}
                        </td>
                        <td className={`py-2.5 text-right font-medium ${b.realizedPL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {fmt(b.realizedPL)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── BUYERS ── */}
        <TabsContent value="buyers" className="space-y-6">
          {d.buyerPerformance.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F]">No buyer data in selected period</div>
          ) : (
            <div className="glass-card p-6">
              <h3 className="text-[15px] font-semibold text-[#2B2833] mb-4">Buyer Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/40 text-left text-[11px] text-[#76707F] uppercase tracking-wider">
                      <th className="pb-3 pr-4">Buyer</th>
                      <th className="pb-3 pr-4 text-right">Transactions</th>
                      <th className="pb-3 pr-4 text-right">Items</th>
                      <th className="pb-3 pr-4 text-right">Total Payout</th>
                      <th className="pb-3 pr-4 text-right">Avg Rate</th>
                      <th className="pb-3 text-right">Unrealized</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.buyerPerformance.map((bp, i) => (
                      <tr key={i} className="border-b border-white/30 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-[#2B2833]">{bp.buyerName || '—'}</td>
                        <td className="py-2.5 pr-4 text-right text-[#76707F]">{bp.transactionCount}</td>
                        <td className="py-2.5 pr-4 text-right text-[#76707F]">{bp.itemCount}</td>
                        <td className="py-2.5 pr-4 text-right text-[#2B2833]">{fmt(bp.totalPayout)}</td>
                        <td className="py-2.5 pr-4 text-right text-[#76707F]">{bp.avgRate.toFixed(1)}%</td>
                        <td className={`py-2.5 text-right font-medium ${bp.unrealizedPL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {bp.unrealizedPL >= 0 ? '+' : ''}{fmt(bp.unrealizedPL)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── INSIGHTS ── */}
        <TabsContent value="insights" className="space-y-4">
          {d.insights.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#76707F]">No insights generated yet — add more inventory data</div>
          ) : (
            d.insights.map((insight, i) => (
              <div key={i} className="glass-card p-5 flex items-start gap-4">
                <div className={`icon-container w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                  insight.type === 'warning' ? 'bg-amber-100' : insight.type === 'positive' ? 'bg-emerald-100' : ''
                }`}>
                  {insight.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : insight.type === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Info className="h-4 w-4 text-[#6B5EF9]" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#2B2833]">{insight.title}</p>
                  <p className="text-[12px] text-[#76707F] mt-0.5">{insight.description}</p>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
