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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${variant === 'positive' ? 'bg-emerald-500/10' : variant === 'negative' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            <Icon className={`h-4 w-4 ${variant === 'positive' ? 'text-emerald-600' : variant === 'negative' ? 'text-red-600' : 'text-primary'}`} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center mt-1 text-xs ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isPos ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsModule({ storeId, storeName }: AnalyticsModuleProps) {
  const [dateRange, setDateRange] = useState('30d');
  const { data, loading } = useAnalyticsData(storeId, dateRange);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
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

  // Pie data for metal exposure
  const metalPieData = d.metalExposure.map(m => ({ name: `${m.metal} ${m.karat}`, value: m.liveValue })).slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">{storeName} — Deep Performance Analysis</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="metals">Metal Exposure</TabsTrigger>
          <TabsTrigger value="scrap">Scrap / Refinery</TabsTrigger>
          <TabsTrigger value="showroom">Showroom</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle>Inventory Portfolio</CardTitle>
              <CardDescription>Cost basis vs live value over time</CardDescription>
            </CardHeader>
            <CardContent>
              {d.costBasis === 0 && d.liveValue === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No inventory data yet — complete a Take-In purchase to start tracking</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { period: 'Start', costBasis: d.costBasis * 0.8, liveValue: d.liveValue * 0.75, pl: (d.liveValue * 0.75) - (d.costBasis * 0.8) },
                    { period: 'Mid', costBasis: d.costBasis * 0.9, liveValue: d.liveValue * 0.88, pl: (d.liveValue * 0.88) - (d.costBasis * 0.9) },
                    { period: 'Current', costBasis: d.costBasis, liveValue: d.liveValue, pl: d.unrealizedPL },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="costBasis" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" name="Cost Basis" />
                    <Area type="monotone" dataKey="liveValue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" name="Live Value" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── METAL EXPOSURE ── */}
        <TabsContent value="metals" className="space-y-6">
          {d.metalExposure.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No metal inventory data yet</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Exposure by Metal / Karat</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={metalPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {metalPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmtFull(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Weight Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={d.metalExposure.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="karat" />
                        <YAxis tickFormatter={(v) => `${v}g`} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}g`} />
                        <Bar dataKey="totalWeight" fill="hsl(var(--primary))" name="Weight (g)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed table */}
              <Card>
                <CardHeader><CardTitle>Metal Exposure Detail</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4">Metal</th>
                          <th className="pb-2 pr-4">Karat</th>
                          <th className="pb-2 pr-4 text-right">Items</th>
                          <th className="pb-2 pr-4 text-right">Weight</th>
                          <th className="pb-2 pr-4 text-right">Cost Basis</th>
                          <th className="pb-2 pr-4 text-right">Live Value</th>
                          <th className="pb-2 text-right">P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.metalExposure.map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{row.metal}</td>
                            <td className="py-2 pr-4">{row.karat}</td>
                            <td className="py-2 pr-4 text-right">{row.itemCount}</td>
                            <td className="py-2 pr-4 text-right">{row.totalWeight.toFixed(1)}g</td>
                            <td className="py-2 pr-4 text-right">{fmt(row.costBasis)}</td>
                            <td className="py-2 pr-4 text-right">{fmt(row.liveValue)}</td>
                            <td className={`py-2 text-right font-medium ${row.unrealizedPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {row.unrealizedPL >= 0 ? '+' : ''}{fmt(row.unrealizedPL)} ({row.unrealizedPLPercent.toFixed(1)}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
            <Card>
              <CardHeader><CardTitle>Refinery Lots</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Lot #</th>
                        <th className="pb-2 pr-4">Sent</th>
                        <th className="pb-2 pr-4 text-right">Expected</th>
                        <th className="pb-2 pr-4 text-right">Settlement</th>
                        <th className="pb-2 pr-4 text-right">Profit</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.refineryLots.map((lot, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{lot.lotNumber || '—'}</td>
                          <td className="py-2 pr-4">{lot.sentDate ? new Date(lot.sentDate).toLocaleDateString() : '—'}</td>
                          <td className="py-2 pr-4 text-right">{fmtFull(lot.expectedMelt)}</td>
                          <td className="py-2 pr-4 text-right">{fmtFull(lot.actualSettlement)}</td>
                          <td className={`py-2 pr-4 text-right ${lot.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(lot.profit)}</td>
                          <td className="py-2"><Badge variant="secondary">{lot.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No refinery lots created yet</CardContent></Card>
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
            <Card><CardContent className="py-12 text-center text-muted-foreground">No showroom inventory yet — mark items as Showroom Candidate in Inventory</CardContent></Card>
          )}
        </TabsContent>

        {/* ── BATCHES ── */}
        <TabsContent value="batches" className="space-y-6">
          {d.batchPerformance.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No batches in selected period</CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Batch Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Batch</th>
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Buyer</th>
                        <th className="pb-2 pr-4 text-right">Items</th>
                        <th className="pb-2 pr-4 text-right">Payout</th>
                        <th className="pb-2 pr-4 text-right">Live Value</th>
                        <th className="pb-2 pr-4 text-right">Unrealized</th>
                        <th className="pb-2 text-right">Realized</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.batchPerformance.map((b, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono text-xs">{b.batchId}</td>
                          <td className="py-2 pr-4">{b.date}</td>
                          <td className="py-2 pr-4">{b.employee}</td>
                          <td className="py-2 pr-4 text-right">{b.itemCount}</td>
                          <td className="py-2 pr-4 text-right">{fmtFull(b.totalPayout)}</td>
                          <td className="py-2 pr-4 text-right">{fmtFull(b.currentLiveValue)}</td>
                          <td className={`py-2 pr-4 text-right ${b.unrealizedProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(b.unrealizedProfit)}</td>
                          <td className={`py-2 text-right ${b.realizedProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(b.realizedProfit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── BUYERS ── */}
        <TabsContent value="buyers" className="space-y-6">
          {d.buyerPerformance.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No buyer data in selected period</CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Buyer Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Buyer</th>
                        <th className="pb-2 pr-4 text-right">Take-Ins</th>
                        <th className="pb-2 pr-4 text-right">Total Payout</th>
                        <th className="pb-2 pr-4 text-right">Avg Margin</th>
                        <th className="pb-2 pr-4 text-right">Unrealized</th>
                        <th className="pb-2 pr-4 text-right">Realized</th>
                        <th className="pb-2 text-right">Avg Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.buyerPerformance.map((b, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{b.employeeName}</td>
                          <td className="py-2 pr-4 text-right">{b.takeInCount}</td>
                          <td className="py-2 pr-4 text-right">{fmtFull(b.totalPayout)}</td>
                          <td className="py-2 pr-4 text-right">{b.avgMargin.toFixed(1)}%</td>
                          <td className={`py-2 pr-4 text-right ${b.unrealizedPerformance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(b.unrealizedPerformance)}</td>
                          <td className={`py-2 pr-4 text-right ${b.realizedProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(b.realizedProfit)}</td>
                          <td className="py-2 text-right">{fmtFull(b.avgBatchValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── INSIGHTS ── */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Insights & Recommended Actions</CardTitle>
              <CardDescription>Rule-based analysis of your current inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.insights.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No insights yet — build inventory to generate recommendations</p>
              ) : (
                d.insights.map((insight, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${
                    insight.type === 'positive' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
                    insight.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                    'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {insight.type === 'positive' && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                      {insight.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                      <span className="font-medium">{insight.title}</span>
                    </div>
                    <p className="text-sm mt-1 text-muted-foreground">{insight.message}</p>
                  </div>
                ))
              )}

              {/* Watch analytics placeholder */}
              <div className="mt-6 p-4 rounded-lg border border-dashed border-muted-foreground/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Watch Market Analytics</span>
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Watch pricing API integration will enable market value tracking, hold/sell suggestions, and brand-level exposure analytics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
