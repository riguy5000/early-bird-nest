## Goal

Reset the currently logged-in store to a clean slate, then seed 150 realistic inventory items with mixed metals and karats so you can stress-test Inventory and Send Out Scrap.

## Scope

- **Current store only** (scoped by `store_id` — other stores untouched).
- **No schema changes.** Pure data wipe + insert via the DB insert tool.
- **No code changes.**

## Step 1 — Wipe (current store)

Delete in dependency order so nothing orphans:

1. `scrap_batch_activity` where batch belongs to store
2. `scrap_batch_items` where batch belongs to store
3. `scrap_batches` where `store_id = <current>`
4. `inventory_status_history` where item belongs to store
5. `inventory_items` where `store_id = <current>`
6. `inventory_batches` where `store_id = <current>`
7. `refinery_lots` where `store_id = <current>`
8. `refiners` where `store_id = <current>`
9. `customers` where `store_id = <current>`

Platform settings, store settings, employees, and auth are preserved.

## Step 2 — Seed 150 inventory items

One synthetic `inventory_batches` row (source `manual`, note "Seed data"), then 150 `inventory_items` linked to it.

**Mix:**
- Categories: ~70% Jewelry, ~20% Bullion, ~10% Watches
- Metals (random per item, sometimes 2 metals on one item):
  - Gold: 10K, 14K, 18K, 22K, 24K
  - Silver: 925, 999
  - Platinum: 950
  - Palladium: 950
- Weight: random 1.5g – 85g
- Disposition: ~60% Undecided, ~25% Scrap Candidate, ~10% Showroom Candidate, ~5% Investment Candidate
- Location: mostly `safe`, some `showroom`
- Cost basis + estimated values computed from a reasonable % of spot
- Descriptions like "14K Yellow Gold Chain", "925 Silver Bracelet", "1oz Gold Bar", etc.

This guarantees the Scrap Candidate list, metal/purity filter chips, and live "Selected to send" summary all have real data to play with.

## Confirmation needed

This is destructive. Approving the plan = approving the wipe. After approval I'll switch to build mode and execute the deletes + inserts in one shot, then confirm row counts.
