

## Reorganize Silverware Item Specs (Take-In)

### Problem
When opening Item Specs for a Silverware item in Take-In, two issues appear:
1. **"Maker" duplicates** — the generic "General" section shows **Brand / Maker**, and the Silverware-specific section shows **Maker** again.
2. **"Size"** field in the General section is irrelevant for silverware (intended for ring sizes / chain lengths).

### Scope
- Only the **Silverware** category in Take-In Item Specs (`components/store/TakeInBalanced.tsx`).
- Apply the same cleanup to the **Add Inventory drawer** (`components/inventory/ItemSpecsForm.tsx`) so both intake paths stay consistent.
- No changes to Jewelry, Watch, Bullion, Stones, or LooseItems.
- No changes to data shape — `brand` and `size` fields stay in the model; we just stop rendering the duplicate inputs for Silverware.

### Changes

**1. Take-In — `components/store/TakeInBalanced.tsx` (General section, ~line 1144–1181)**

When `item.category === 'Silverware'`:
- Hide the **Brand / Maker** input (the Silverware section's "Maker" already covers it; keep that as the single source of truth).
- Replace **Size** with a more meaningful field for silverware: **Length (in)** — a short text input (e.g., "7in", "12in"), stored on the spec bag as `specs.length`. This is useful for individual flatware pieces and trays without forcing a unit.
- Keep **Condition** in the General section (still relevant).
- Result for Silverware: General row shows just **Condition** + **Length (in)** in a clean 2-column grid; the Silverware Details section retains Silver Type / Maker / Pattern / Piece Count etc.

**2. Add Inventory drawer — `components/inventory/ItemSpecsForm.tsx` (General section, ~line 244–281)**

Mirror the same logic:
- For Silverware, hide **Brand / Maker** (Maker lives in the Silverware Details section).
- Replace **Size** with **Length (in)** bound to `specs.length`.
- Keep Condition.

**3. No data migration needed.** Existing records with `brand` or `size` set on Silverware items remain intact — they just won't be edited via these two removed inputs. The Silverware "Maker" field already writes to `specs.maker`, which is the canonical place going forward.

### QA checklist
- Open Take-In → add Silverware item → expand Item Specs → confirm only one "Maker" field (in Silverware Details), no "Size" field, and a "Length (in)" field replaces it.
- Same check in Add Inventory drawer with Silverware category.
- Jewelry, Watch, Bullion, Stones, LooseItems intake screens unchanged.

