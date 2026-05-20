## Send Out Scrap Workflow

Add a new "Send Out Scrap" tab to Inventory that manages the full refining lifecycle: select scrap candidates → create batch → finalize send-out → record assay → settle as cash, metal return, or both.

### Database (new tables via migration)

**`scrap_batches`**
- `id`, `store_id`, `batch_number` (auto, e.g. `SB-0001`)
- `status`: `draft | sent | assay_received | settled | closed`
- `refiner_name`, `refiner_contact`, `shipping_method`, `tracking_number`, `insurance_amount`, `notes`
- `created_by` (employee_id), `sent_at`, `assay_received_at`, `settled_at`, `closed_at`
- `estimated_gross_value`, `estimated_fee`, `estimated_net_value`
- `assay_data` (jsonb) — actual recovered metals + purity breakdown
- `refiner_reference`, `refiner_fee_actual`, `loss_notes`, `final_settlement_amount`
- `settlement_method`: `cash | metal | partial`
- `cash_received`, `cash_payment_method`, `cash_reference`, `cash_received_at`
- `attachment_urls` (text[])
- timestamps

**`scrap_batch_items`** (junction)
- `id`, `batch_id`, `inventory_item_id`, `send_out_weight` (editable), `original_weight`, `metal`, `purity`, `estimated_value`, `notes`

**`scrap_batch_activity`** (audit log)
- `id`, `batch_id`, `event_type`, `details` (jsonb), `actor_id`, `created_at`

**`inventory_items` additions**
- `scrap_batch_id` (nullable uuid) — link to batch when added
- Extend `processing_status` usage to include `In Scrap Draft`, `Sent to Refiner`
- Extend `archive_reason` usage; reuse existing `is_archived` for finalized items

RLS: store members read/insert, owners manage — same pattern as other inventory tables.

### Frontend

**`components/InventoryModule.tsx`**
- Add `'sendout-scrap'` tab labeled "Send Out Scrap"
- New branch in `getTabItems` filters to scrap candidates not yet in a finalized batch
- Render `<SendOutScrapView>` for this tab instead of standard `InventoryItemTable`

**New `components/inventory/scrap/` directory**

1. `SendOutScrapView.tsx` — main panel:
   - Candidate items table with select checkboxes (columns per spec)
   - Sticky batch summary panel (counts, totals per metal, est. value, est. payout)
   - "Create Scrap Batch" CTA
   - "Existing Batches" section listing drafts + sent/settled batches with status badge

2. `ScrapBatchDrawer.tsx` — right-side drawer (reuses existing drawer pattern):
   - Header: batch ID, status, refiner, dates
   - Tabs/sections: Items · Shipping · Metal Summary · Assay/Settlement · Cash · Returned Metal · Activity
   - Editable send-out weights while `draft`
   - "Finalize Send-Out" button (validates tracking + refiner)

3. `MetalSummaryPanel.tsx` — grouped by metal + purity (10K/14K/18K/22K/24K, 925/999, Pt 900/950, Pd 950), gross/fee/net

4. `AssaySettlementForm.tsx` — actual recovered metals, fee, settlement amount, method radio (cash/metal/partial), file upload to existing `batch-photos` bucket

5. `ReturnedMetalForm.tsx` — adds bullion items back to inventory linked to the scrap batch (creates new `inventory_items` rows with `source = 'refiner-return'`, links via `notes` or new `parent_batch_id` reference)

6. `ScrapBatchList.tsx` — list/cards of all scrap batches with status filter

**Hook: `useScrapBatches.ts`**
- Fetch batches, items, activity log
- `createDraft`, `updateDraft`, `addItems`, `removeItems`, `updateWeights`
- `finalizeSendOut` — archives source items, sets `scrap_batch_id`, `processing_status = 'Sent to Refiner'`, `is_archived = true`, logs activity
- `recordAssay`, `recordCashSettlement`, `addReturnedMetal`, `closeBatch`, `cancelDraft` (releases items)

### Calculations
Reuse `src/lib/pricing.ts` and `useMetalPrices` hook. Formula already in memory: `(weight × purity / 31.1035) × spot`.

### Status / locking rules
- `draft`: fully editable, items not archived
- `sent`: items locked, archived, can edit tracking/notes, can add assay
- `assay_received`: can add settlement
- `settled` / `closed`: read-only except notes

### Currency formatting
Use existing `fmt()` / `formatCurrency` with thousand separators (already in `src/lib/utils.ts` per prior task).

### Out of scope
- No changes to take-in, payouts, customers, settings, dashboard
- No changes to existing inventory tabs other than adding the new one
- Settings > Refining tab deferred (optional per spec)

### Files
**New:** migration; `components/inventory/scrap/SendOutScrapView.tsx`, `ScrapBatchDrawer.tsx`, `ScrapBatchList.tsx`, `MetalSummaryPanel.tsx`, `AssaySettlementForm.tsx`, `ReturnedMetalForm.tsx`, `useScrapBatches.ts`, `scrapTypes.ts`, `scrapCalc.ts`
**Edited:** `components/InventoryModule.tsx` (add tab + branch), `components/inventory/types.ts` (extend status enums), `components/inventory/useInventoryData.ts` (exclude archived-scrap from active)
