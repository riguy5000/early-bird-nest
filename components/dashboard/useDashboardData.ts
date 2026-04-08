import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../src/integrations/supabase/client';

// Metal purity factors for karat-based live value calculation
const KARAT_PURITY: Record<string, number> = {
  '9k': 9 / 24, '10k': 10 / 24, '14k': 14 / 24, '18k': 18 / 24,
  '22k': 22 / 24, '24k': 1, '999': 1, '925': 0.925, '900': 0.9,
  '950': 0.95, '585': 14 / 24, '750': 18 / 24, '375': 9 / 24, '417': 10 / 24,
  // Numeric string formats (from take-in metals JSON)
  '9': 9 / 24, '10': 10 / 24, '14': 14 / 24, '18': 18 / 24,
  '22': 22 / 24, '24': 1,
};

const METAL_SYMBOL_MAP: Record<string, string> = {
  gold: 'XAU', silver: 'XAG', platinum: 'XPT', palladium: 'XPD',
};

// Convert grams to troy ounces
const GRAMS_PER_TROY_OZ = 31.1035;

export interface DashboardMetrics {
  itemsInStock: number;
  activeCustomers: number;
  dailyTakeIns: number;
  dailyPayout: number;
  costBasis: number;
  liveValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedProfitMonth: number;
  scrapPipelineValue: number;
  showroomValue: number;
  metalPrices: Record<string, number>;
  metalExposure: MetalExposureRow[];
  recentActivity: ActivityItem[];
}

export interface MetalExposureRow {
  metal: string;
  karat: string;
  itemCount: number;
  totalWeight: number;
  costBasis: number;
  liveValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface ActivityItem {
  type: string;
  description: string;
  time: string;
  value: number | null;
}

export function useDashboardData(storeId: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);

    try {
      // Parallel queries
      const [
        { data: items },
        { data: batches },
        { data: customers },
        { data: prices },
        { data: refineryLots },
      ] = await Promise.all([
        supabase.from('inventory_items').select('*').eq('store_id', storeId),
        supabase.from('inventory_batches').select('*').eq('store_id', storeId),
        supabase.from('customers').select('id').eq('store_id', storeId),
        supabase.from('metal_prices').select('*').order('fetched_at', { ascending: false }).limit(10),
        supabase.from('refinery_lots').select('*').eq('store_id', storeId),
      ]);

      // Build metal price map (per troy oz)
      const metalPrices: Record<string, number> = {};
      (prices || []).forEach((p: any) => {
        if (!metalPrices[p.symbol]) metalPrices[p.symbol] = p.price_usd;
      });

      const activeItems = (items || []).filter((i: any) => !i.is_archived);
      const today = new Date().toISOString().slice(0, 10);

      // Daily take-ins & payout
      const todayBatches = (batches || []).filter((b: any) => b.created_at?.startsWith(today));
      const dailyTakeIns = todayBatches.length;
      const dailyPayout = todayBatches.reduce((s: number, b: any) => s + (Number(b.total_payout) || 0), 0);

      // Cost basis = sum of payout_amount for active items
      const costBasis = activeItems.reduce((s: number, i: any) => s + (Number(i.payout_amount) || 0), 0);

      // Calculate live value from metals data
      let liveValue = 0;
      const exposureMap = new Map<string, MetalExposureRow>();

      activeItems.forEach((item: any) => {
        const metals = Array.isArray(item.metals) ? item.metals : [];
        let itemLive = 0;

        metals.forEach((m: any) => {
          const metalType = (m.metal || m.type || 'gold').toLowerCase();
          const rawKarat = String(m.karat || m.purity || '14k').toLowerCase();
          const karat = /^\d+$/.test(rawKarat) ? rawKarat + 'k' : rawKarat;
          const weight = Number(m.weight) || 0;
          const purity = KARAT_PURITY[rawKarat] || KARAT_PURITY[karat] || 0.585;
          const symbol = METAL_SYMBOL_MAP[metalType] || 'XAU';
          const pricePerOz = metalPrices[symbol] || 0;
          const pureWeightOz = (weight * purity) / GRAMS_PER_TROY_OZ;
          const metalLiveValue = pureWeightOz * pricePerOz;
          itemLive += metalLiveValue;

          // Track exposure
          const key = `${metalType}-${karat}`;
          const existing = exposureMap.get(key) || {
            metal: metalType.charAt(0).toUpperCase() + metalType.slice(1),
            karat: karat.toUpperCase(),
            itemCount: 0,
            totalWeight: 0,
            costBasis: 0,
            liveValue: 0,
            unrealizedPL: 0,
            unrealizedPLPercent: 0,
          };
          existing.itemCount++;
          existing.totalWeight += weight;
          existing.liveValue += metalLiveValue;
          exposureMap.set(key, existing);
        });

        // If no metals data, use estimated values
        if (metals.length === 0) {
          itemLive = Number(item.estimated_scrap_value) || Number(item.estimated_resale_value) || Number(item.payout_amount) || 0;
        }

        liveValue += itemLive;

        // Distribute cost basis to exposure proportionally
        if (metals.length > 0) {
          const itemCost = Number(item.payout_amount) || 0;
          metals.forEach((m: any) => {
          const metalType = (m.metal || m.type || 'gold').toLowerCase();
          const rawKarat = String(m.karat || m.purity || '14k').toLowerCase();
          const karat = /^\d+$/.test(rawKarat) ? rawKarat + 'k' : rawKarat;
          const key = `${metalType}-${karat}`;
            const row = exposureMap.get(key);
            if (row) row.costBasis += itemCost / metals.length;
          });
        }
      });

      // Finalize exposure PL
      exposureMap.forEach((row) => {
        row.unrealizedPL = row.liveValue - row.costBasis;
        row.unrealizedPLPercent = row.costBasis > 0 ? ((row.liveValue - row.costBasis) / row.costBasis) * 100 : 0;
      });

      const metalExposure = Array.from(exposureMap.values()).sort((a, b) => b.liveValue - a.liveValue);

      // Realized profit from refinery settlements + sold items this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStr = monthStart.toISOString();

      const settledLots = (refineryLots || []).filter((l: any) => l.status === 'settled');
      const refineryProfit = settledLots.reduce((s: number, l: any) => s + (Number(l.actual_settlement) || 0), 0)
        - settledLots.reduce((s: number, l: any) => s + (Number(l.expected_melt_value) || 0), 0);

      const soldItems = (items || []).filter((i: any) =>
        i.processing_status === 'Sold' && i.sold_date && i.sold_date >= monthStr
      );
      const resaleProfit = soldItems.reduce((s: number, i: any) =>
        s + ((Number(i.sold_amount) || 0) - (Number(i.payout_amount) || 0)), 0
      );

      const realizedProfitMonth = refineryProfit + resaleProfit;

      // Scrap & showroom values
      const scrapItems = activeItems.filter((i: any) => i.disposition === 'Scrap Candidate' || i.disposition === 'Ready for Scrap');
      const showroomItems = activeItems.filter((i: any) => i.disposition === 'Showroom Candidate' || i.processing_status === 'In Showcase');

      const scrapPipelineValue = scrapItems.reduce((s: number, i: any) => s + (Number(i.estimated_scrap_value) || Number(i.payout_amount) || 0), 0);
      const showroomValue = showroomItems.reduce((s: number, i: any) => s + (Number(i.estimated_resale_value) || Number(i.payout_amount) || 0), 0);

      // Recent activity from batches
      const recentActivity: ActivityItem[] = (batches || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((b: any) => ({
          type: 'take-in',
          description: `Batch of ${b.total_items} items acquired`,
          time: new Date(b.created_at).toLocaleString(),
          value: Number(b.total_payout) || 0,
        }));

      setMetrics({
        itemsInStock: activeItems.length,
        activeCustomers: (customers || []).length,
        dailyTakeIns,
        dailyPayout,
        costBasis,
        liveValue,
        unrealizedPL: liveValue - costBasis,
        unrealizedPLPercent: costBasis > 0 ? ((liveValue - costBasis) / costBasis) * 100 : 0,
        realizedProfitMonth,
        scrapPipelineValue,
        showroomValue,
        metalPrices,
        metalExposure,
        recentActivity,
      });
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { metrics, loading, refetch: loadData };
}
