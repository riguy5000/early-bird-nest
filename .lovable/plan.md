

## Move Additional Metal Rows Directly Under the Main Row

### Scope
`components/store/TakeInBalanced.tsx` only. No design, color, spacing, or styling changes. Pure reorder.

Applies to: **Jewelry, Silverware, Loose Items** (already grouped under the existing `item.category !== 'Watch'` guard — no logic change needed). Watch and Stones unaffected.

### Problem
When a user adds a 2nd/3rd metal via the `+` button, the extra metal rows currently render **below the subtype chips and AI/color notes**, visually separated from the primary metal row they belong to.

Current vertical order in the item card right-column:
1. Main row: `[Metal] [Karat] [Weight g] [$Price] [+] [Specs] [X]`
2. Subtype chips (Ring, Pendant, …)
3. AI / color notes
4. **Additional metal rows** ← lives here today

### Change
Move the "Additional metal rows" block so it renders **immediately under the main row**, before the chips, sharing the same stacked group:

New order:
1. Main row
2. **Additional metal rows** (only when count > 1)
3. Subtype chips
4. AI / color notes

### Implementation
In `components/store/TakeInBalanced.tsx`:

- **Cut** the JSX block at lines **714–779** (the comment `{/* Additional metal rows for jewelry — stacked below */}` and its `{item.category !== 'Watch' && (item.metals || []).length > 1 && (...)}` wrapper).
- **Paste** it directly after the main row's closing `</div>` at line **675**, before the `{/* Type pills row */}` block at line 677.
- No changes to the inner JSX, classes, handlers, or the `item.category !== 'Watch'` condition (which already includes Jewelry, Silverware, Loose Items, Bullion, Stones — and Stones already won't render rows because it has empty `metals`).
- Keep `mt-2 pl-11` spacing classes as-is so each additional row remains aligned under the main inputs (past the leading badge).

### What is NOT changing
- Watch precious-metal rows block (lines 781–811) stays where it is.
- No styling, sizing, or color changes.
- No data model changes.
- Subtype chips and AI notes remain in their current positions, just now appear after the additional metal rows.

### QA checklist
1. Jewelry item → click `+` to add a 2nd metal → the 2nd metal row appears **directly below** the main metal row, above the subtype chips.
2. Silverware item → same behavior.
3. Loose Items item → same behavior.
4. With only 1 metal, no extra row renders (unchanged).
5. Watch item → unchanged.
6. Loose Stones item → still no metals UI (unchanged).
7. Subtype chips and AI/color notes still render correctly, just below the metals stack.

