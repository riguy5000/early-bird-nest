import { computeMetalRow, type SpotPrices } from '@/lib/pricing';
import type { InventoryItemRecord } from '../types';

export interface MetalPurityTotal {
  metal: string;
  purity: string;
  grams: number;
  estimatedValue: number;
}

export interface BatchTotals {
  itemCount: number;
  goldGrams: number;
  silverGrams: number;
  platinumGrams: number;
  palladiumGrams: number;
  estimatedValue: number;
  estimatedPayout: number;
  byPurity: MetalPurityTotal[];
  categoryBreakdown: Record<string, number>;
}

interface RowOverride {
  itemId: string;
  metalIndex: number;
  sendOutWeight: number;
}

/**
 * Compute totals for a set of selected scrap inventory items.
 * Optionally accepts per-row weight overrides (for editable send-out weights).
 */
export function computeBatchTotals(
  items: InventoryItemRecord[],
  prices: SpotPrices,
  rateDefaults?: Record<string, number>,
  overrides?: RowOverride[],
): BatchTotals {
  const ovMap = new Map<string, number>();
  overrides?.forEach(o => ovMap.set(`${o.itemId}::${o.metalIndex}`, o.sendOutWeight));

  let goldG = 0, silverG = 0, platG = 0, pallG = 0;
  let value = 0, payout = 0;
  const byPurityMap = new Map<string, MetalPurityTotal>();
  const categoryBreakdown: Record<string, number> = {};

  for (const item of items) {
    categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    const metals = Array.isArray(item.metals) ? item.metals : [];
    metals.forEach((m: any, idx: number) => {
      const metalType = String(m?.type || m?.metal || '');
      const purity = String(m?.karat || m?.purity || '');
      const baseWeight = Number(m?.weight) || 0;
      const override = ovMap.get(`${item.id}::${idx}`);
      const weight = typeof override === 'number' ? override : baseWeight;
      if (!metalType || weight <= 0) return;

      const result = computeMetalRow(
        { type: metalType, karat: m?.karat, purity: m?.purity, weight, payoutPercentage: m?.payoutPercentage },
        prices,
        rateDefaults,
      );
      value += result.marketValue;
      payout += result.payoutAmount;

      const mt = metalType.toLowerCase();
      if (mt === 'gold') goldG += weight;
      else if (mt === 'silver') silverG += weight;
      else if (mt === 'platinum') platG += weight;
      else if (mt === 'palladium') pallG += weight;

      const key = `${metalType}::${purity}`;
      const cur = byPurityMap.get(key) || { metal: metalType, purity, grams: 0, estimatedValue: 0 };
      cur.grams += weight;
      cur.estimatedValue += result.marketValue;
      byPurityMap.set(key, cur);
    });
  }

  return {
    itemCount: items.length,
    goldGrams: goldG,
    silverGrams: silverG,
    platinumGrams: platG,
    palladiumGrams: pallG,
    estimatedValue: value,
    estimatedPayout: payout,
    byPurity: Array.from(byPurityMap.values()).sort((a, b) => a.metal.localeCompare(b.metal) || a.purity.localeCompare(b.purity)),
    categoryBreakdown,
  };
}

export function primaryMetalForItem(item: InventoryItemRecord): { metal: string; purity: string; weight: number } {
  const metals = Array.isArray(item.metals) ? item.metals : [];
  const m: any = metals[0] || {};
  return {
    metal: String(m.type || m.metal || ''),
    purity: String(m.karat || m.purity || ''),
    weight: Number(m.weight) || Number(item.weight) || 0,
  };
}
