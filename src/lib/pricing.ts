/**
 * Precious-metal pricing utility.
 *
 * Core formula (per item-metal row):
 *   pure_price_per_gram      = spot_per_oz / 31.1035
 *   adjusted_price_per_gram  = pure_price_per_gram * purity_ratio
 *   metal_value              = adjusted_price_per_gram * weight_grams
 *   final_offer              = metal_value * (payout_percentage / 100)
 *
 * 1 troy ounce = 31.1035 grams.
 */

export const TROY_OUNCE_GRAMS = 31.1035;

export type MetalType = 'Gold' | 'Silver' | 'Platinum' | 'Palladium' | string;

export interface SpotPrices {
  // keys: 'Gold' | 'Silver' | 'Platinum' | 'Palladium' (case-insensitive lookup)
  [metal: string]: number;
}

/**
 * Convert a karat/purity selection into a numeric purity ratio (0..1).
 * - For Gold: karat / 24
 * - For Silver: accepts karat-style numbers OR explicit decimals (.999, .925, 800, 925, etc.)
 * - For Platinum/Palladium: accepts decimal (0.95, 0.999) or grade (950, 999)
 * - Falls back to a sensible default per metal when value is missing/invalid.
 */
export function getPurityRatio(metal: MetalType, karatOrPurity: number | string | undefined | null): number {
  const m = String(metal || '').toLowerCase();
  const raw = karatOrPurity;

  if (raw === undefined || raw === null || raw === '') {
    // sensible defaults
    if (m === 'gold') return 14 / 24;
    if (m === 'silver') return 0.925;
    if (m === 'platinum') return 0.95;
    if (m === 'palladium') return 0.95;
    return 1;
  }

  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!isFinite(num) || num <= 0) return 0;

  if (m === 'gold') {
    // Gold expressed as karat (1..24)
    if (num > 0 && num <= 24) return num / 24;
    // Or as fineness (e.g. 750, 999) or decimal (0.75)
    if (num > 24 && num <= 1000) return num / 1000;
    if (num < 1) return num;
    return num / 24;
  }

  // Silver / Platinum / Palladium
  if (num > 1 && num <= 1000) return num / 1000; // 925, 950, 999
  if (num > 0 && num <= 1) return num;            // 0.925
  return num / 1000;
}

/**
 * Resolve a payout percentage for a metal, honoring store settings hierarchy:
 * 1. Per-metal-row override (if explicitly set on the row)
 * 2. Metal-specific default from rateDefaults (e.g. rateDefaults.gold)
 * 3. Global default
 */
export function resolvePayoutPercent(
  metal: MetalType,
  rowPercent: number | undefined | null,
  rateDefaults: Record<string, number> | undefined,
  globalDefault: number
): number {
  if (typeof rowPercent === 'number' && isFinite(rowPercent) && rowPercent > 0) {
    return rowPercent;
  }
  const key = String(metal || '').toLowerCase();
  const fromRates = rateDefaults?.[key];
  if (typeof fromRates === 'number' && isFinite(fromRates) && fromRates > 0) {
    return fromRates;
  }
  return globalDefault;
}

/** Look up spot price (per troy oz) for a metal, case-insensitive. Returns 0 if missing. */
export function getSpotPerOunce(metal: MetalType, prices: SpotPrices | undefined): number {
  if (!prices) return 0;
  const target = String(metal || '').toLowerCase();
  for (const k of Object.keys(prices)) {
    if (k.toLowerCase() === target) {
      const v = Number(prices[k]);
      return isFinite(v) && v > 0 ? v : 0;
    }
  }
  return 0;
}

export interface MetalRowInput {
  type: MetalType;
  karat?: number | string;
  purity?: number | string; // alternative to karat
  weight: number;           // grams
  payoutPercentage?: number;
}

export interface MetalRowResult {
  spotPerOunce: number;
  purityRatio: number;
  pricePerGram: number;          // pure-metal price per gram
  adjustedPricePerGram: number;  // after purity
  marketValue: number;           // intrinsic metal value (no payout %)
  payoutPercent: number;
  payoutAmount: number;          // final offer for this row
}

/** Compute one metal row's value. Internal precision is full float; round only for display. */
export function computeMetalRow(
  row: MetalRowInput,
  prices: SpotPrices | undefined,
  rateDefaults: Record<string, number> | undefined,
  globalPayoutPercent: number
): MetalRowResult {
  const spot = getSpotPerOunce(row.type, prices);
  const purity = getPurityRatio(row.type, row.karat ?? row.purity);
  const weight = Number(row.weight) || 0;

  const pricePerGram = spot > 0 ? spot / TROY_OUNCE_GRAMS : 0;
  const adjustedPricePerGram = pricePerGram * purity;
  const marketValue = adjustedPricePerGram * weight;

  const payoutPercent = resolvePayoutPercent(row.type, row.payoutPercentage, rateDefaults, globalPayoutPercent);
  const payoutAmount = marketValue * (payoutPercent / 100);

  return {
    spotPerOunce: spot,
    purityRatio: purity,
    pricePerGram,
    adjustedPricePerGram,
    marketValue,
    payoutPercent,
    payoutAmount,
  };
}

/** Round currency to 2 decimals, only at display/persist boundary. */
export function roundCurrency(n: number): number {
  if (!isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}
