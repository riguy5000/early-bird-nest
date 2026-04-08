import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../src/integrations/supabase/client';

const KARAT_PURITY: Record<string, number> = {
  '9k': 9/24, '10k': 10/24, '14k': 14/24, '18k': 18/24,
  '22k': 22/24, '24k': 1, '999': 1, '925': 0.925, '900': 0.9,
  '950': 0.95, '585': 14/24, '750': 18/24, '375': 9/24, '417': 10/24,
  // Numeric string formats (from take-in metals JSON)
  '9': 9/24, '10': 10/24, '14': 14/24, '18': 18/24,
  '22': 22/24, '24': 1,
};
const METAL_SYMBOL_MAP: Record<string, string> = {
  gold: 'XAU', silver: 'XAG', platinum: 'XPT', palladium: 'XPD',
};
const GRAMS_PER_TROY_OZ = 31.1035;

export interface AnalyticsData {
  // Performance KPIs
  costBasis: number;
  liveValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedProfit: number;
  combinedPerformance: number;
  avgMarginAtIntake: number;
  scrapValue: number;
  showroomValue: number;

  // Metal exposure
  metalExposure: Array<{
    metal: string;
    karat: string;
    itemCount: number;
    totalWeight: number;
    costBasis: number;
    liveValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
  }>;

  // Scrap/refinery
  scrapCostBasis: number;
  expectedMeltValue: number;
  refineryLotsSent: number;
  refinerySettlements: number;
  realizedRefineryProfit: number;
  avgRefineryVariance: number;
  refineryLots: Array<{
    lotNumber: string;
    sentDate: string | null;
    expectedMelt: number;
    actualSettlement: number;
    profit: number;
    status: string;
  }>;

  // Showroom
  showroomCount: number;
  showroomCostBasis: number;
  showroomResaleValue: number;
  itemsSold: number;
  realizedResaleProfit: number;

  // Batch performance
  batchPerformance: Array<{
    batchId: string;
    date: string;
    employee: string;
    itemCount: number;
    totalPayout: number;
    currentLiveValue: number;
    realizedProfit: number;
    unrealizedProfit: number;
    statusMix: Record<string, number>;
  }>;

  // Buyer performance
  buyerPerformance: Array<{
    employeeId: string;
    employeeName: string;
    takeInCount: number;
    totalPayout: number;
    avgMargin: number;
    unrealizedPerformance: number;
    realizedProfit: number;
    avgBatchValue: number;
  }>;

  // Insights
  insights: Array<{
    type: 'positive' | 'warning' | 'info';
    title: string;
    message: string;
  }>;
}

function getDateRange(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case '7d': { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case '90d': { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
    case '1y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    default: { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
  }
}

function calcItemLiveValue(item: any, metalPrices: Record<string, number>): number {
  const metals = Array.isArray(item.metals) ? item.metals : [];
  if (metals.length === 0) {
    return Number(item.estimated_scrap_value) || Number(item.estimated_resale_value) || Number(item.payout_amount) || 0;
  }
  let total = 0;
  metals.forEach((m: any) => {
    const metalType = (m.metal || m.type || 'gold').toLowerCase();
    const karat = (m.karat || m.purity || '14k').toLowerCase();
    const weight = Number(m.weight) || 0;
    const purity = KARAT_PURITY[karat] || 0.585;
    const symbol = METAL_SYMBOL_MAP[metalType] || 'XAU';
    const pricePerOz = metalPrices[symbol] || 0;
    total += (weight * purity / GRAMS_PER_TROY_OZ) * pricePerOz;
  });
  return total;
}

export function useAnalyticsData(storeId: string, dateRange: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const rangeStart = getDateRange(dateRange).toISOString();

      const [
        { data: items },
        { data: batches },
        { data: prices },
        { data: lots },
        { data: employees },
      ] = await Promise.all([
        supabase.from('inventory_items').select('*').eq('store_id', storeId),
        supabase.from('inventory_batches').select('*').eq('store_id', storeId),
        supabase.from('metal_prices').select('*').order('fetched_at', { ascending: false }).limit(10),
        supabase.from('refinery_lots').select('*').eq('store_id', storeId),
        supabase.from('employee_profiles').select('id, first_name, last_name').eq('store_id', storeId),
      ]);

      const metalPrices: Record<string, number> = {};
      (prices || []).forEach((p: any) => { if (!metalPrices[p.symbol]) metalPrices[p.symbol] = p.price_usd; });

      const allItems = items || [];
      const activeItems = allItems.filter((i: any) => !i.is_archived);
      const rangeItems = allItems.filter((i: any) => i.created_at >= rangeStart);

      // KPIs
      const costBasis = activeItems.reduce((s: number, i: any) => s + (Number(i.payout_amount) || 0), 0);
      let liveValue = 0;
      activeItems.forEach((i: any) => { liveValue += calcItemLiveValue(i, metalPrices); });
      const unrealizedPL = liveValue - costBasis;
      const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

      // Realized profit
      const soldItems = allItems.filter((i: any) => i.processing_status === 'Sold' && i.sold_date >= rangeStart);
      const realizedResaleProfit = soldItems.reduce((s: number, i: any) => s + ((Number(i.sold_amount) || 0) - (Number(i.payout_amount) || 0)), 0);
      const settledLots = (lots || []).filter((l: any) => l.status === 'settled');
      const realizedRefineryProfit = settledLots.reduce((s: number, l: any) => s + ((Number(l.actual_settlement) || 0) - (Number(l.expected_melt_value) || 0)), 0);
      const refinerySettlements = settledLots.reduce((s: number, l: any) => s + (Number(l.actual_settlement) || 0), 0);
      const realizedProfit = realizedResaleProfit + realizedRefineryProfit;

      // Avg margin at intake
      const margins = rangeItems.map((i: any) => {
        const mv = Number(i.market_value_at_intake) || 0;
        const pa = Number(i.payout_amount) || 0;
        return mv > 0 ? ((mv - pa) / mv) * 100 : 0;
      }).filter((m: number) => m !== 0);
      const avgMarginAtIntake = margins.length > 0 ? margins.reduce((a: number, b: number) => a + b, 0) / margins.length : 0;

      // Metal exposure
      const exposureMap = new Map<string, any>();
      activeItems.forEach((item: any) => {
        const metals = Array.isArray(item.metals) ? item.metals : [];
        metals.forEach((m: any) => {
          const metalType = (m.metal || m.type || 'gold').toLowerCase();
          const karat = (m.karat || m.purity || '14k').toLowerCase();
          const weight = Number(m.weight) || 0;
          const purity = KARAT_PURITY[karat] || 0.585;
          const symbol = METAL_SYMBOL_MAP[metalType] || 'XAU';
          const metalLive = (weight * purity / GRAMS_PER_TROY_OZ) * (metalPrices[symbol] || 0);
          const key = `${metalType}-${karat}`;
          const row = exposureMap.get(key) || { metal: metalType.charAt(0).toUpperCase() + metalType.slice(1), karat: karat.toUpperCase(), itemCount: 0, totalWeight: 0, costBasis: 0, liveValue: 0, unrealizedPL: 0, unrealizedPLPercent: 0 };
          row.itemCount++;
          row.totalWeight += weight;
          row.liveValue += metalLive;
          row.costBasis += (Number(item.payout_amount) || 0) / Math.max(metals.length, 1);
          exposureMap.set(key, row);
        });
      });
      exposureMap.forEach(row => {
        row.unrealizedPL = row.liveValue - row.costBasis;
        row.unrealizedPLPercent = row.costBasis > 0 ? (row.unrealizedPL / row.costBasis) * 100 : 0;
      });

      // Scrap analytics
      const scrapItems = activeItems.filter((i: any) => i.disposition === 'Scrap Candidate' || i.processing_status?.includes('Scrap') || i.processing_status?.includes('Refinery'));
      const scrapCostBasis = scrapItems.reduce((s: number, i: any) => s + (Number(i.payout_amount) || 0), 0);
      const expectedMeltValue = scrapItems.reduce((s: number, i: any) => s + calcItemLiveValue(i, metalPrices), 0);

      // Showroom analytics
      const showroomItems = activeItems.filter((i: any) => i.disposition === 'Showroom Candidate' || i.processing_status === 'In Showcase' || i.processing_status === 'Ready for Showroom');
      const showroomCostBasis = showroomItems.reduce((s: number, i: any) => s + (Number(i.payout_amount) || 0), 0);
      const showroomResaleValue = showroomItems.reduce((s: number, i: any) => s + (Number(i.estimated_resale_value) || Number(i.selling_price) || 0), 0);

      // Batch performance
      const empMap = new Map<string, string>();
      (employees || []).forEach((e: any) => empMap.set(e.id, `${e.first_name} ${e.last_name}`.trim()));

      const batchPerformance = (batches || [])
        .filter((b: any) => b.created_at >= rangeStart)
        .map((b: any) => {
          const batchItems = allItems.filter((i: any) => i.batch_id === b.id);
          const batchLive = batchItems.reduce((s: number, i: any) => s + calcItemLiveValue(i, metalPrices), 0);
          const batchRealized = batchItems.filter((i: any) => i.processing_status === 'Sold')
            .reduce((s: number, i: any) => s + ((Number(i.sold_amount) || 0) - (Number(i.payout_amount) || 0)), 0);
          const activeBI = batchItems.filter((i: any) => !i.is_archived);
          const batchUnrealized = activeBI.reduce((s: number, i: any) => s + calcItemLiveValue(i, metalPrices), 0) - activeBI.reduce((s: number, i: any) => s + (Number(i.payout_amount) || 0), 0);
          const statusMix: Record<string, number> = {};
          batchItems.forEach((i: any) => { statusMix[i.disposition] = (statusMix[i.disposition] || 0) + 1; });
          return {
            batchId: b.id.slice(0, 8),
            date: new Date(b.created_at).toLocaleDateString(),
            employee: empMap.get(b.employee_id) || 'Unknown',
            itemCount: b.total_items || batchItems.length,
            totalPayout: Number(b.total_payout) || 0,
            currentLiveValue: batchLive,
            realizedProfit: batchRealized,
            unrealizedProfit: batchUnrealized,
            statusMix,
          };
        });

      // Buyer performance
      const buyerMap = new Map<string, any>();
      (batches || []).filter((b: any) => b.created_at >= rangeStart).forEach((b: any) => {
        const eid = b.employee_id || 'unknown';
        const entry = buyerMap.get(eid) || { employeeId: eid, employeeName: empMap.get(eid) || 'Unknown', takeInCount: 0, totalPayout: 0, margins: [] as number[], unrealizedPerformance: 0, realizedProfit: 0, avgBatchValue: 0 };
        entry.takeInCount++;
        entry.totalPayout += Number(b.total_payout) || 0;
        const batchItems = allItems.filter((i: any) => i.batch_id === b.id);
        batchItems.forEach((i: any) => {
          const mv = Number(i.market_value_at_intake) || 0;
          const pa = Number(i.payout_amount) || 0;
          if (mv > 0) entry.margins.push(((mv - pa) / mv) * 100);
          if (!i.is_archived) entry.unrealizedPerformance += calcItemLiveValue(i, metalPrices) - pa;
          if (i.processing_status === 'Sold') entry.realizedProfit += (Number(i.sold_amount) || 0) - pa;
        });
        buyerMap.set(eid, entry);
      });
      const buyerPerformance = Array.from(buyerMap.values()).map(b => ({
        ...b,
        avgMargin: b.margins.length > 0 ? b.margins.reduce((a: number, c: number) => a + c, 0) / b.margins.length : 0,
        avgBatchValue: b.takeInCount > 0 ? b.totalPayout / b.takeInCount : 0,
        margins: undefined,
      }));

      // Insights
      const insights: AnalyticsData['insights'] = [];
      if (unrealizedPL > 0) {
        insights.push({ type: 'positive', title: 'Portfolio Up', message: `Active inventory is up ${unrealizedPLPercent.toFixed(1)}% vs cost basis` });
      } else if (unrealizedPL < 0) {
        insights.push({ type: 'warning', title: 'Portfolio Down', message: `Active inventory is down ${Math.abs(unrealizedPLPercent).toFixed(1)}% vs cost basis` });
      }
      if (scrapItems.length > 0 && expectedMeltValue > scrapCostBasis) {
        insights.push({ type: 'positive', title: 'Scrap Opportunity', message: `Scrap candidates melt value exceeds cost basis by $${(expectedMeltValue - scrapCostBasis).toFixed(0)}` });
      }
      const oldShowroom = showroomItems.filter((i: any) => {
        const days = (Date.now() - new Date(i.created_at).getTime()) / 86400000;
        return days > 60;
      });
      if (oldShowroom.length > 0) {
        insights.push({ type: 'warning', title: 'Aging Showroom', message: `${oldShowroom.length} showroom items are older than 60 days — consider scrapping` });
      }
      if (activeItems.length === 0) {
        insights.push({ type: 'info', title: 'No Inventory', message: 'Complete a Take-In purchase to start tracking inventory performance' });
      }

      // Refinery lots
      const refineryLotsData = (lots || []).map((l: any) => ({
        lotNumber: l.lot_number,
        sentDate: l.sent_date,
        expectedMelt: Number(l.expected_melt_value) || 0,
        actualSettlement: Number(l.actual_settlement) || 0,
        profit: (Number(l.actual_settlement) || 0) - (Number(l.expected_melt_value) || 0),
        status: l.status,
      }));

      setData({
        costBasis, liveValue, unrealizedPL, unrealizedPLPercent,
        realizedProfit,
        combinedPerformance: unrealizedPL + realizedProfit,
        avgMarginAtIntake,
        scrapValue: expectedMeltValue,
        showroomValue: showroomResaleValue,
        metalExposure: Array.from(exposureMap.values()).sort((a, b) => b.liveValue - a.liveValue),
        scrapCostBasis, expectedMeltValue,
        refineryLotsSent: (lots || []).filter((l: any) => l.status !== 'pending').length,
        refinerySettlements,
        realizedRefineryProfit,
        avgRefineryVariance: settledLots.length > 0 ? realizedRefineryProfit / settledLots.length : 0,
        refineryLots: refineryLotsData,
        showroomCount: showroomItems.length,
        showroomCostBasis, showroomResaleValue,
        itemsSold: soldItems.length,
        realizedResaleProfit,
        batchPerformance,
        buyerPerformance,
        insights,
      });
    } catch (err) {
      console.error('Analytics data error:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId, dateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  return { data, loading, refetch: loadData };
}
