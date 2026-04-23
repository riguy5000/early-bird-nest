

## Loose Stones — Replace "Metals" with "Carat", Confirm Decimal Carat Input

### Problem
1. New Stones items are auto-created with a default **Gold 14K** metal row, so the Specs panel renders an irrelevant **"Metals · Weight (g)"** table for loose stones.
2. The inline `ct` field already accepts `1.25`-style decimals (regex `/^\d*\.?\d{0,2}$/` confirmed in code), but the perceived bug is reinforced by the "Metals/grams" UI making the row look metal-shaped. Once the Stones row stops showing metal language, decimal entry will read correctly.
3. The user wants the Specs panel to show a **Carat** table for Stones with: stone label · **Weight (ct)** · payout · total — instead of the Metals table.

### Scope
Only the **Stones** category in Take-In. Files:
- `components/store/TakeInPage.tsx` — item creation
- `components/store/TakeInBalanced.tsx` — Specs panel rendering

No changes to Jewelry, Watch, Bullion, Silverware, LooseItems. No data shape changes.

### Changes

**1. `components/store/TakeInPage.tsx` (line 160–175) — don't seed a Gold metal for Stones**

Update `addNewItem` so the default `metals` array is **empty when `category === 'Stones'`** and only seeded with the Gold/14K placeholder for other categories:

```ts
metals: category === 'Stones'
  ? []
  : [{ id: `metal_${Date.now()}`, type: 'Gold', karat: 14, weight: 0 }],
```

This single change makes the existing Specs-panel guard `(item.metals || []).length > 0` (line 1436) naturally hide the Metals section for Stones — no metal, no table.

**2. `components/store/TakeInBalanced.tsx` (lines 1435–1466) — render a "Carat" table for Stones**

Replace the lone `{(item.metals || []).length > 0 && (...)}` Metals block with a category-aware branch:

- **If `item.category === 'Stones'`**: render a **Carat** table with columns `Stone | Weight (ct) | Payout` and a "Total Carat Value" footer.
  - Stone column: `{getSpec(item, 'stoneType', 'Stone')}` (e.g., "Diamond")
  - Weight column: `{getSpec(item, 'caratWeight', 0).toFixed(2)} ct`
  - Payout column: `${(item.payoutAmount || 0).toFixed(2)}`
  - Footer total: `${(item.payoutAmount || 0).toFixed(2)}` labeled "Total Carat Value"
  - Helper text below: "Edit carat weight and offer from the row above."
- **Else if `(item.metals || []).length > 0`**: keep the existing Metals table exactly as today (Jewelry, Watch precious, Bullion, etc.).

Section header reads **"Carat"** for Stones and **"Metals"** for everything else. The container/styling matches the existing Metals card (rounded-[12px], white bg, same header bar, same footer band) so nothing visually shifts elsewhere.

**3. Inline `ct` field — verify, no code change**

The collapsed-row carat input (lines 464–479) already uses `inputMode="decimal"` + `/^\d*\.?\d{0,2}$/`. The Stone Details "Carat Wt" sub-stone input (line 1347) is a plain unrestricted `<Input>` — also accepts `1.25`. No regex change needed; once "Metals/grams" is gone the dot will read correctly in context.

### What is NOT changing
- Jewelry / Watch / Bullion / Silverware / LooseItems creation and Specs.
- The Stones inline row UI (already correct: ct input, Stone Type, Offer, payout pill).
- Stone Details panel.
- Data model (`metals`, `stones`, `caratWeight`, `payoutAmount` all unchanged).

### QA checklist
1. Take-In → add a **Loose Stones** item → open Specs → no Metals table; instead a **Carat** table shows: Stone Type · Weight (ct) · Payout · Total Carat Value.
2. Type `1.25` in the inline `ct` field → accepts `1.25`, table reflects `1.25 ct`.
3. Set Offer to `120.50` → Carat table footer reads `$120.50` (Total Carat Value).
4. Add a **Jewelry** item → Specs still shows the original **Metals** table with grams (unchanged).
5. Add a **Bullion** / **Watch (precious)** item → Metals table unchanged.

