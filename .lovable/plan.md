## Problem

The search box at the top of **Send Out Scrap** only filters the **Scrap batches** grid. When you type something like `palladium` or an inventory ID, it shows "No batches match" even though there are matching items in the **Scrap candidates** table below. The candidates table has no search at all, so the box looks broken.

Also, the batch-side search only matches against `batch_number`, `refiner_name`, `tracking_number`, status label, and a few item fields — but it ignores item `description`, `category`, and `subcategory`, so searching by what's *in* a batch (e.g. "chain", "bar") often misses.

## Fix

Make one unified search that filters both sections at the same time, and broaden what it matches.

### 1. Reposition + relabel the search
- Move the search input out of the "Scrap batches" header into the page header row (just under the summary cards), so it visually applies to the whole view.
- Placeholder: `Search batches and candidates — ID, metal, purity, description, refiner, tracking…`
- Add a small `×` clear button inside the input when there's a query.

### 2. Filter Scrap candidates by the same query
Apply the query (case-insensitive) against each candidate's:
- `id` / `take_in_item_ref`
- `category`, `subcategory`
- `description`, `notes`
- every entry in `metals[]` (`type`/`metal` and `karat`/`purity`)
- numeric weight if the query is a pure number (match weight rounded to 1 decimal)

Combine with the existing `metalFilter` chip — both must pass.

### 3. Broaden Scrap batches search
In addition to today's fields, also match:
- batch item `description`, `category`, `subcategory` (joined from `allItems` via `inventory_item_id`)
- refiner contact (already covered via `refiner_name`, leave as-is)

### 4. Empty-state clarity
- Batches section: if query is set and zero matches → "No batches match **'palladium'**". If no query and zero batches → keep current copy.
- Candidates section: if query is set and zero matches → "No scrap candidates match **'palladium'**. Try clearing the search or filter."

### 5. Result counts
Show inline counts next to each section header when a query is active, e.g. `Scrap batches · 2 of 14` and `Scrap candidates · 7 of 40`.

## Technical notes

- All changes scoped to `components/inventory/scrap/SendOutScrapView.tsx`. No schema, hook, or other module changes.
- Reuse the existing `search` state; just consume it in the `filteredCandidates` memo alongside the `metalFilter` check.
- Build a `Map<string, InventoryItemRecord>` from `allItems` once per render to resolve `scrap.items[].inventory_item_id → description/category` for the batch search without N² scans.
- Keep current keyboard behavior (typing resets `visibleBatches` to the page size).
- No design-token or layout-style changes — keep the existing Bravo CRM card/input styling.

## Out of scope

- No changes to `useScrapBatches`, candidate drawer, or batch drawer.
- No new filter dimensions beyond what's listed above.
- No saved searches / URL sync.
