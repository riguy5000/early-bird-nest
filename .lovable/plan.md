

## Refine Loose Stones Take-In

### Scope
Only the **Stones** (Loose Stones) category in Take-In (`components/store/TakeInBalanced.tsx`). No changes to Jewelry, Watch, Bullion, Silverware, or LooseItems.

### Changes

**1. Inline collapsed row (lines ~461–540) — show stone identity, not metal**

Today the row shows: `[ct input] [Shape select] [Offer $] [payout]`. Replace **Shape** with **Stone Type** so the row reads as "Diamond · 1.25 ct · $offer" rather than a metal-looking pill.

- Replace the Shape `<Select>` with a **Stone Type** `<Select>` bound to `specs.stoneType` with options: Diamond, Sapphire, Ruby, Emerald, Opal, Topaz, Amethyst, Aquamarine, Tanzanite, Tourmaline, Garnet, Pearl, Other. Placeholder: "Stone".
- Keep the carat input + "ct" suffix exactly as-is (regex already allows `1.25`-style decimals — confirmed working: `/^\d*\.?\d{0,2}$/`).
- Keep Offer $, payout pill, CERT badge, Specs button, delete button.
- (Shape moves to / stays in the expanded "Stone Details" section where it already exists.)

**2. Specs panel — Stones cleanup**

Inside the expanded Specs for `category === 'Stones'`:

- **Hide the "General" section's Brand / Maker, Condition, and Size row entirely** for Stones (loose stones don't have a brand or ring size; "Condition" is irrelevant for a gem and "Measurements" already lives in Stone Details for mm dimensions).
  - Implementation: wrap the entire General block (line 1144 `{/* A. GENERAL */}` … its closing div) in `{item.category !== 'Stones' && (...)}`.
- **Remove the "Included in offer" checkbox** at line 1037–1040 (the whole loose stone IS the offer, so this toggle is meaningless). Keep the "Mixed stone types" checkbox next to it.
- **Update Measurements placeholder** (line 996) from `"mm × mm × mm"` → `"e.g., 1mm or 1–3mm"` so it reads as the size guidance the user wants. The label stays "Measurements" (clearer than "Size") and accepts ranges like `1-3mm`.

**3. Carat decimal entry — verify, no code change needed**

The regex `/^\d*\.?\d{0,2}$/` on the inline carat input already accepts `1.25`. If the user is hitting a different field, the **Stone Details → Carat Weight** input (line ~397 area) is a plain `<Input>` with no restriction — also accepts decimals. No change required; the perceived bug is likely fixed once the row shows Stone Type instead of Shape (clearer context).

### What is NOT changing
- Data shape: `brand`, `size`, `condition`, `includedInOffer` fields stay in the model; we just don't render them for Stones.
- Other categories' rows and specs.
- Stone Details panel fields (color, clarity, cut, polish, symmetry, fluorescence, lab, report #, origin, treatment, quantity).

### QA checklist
1. Take-In → add a **Loose Stones** item → inline row shows: carat input + "ct" + **Stone Type** select (Diamond/etc.) + Offer $ + payout pill.
2. Type `1.25` in the carat field → accepts and displays correctly.
3. Open Specs → no Brand/Maker, no Condition, no Size field.
4. Stone Details panel: no "Included in offer" checkbox; Measurements placeholder reads `e.g., 1mm or 1–3mm` and accepts a range.
5. Jewelry, Watch, Bullion, Silverware, LooseItems intake rows and specs are unchanged.

