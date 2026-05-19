## Goal
Display all dollar amounts with thousands separators (e.g. `$1,500.00` instead of `$1500.00`) across the entire CRM. No visual/layout changes.

## Approach
Add a single shared helper and replace every inline `` `$${x.toFixed(2)}` `` pattern with it. Places already using `Intl.NumberFormat` (Inventory, Payouts, Customer Drawer, Dashboards) are already correct and won't be touched.

## Changes

**1. New helper** in `src/lib/utils.ts`:
```ts
export const formatUSD = (n: number, decimals = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n) || 0);
```

**2. Replace `$${...toFixed(2)}` usages** with `formatUSD(...)` in:
- `components/store/SummaryFooter.tsx` (Market / Payout / Profit totals)
- `components/store/TakeInBalanced.tsx` (~13 occurrences: category subtotals, per-item payouts, per-metal payouts, footer totals)
- `components/store/TakeInPage.tsx` (complete-purchase confirmation)
- `components/store/TakeInSlim.tsx` (totals + per-metal payouts)
- `components/store/MetalPriceTicker.tsx` (spot price display)
- `components/admin/MetalApiKeysSettings.tsx` (spot price display)
- `components/dashboard/OwnerDashboard.tsx` line 151 (`$${price.toFixed(2)}`)

**3. Leave untouched** (correct or non-currency):
- All `Intl.NumberFormat` call sites already format with commas.
- Chart axis tickers like `$${(v/1000).toFixed(0)}k` (intentionally compact).
- Percentages, grams, and other non-dollar `toFixed` usages.

## Verification
- Open Take-In with totals > $1,000 → footer + per-item + per-metal show `$1,234.56`.
- Confirm Metal Price Ticker shows `$2,150.25`.
- Confirm Complete Purchase dialog uses comma format.
- Confirm Owner Dashboard spot prices show commas.
- No layout/styling change.
