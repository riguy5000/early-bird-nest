

# Persist Store Settings to Supabase + Wire Visibility Toggles

## Overview

Create a `store_settings` table in Supabase to persist all 9 tabs of settings. Then wire the visibility toggles so the Take-In page dynamically hides/shows profit, payout percentage, and market value based on the saved settings and current employee overrides.

## Database

### New table: `store_settings`

```sql
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL UNIQUE,
  general jsonb NOT NULL DEFAULT '{}',
  global_visibility jsonb NOT NULL DEFAULT '{}',
  intake_defaults jsonb NOT NULL DEFAULT '{}',
  payout_defaults jsonb NOT NULL DEFAULT '{}',
  rate_defaults jsonb NOT NULL DEFAULT '{}',
  customer_settings jsonb NOT NULL DEFAULT '{}',
  compliance_settings jsonb NOT NULL DEFAULT '{}',
  print_settings jsonb NOT NULL DEFAULT '{}',
  notification_settings jsonb NOT NULL DEFAULT '{}',
  appearance jsonb NOT NULL DEFAULT '{}',
  advanced jsonb NOT NULL DEFAULT '{}',
  employees jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to store_settings"
  ON public.store_settings FOR ALL
  TO public USING (true) WITH CHECK (true);
```

Each settings section is stored as a JSONB column matching the existing state shape in `StoreSettingsModule.tsx`. This avoids needing a column per toggle and makes adding new settings trivial.

### New table: `employee_visibility_overrides`

```sql
CREATE TABLE public.employee_visibility_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  employee_id text NOT NULL,
  hide_profit boolean DEFAULT false,
  hide_percentage_paid boolean DEFAULT false,
  hide_market_value boolean DEFAULT false,
  hide_total_payout_breakdown boolean DEFAULT false,
  UNIQUE(store_id, employee_id)
);

ALTER TABLE public.employee_visibility_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to employee_visibility_overrides"
  ON public.employee_visibility_overrides FOR ALL
  TO public USING (true) WITH CHECK (true);
```

## Code Changes

### 1. `StoreSettingsModule.tsx` — Save/Load from Supabase

- **On mount**: Query `store_settings` by `store_id`. If a row exists, populate all state variables (`general`, `globalVisibility`, `intakeDefaults`, etc.) from the JSONB columns. If no row exists, keep defaults.
- **handleSave**: Upsert the row into `store_settings` with all current state values. Also upsert any employee visibility overrides into `employee_visibility_overrides`.
- **handleReset**: Re-fetch from Supabase instead of just clearing the dirty flag.
- Use the existing `supabase` client from `@/integrations/supabase/client`.

### 2. New hook: `hooks/useStoreSettings.ts`

A shared React hook that loads settings for a given `store_id`:

```typescript
export function useStoreSettings(storeId: string) {
  // Fetches from store_settings table
  // Returns { settings, visibility, loading }
  // visibility = resolved visibility for current employee
}
```

This hook will be consumed by both `StoreSettingsModule` (for editing) and `TakeInPage` (for reading visibility rules).

### 3. `JewelryPawnApp.tsx` — Pass resolved settings down

- Use `useStoreSettings('store1')` at the app level.
- Pass the resolved `hideProfit`, `hidePayout` (payout percentage), and `hideMarketValue` flags into the `TakeInPage` store prop.
- When settings change in `StoreSettingsModule` and are saved, the hook re-fetches, and the Take-In page reflects changes.

### 4. `TakeInPage.tsx` — Consume visibility flags

- Already accepts `store.hideProfit` and `store.hidePayout`. Add `store.hideMarketValue`.
- Pass these flags down to `TakeInBalanced` and `SummaryFooter`.

### 5. `TakeInBalanced.tsx` — Conditionally hide fields

- Read `store.hideProfit`, `store.hidePayout`, `store.hideMarketValue` from props.
- Conditionally render: market value column, payout percentage inputs, profit display, based on these flags.
- If `hideMarketValue` is true, hide the "Market" column in each metal row.
- If `hidePayout` is true, hide the "%" input on each metal row.
- If `hideProfit` is true, hide profit in the summary sidebar.

### 6. `SummaryFooter.tsx` — Already wired

Already accepts `hideProfit` and `hidePayout` props. Will add `hideMarketValue` to also hide that line in the totals section.

## Data Flow

```text
Supabase (store_settings table)
        ↓
useStoreSettings hook (fetches + caches)
        ↓
JewelryPawnApp (resolves visibility for current employee)
        ↓
TakeInPage (receives store config with visibility flags)
        ↓
TakeInBalanced / SummaryFooter (conditionally renders fields)
```

## Files Changed

| File | Change |
|---|---|
| `supabase/migrations/` | New migration for `store_settings` and `employee_visibility_overrides` tables |
| `hooks/useStoreSettings.ts` | New shared hook for loading/caching settings |
| `StoreSettingsModule.tsx` | Wire save/load to Supabase via the hook |
| `JewelryPawnApp.tsx` | Use hook, pass resolved visibility to TakeInPage |
| `TakeInPage.tsx` | Add `hideMarketValue` to store prop interface |
| `TakeInBalanced.tsx` | Conditionally hide market value, payout %, profit columns |
| `SummaryFooter.tsx` | Add `hideMarketValue` prop support |

