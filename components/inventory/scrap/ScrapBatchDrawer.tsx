import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatUSD } from '@/lib/utils';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { computeBatchTotals } from './scrapCalc';
import { MetalSummaryPanel } from './MetalSummaryPanel';
import { RefinerFormDialog } from './RefinerFormDialog';
import { ClosedBatchSummary } from './ClosedBatchSummary';
import {
  SCRAP_STATUS_LABELS, displayStatus, formatPurity,
  type ScrapBatchRecord, type ScrapBatchItemRecord, type AssayData,
  type SettlementMethod, type ScrapBatchActivityRecord, type RefinerRecord,
} from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { supabase } from '@/integrations/supabase/client';
import type { SpotPrices } from '@/lib/pricing';
import { toast } from 'sonner';
import { Trash2, Plus, ChevronDown, ChevronUp, Sparkles, Upload, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  batch: ScrapBatchRecord | null;
  batchItems: ScrapBatchItemRecord[];
  allInventory: InventoryItemRecord[];
  refiners: RefinerRecord[];
  onUpdateBatch: (batchId: string, patch: Partial<ScrapBatchRecord>) => Promise<boolean>;
  onUpdateItem: (itemId: string, patch: Partial<ScrapBatchItemRecord>) => Promise<boolean>;
  onRemoveItem: (itemId: string) => Promise<boolean>;
  onFinalize: (
    batchId: string,
    header: Partial<ScrapBatchRecord>,
    estimates: { gross: number; fee: number; net: number },
    inventoryItemIds: string[],
  ) => Promise<boolean>;
  onRecordAssay: (batchId: string, assay: AssayData, fee: number, lossNotes: string, refinerRef: string, finalAmount: number, spotPrices?: { gold: number; silver: number; platinum: number; palladium: number }) => Promise<boolean>;
  onRecordSettlement: (batchId: string, method: SettlementMethod, cash: { amount: number; method: string; reference: string } | null) => Promise<boolean>;
  onAddReturnedMetal: (batchId: string, info: any) => Promise<boolean>;
  onCloseBatch: (batchId: string) => Promise<boolean>;
  onDeleteDraft: (batchId: string) => Promise<boolean>;
  onSaveRefiner: (input: Partial<RefinerRecord> & { name: string }) => Promise<string | null>;
  loadActivity: (batchId: string) => Promise<ScrapBatchActivityRecord[]>;
  livePrices?: SpotPrices;
}

type TabId = 'items' | 'shipping' | 'summary' | 'assay' | 'settlement';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'items', label: '1. Items', hint: 'Review what you’re sending.' },
  { id: 'shipping', label: '2. Shipping', hint: 'Choose a refiner and finalize the send-out.' },
  { id: 'summary', label: '3. Summary', hint: 'Estimated metal totals.' },
  { id: 'assay', label: '4. Assay', hint: 'Record the refiner’s results.' },
  { id: 'settlement', label: '5. Settlement', hint: 'Record cash, returned metal, or both.' },
];

export function ScrapBatchDrawer(props: Props) {
  const { open, onClose, batch, batchItems, allInventory } = props;
  const [tab, setTab] = useState<TabId>('items');
  const [showHistory, setShowHistory] = useState(false);
  const [activity, setActivity] = useState<ScrapBatchActivityRecord[]>([]);
  const livePrices = useMetalPrices();
  const prices = props.livePrices || livePrices;

  // Reset tab when the open batch changes, defaulting to "summary" for closed batches.
  useEffect(() => {
    if (!batch) return;
    setTab(displayStatus(batch.status) === 'closed' ? 'summary' : 'items');
    setShowHistory(false);
  }, [batch?.id]);

  useEffect(() => {
    if (batch && showHistory) props.loadActivity(batch.id).then(setActivity);
  }, [batch, showHistory]);

  const linkedItems = useMemo(() =>
    batchItems.map(bi => ({ bi, inv: allInventory.find(i => i.id === bi.inventory_item_id) }))
  , [batchItems, allInventory]);

  const totals = useMemo(() => {
    const invItems = linkedItems.map(li => li.inv).filter((x): x is InventoryItemRecord => !!x);
    const overrides = linkedItems.flatMap(li => li.inv ? [{ itemId: li.inv.id, metalIndex: 0, sendOutWeight: li.bi.send_out_weight }] : []);
    return computeBatchTotals(invItems, prices, undefined, overrides);
  }, [linkedItems, prices]);

  if (!batch) return null;
  const isDraft = batch.status === 'draft';
  const isClosed = displayStatus(batch.status) === 'closed';
  const currentTab = TABS.find(t => t.id === tab)!;

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="overflow-y-auto p-6 bg-white/85 backdrop-blur-2xl w-full sm:max-w-[680px]">
        <SheetHeader className="text-left space-y-2 pb-4 border-b border-black/[0.06]">
          <SheetTitle className="text-[20px] font-semibold text-[#2B2833] tracking-tight">
            {batch.batch_number}
          </SheetTitle>
          <div className="flex items-center gap-2 text-[12px] text-[#76707F]">
            <StatusBadge status={batch.status} />
            <span>·</span>
            <span>{new Date(batch.created_at).toLocaleString()}</span>
            {batch.refiner_name && <><span>·</span><span>{batch.refiner_name}</span></>}
          </div>
        </SheetHeader>

        <div className="flex gap-1 mt-4 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                tab === t.id ? 'bg-[#2B2833] text-white' : 'text-[#76707F] hover:bg-black/[0.04]'
              }`}
            >{t.label}</button>
          ))}
        </div>
        <p className="text-[12px] text-[#76707F] mt-2">{currentTab.hint}</p>

        <div className="mt-4 space-y-4">
          {tab === 'items' && <ItemsTab linkedItems={linkedItems} isDraft={isDraft} onUpdateItem={props.onUpdateItem} onRemoveItem={props.onRemoveItem} />}
          {tab === 'shipping' && (
            <ShippingTab
              batch={batch} isDraft={isDraft} isClosed={isClosed}
              refiners={props.refiners}
              onUpdate={props.onUpdateBatch}
              onSaveRefiner={props.onSaveRefiner}
              onDelete={() => props.onDeleteDraft(batch.id)}
              onFinalize={(patch) => {
                const invIds = linkedItems.map(li => li.inv?.id).filter((x): x is string => !!x);
                return props.onFinalize(batch.id, patch, { gross: totals.estimatedValue, fee: 0, net: totals.estimatedValue }, invIds);
              }}
              hasItems={linkedItems.length > 0}
            />
          )}
          {tab === 'summary' && (
            isClosed
              ? <ClosedBatchSummary batch={batch} linkedItems={linkedItems} totals={totals} />
              : <MetalSummaryPanel totals={totals} feePercent={0} />
          )}
          {tab === 'assay' && <AssayTab batch={batch} onRecord={props.onRecordAssay} disabled={batch.status === 'draft' || isClosed} livePrices={prices} />}
          {tab === 'settlement' && (
            <SettlementTab
              batch={batch}
              onRecord={props.onRecordSettlement}
              onAddReturnedMetal={props.onAddReturnedMetal}
              onClose={props.onCloseBatch}
              disabled={batch.status === 'draft' || isClosed}
            />
          )}
        </div>

        {/* History accordion */}
        <div className="mt-6 border-t border-black/[0.06] pt-3">
          <button
            onClick={() => setShowHistory(s => !s)}
            className="flex items-center justify-between w-full text-[12px] font-medium text-[#76707F] hover:text-[#2B2833]"
          >
            <span>History</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1.5">
              {activity.length === 0 ? (
                <div className="text-[12px] text-[#A8A3AE] py-2">No activity yet.</div>
              ) : activity.map(a => (
                <div key={a.id} className="text-[12px] flex items-center justify-between gap-3 py-1">
                  <span className="text-[#2B2833]">{a.event_type.replace(/_/g, ' ')}</span>
                  <span className="text-[#A8A3AE] text-[11px]">{new Date(a.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: ScrapBatchRecord['status'] }) {
  const d = displayStatus(status);
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    assay_received: 'bg-indigo-100 text-indigo-800',
    closed: 'bg-emerald-100 text-emerald-800',
  };
  return <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${colors[d]}`}>{SCRAP_STATUS_LABELS[status]}</span>;
}

// --- Items tab ---
function ItemsTab({ linkedItems, isDraft, onUpdateItem, onRemoveItem }: {
  linkedItems: { bi: ScrapBatchItemRecord; inv?: InventoryItemRecord }[];
  isDraft: boolean;
  onUpdateItem: (id: string, patch: Partial<ScrapBatchItemRecord>) => Promise<boolean>;
  onRemoveItem: (id: string) => Promise<boolean>;
}) {
  return (
    <div className="space-y-2">
      {linkedItems.length === 0 && (
        <div className="rounded-[10px] border border-dashed border-black/[0.08] p-6 text-center text-[13px] text-[#76707F]">
          No items in this batch.
        </div>
      )}
      {linkedItems.map(({ bi, inv }) => (
        <div key={bi.id} className="rounded-[10px] border border-black/[0.06] bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[#2B2833] truncate">
                {inv?.description || `${inv?.category || ''} ${inv?.subcategory || ''}`}
              </div>
              <div className="text-[11px] text-[#76707F] mt-0.5">
                {bi.metal} {bi.purity} · est. {formatUSD(bi.estimated_value)} · original {bi.original_weight}g
              </div>
            </div>
            {isDraft && (
              <button onClick={() => onRemoveItem(bi.id)} className="p-1.5 rounded-[6px] hover:bg-red-50 text-red-600" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-black/[0.04]">
            <label className="text-[11px] text-[#76707F] uppercase tracking-wider">Send-out weight (g)</label>
            <input
              type="number"
              step="0.01"
              disabled={!isDraft}
              defaultValue={bi.send_out_weight}
              onBlur={e => {
                const v = Number(e.target.value);
                if (v !== bi.send_out_weight) onUpdateItem(bi.id, { send_out_weight: v });
              }}
              className="h-8 w-24 rounded-[6px] border border-black/[0.08] bg-white px-2 text-[13px] disabled:opacity-60 text-right"
              style={{ MozAppearance: 'textfield' } as any}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Shipping tab ---
function ShippingTab({ batch, isDraft, isClosed, refiners, onUpdate, onSaveRefiner, onDelete, onFinalize, hasItems }: {
  batch: ScrapBatchRecord;
  isDraft: boolean;
  isClosed: boolean;
  refiners: RefinerRecord[];
  onUpdate: (id: string, patch: Partial<ScrapBatchRecord>) => Promise<boolean>;
  onSaveRefiner: Props['onSaveRefiner'];
  onDelete: () => Promise<boolean>;
  onFinalize: (patch: Partial<ScrapBatchRecord>) => Promise<boolean>;
  hasItems: boolean;
}) {
  const [form, setForm] = useState({
    refiner_id: batch.refiner_id || '',
    refiner_name: batch.refiner_name,
    refiner_contact: batch.refiner_contact,
    refiner_phone: batch.refiner_phone || '',
    refiner_email: batch.refiner_email || '',
    refiner_address: batch.refiner_address || '',
    shipping_method: batch.shipping_method,
    tracking_number: batch.tracking_number,
    insurance_amount: batch.insurance_amount,
    notes: batch.notes,
  });
  const [showRefinerDialog, setShowRefinerDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lockMost = isClosed;

  const handleSelectRefiner = (id: string) => {
    if (id === '__add__') { setShowRefinerDialog(true); return; }
    const r = refiners.find(rr => rr.id === id);
    if (r) {
      setForm(f => ({
        ...f,
        refiner_id: r.id,
        refiner_name: r.name,
        refiner_contact: r.contact_person,
        refiner_phone: r.phone,
        refiner_email: r.email,
        refiner_address: r.address,
      }));
    } else {
      setForm(f => ({ ...f, refiner_id: '' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-black/[0.06] bg-white p-3 space-y-3">
        <div className="text-[12px] font-semibold text-[#2B2833]">Refiner</div>
        <div>
          <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Choose refiner</label>
          <div className="mt-1 flex gap-2">
            <select
              value={form.refiner_id}
              onChange={e => handleSelectRefiner(e.target.value)}
              disabled={lockMost}
              className="h-9 flex-1 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[13px]"
            >
              <option value="">— None / type manually —</option>
              {refiners.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              <option value="__add__">+ Add new refiner…</option>
            </select>
          </div>
        </div>
        <Input label="Refiner name" value={form.refiner_name} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_name: v, refiner_id: '' }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Contact person" value={form.refiner_contact} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_contact: v }))} />
          <Input label="Phone" value={form.refiner_phone} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_phone: v }))} />
        </div>
        <Input label="Email" value={form.refiner_email} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_email: v }))} />
        <TextArea label="Address" value={form.refiner_address} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_address: v }))} />
      </div>

      <div className="rounded-[10px] border border-black/[0.06] bg-white p-3 space-y-3">
        <div className="text-[12px] font-semibold text-[#2B2833]">Shipment</div>
        <p className="text-[11px] text-[#76707F]">Tracking is optional. You can add it later.</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Shipping method" value={form.shipping_method} disabled={lockMost} onChange={v => setForm(f => ({ ...f, shipping_method: v }))} placeholder="FedEx / UPS / Hand-delivered" />
          <Input label="Tracking number (optional)" value={form.tracking_number} disabled={lockMost} onChange={v => setForm(f => ({ ...f, tracking_number: v }))} />
        </div>
        <Input label="Insurance amount" type="number" value={String(form.insurance_amount)} disabled={lockMost} onChange={v => setForm(f => ({ ...f, insurance_amount: Number(v) || 0 }))} />
        <TextArea label="Notes" value={form.notes} disabled={lockMost} onChange={v => setForm(f => ({ ...f, notes: v }))} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div>
          {isDraft && (
            <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 rounded-[8px] text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete draft
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {!lockMost && (
            <button onClick={() => onUpdate(batch.id, form)} className="px-3 py-2 rounded-[8px] text-[13px] bg-white border border-black/[0.08] hover:bg-black/[0.02]">
              Save
            </button>
          )}
          {isDraft && (
            <button
              onClick={async () => { await onFinalize(form); }}
              disabled={!hasItems}
              className="px-4 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40"
            >
              Finalize send-out
            </button>
          )}
        </div>
      </div>

      <RefinerFormDialog
        open={showRefinerDialog}
        onClose={() => setShowRefinerDialog(false)}
        onSave={async (input) => {
          const id = await onSaveRefiner(input);
          if (id) {
            setForm(f => ({
              ...f,
              refiner_id: id,
              refiner_name: input.name,
              refiner_contact: input.contact_person || '',
              refiner_phone: input.phone || '',
              refiner_email: input.email || '',
              refiner_address: input.address || '',
            }));
          }
          return id;
        }}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-[14px] max-w-[400px] w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><AlertTriangle className="h-4 w-4" /></div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#2B2833]">Delete this draft?</h3>
                <p className="mt-1 text-[13px] text-[#76707F]">Items will return to Scrap Candidates.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-[8px] text-[13px] bg-white border border-black/[0.08]">Cancel</button>
              <button onClick={async () => { await onDelete(); setConfirmDelete(false); }} className="px-3 py-2 rounded-[8px] text-[13px] bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Assay tab ---
function AssayTab({ batch, onRecord, disabled, livePrices }: { batch: ScrapBatchRecord; onRecord: Props['onRecordAssay']; disabled: boolean; livePrices?: SpotPrices }) {
  const a = batch.assay_data || {};
  const [form, setForm] = useState({
    gold_recovered: a.gold_recovered || 0,
    silver_recovered: a.silver_recovered || 0,
    platinum_recovered: a.platinum_recovered || 0,
    palladium_recovered: a.palladium_recovered || 0,
    purity_breakdown: a.purity_breakdown || '',
    refiner_reference: batch.refiner_reference,
    refiner_fee_actual: batch.refiner_fee_actual,
    loss_notes: batch.loss_notes,
    final_settlement_amount: batch.final_settlement_amount,
  });
  const [extracting, setExtracting] = useState(false);
  const [extractedFlag, setExtractedFlag] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image (PNG/JPG). PDF support coming soon — try a photo of the report.');
      return;
    }
    setExtracting(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await (supabase as any).functions.invoke('ai-extract-assay', {
        body: { image_data_url: dataUrl },
      });
      if (error) throw error;
      const ex = data?.extracted || {};
      setForm(f => ({
        ...f,
        refiner_reference: ex.refiner_reference ?? f.refiner_reference,
        gold_recovered: ex.gold_recovered ?? f.gold_recovered,
        silver_recovered: ex.silver_recovered ?? f.silver_recovered,
        platinum_recovered: ex.platinum_recovered ?? f.platinum_recovered,
        palladium_recovered: ex.palladium_recovered ?? f.palladium_recovered,
        purity_breakdown: ex.purity_breakdown ?? f.purity_breakdown,
        refiner_fee_actual: ex.refiner_fee_actual ?? f.refiner_fee_actual,
        loss_notes: ex.loss_notes ?? f.loss_notes,
        final_settlement_amount: ex.final_settlement_amount ?? f.final_settlement_amount,
      }));
      setExtractedFlag(true);
      toast.success('Assay fields extracted. Please verify before saving.');
    } catch (e: any) {
      toast.error(`AI extraction failed: ${e?.message || e}`);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-dashed border-black/[0.12] bg-[#FAF8F2] p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-[10px] bg-white border border-black/[0.06] flex items-center justify-center"><Sparkles className="h-4 w-4 text-[#2B2833]" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#2B2833]">Upload refiner report</div>
            <p className="text-[12px] text-[#76707F] mt-0.5">Upload a photo of the assay/settlement report and let AI fill in the fields. You can edit anything before saving.</p>
            <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium bg-[#2B2833] text-white hover:opacity-90 cursor-pointer">
              {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {extracting ? 'Extracting…' : 'Upload &amp; extract with AI'}
              <input type="file" accept="image/*" disabled={extracting || disabled} className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            {extractedFlag && (
              <p className="text-[11px] text-amber-700 mt-2">Please verify the AI-extracted values before saving.</p>
            )}
          </div>
        </div>
      </div>

      <Input label="Refiner reference #" value={form.refiner_reference} onChange={v => setForm(f => ({ ...f, refiner_reference: v }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Gold recovered (g)" type="number" value={String(form.gold_recovered)} onChange={v => setForm(f => ({ ...f, gold_recovered: Number(v) || 0 }))} />
        <Input label="Silver recovered (g)" type="number" value={String(form.silver_recovered)} onChange={v => setForm(f => ({ ...f, silver_recovered: Number(v) || 0 }))} />
        <Input label="Platinum recovered (g)" type="number" value={String(form.platinum_recovered)} onChange={v => setForm(f => ({ ...f, platinum_recovered: Number(v) || 0 }))} />
        <Input label="Palladium recovered (g)" type="number" value={String(form.palladium_recovered)} onChange={v => setForm(f => ({ ...f, palladium_recovered: Number(v) || 0 }))} />
      </div>
      <TextArea label="Purity breakdown" value={form.purity_breakdown} onChange={v => setForm(f => ({ ...f, purity_breakdown: v }))} />
      <Input label="Refiner fee / deduction" type="number" value={String(form.refiner_fee_actual)} onChange={v => setForm(f => ({ ...f, refiner_fee_actual: Number(v) || 0 }))} />
      <TextArea label="Stone / dust / loss notes" value={form.loss_notes} onChange={v => setForm(f => ({ ...f, loss_notes: v }))} />
      <Input label="Final settlement amount" type="number" value={String(form.final_settlement_amount)} onChange={v => setForm(f => ({ ...f, final_settlement_amount: Number(v) || 0 }))} />
      <div className="flex justify-end">
        <button
          disabled={disabled}
          onClick={() => onRecord(batch.id, {
            gold_recovered: form.gold_recovered, silver_recovered: form.silver_recovered,
            platinum_recovered: form.platinum_recovered, palladium_recovered: form.palladium_recovered,
            purity_breakdown: form.purity_breakdown,
          }, form.refiner_fee_actual, form.loss_notes, form.refiner_reference, form.final_settlement_amount)}
          className="px-4 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40"
        >
          Save assay
        </button>
      </div>
    </div>
  );
}

// --- Settlement tab (with returned metal built-in) ---
function SettlementTab({ batch, onRecord, onAddReturnedMetal, onClose, disabled }: {
  batch: ScrapBatchRecord;
  onRecord: Props['onRecordSettlement'];
  onAddReturnedMetal: Props['onAddReturnedMetal'];
  onClose: Props['onCloseBatch'];
  disabled: boolean;
}) {
  const [method, setMethod] = useState<SettlementMethod>(batch.settlement_method || 'cash');
  const [amount, setAmount] = useState(batch.cash_received);
  const [payMethod, setPayMethod] = useState(batch.cash_payment_method);
  const [ref, setRef] = useState(batch.cash_reference);
  const [metalForm, setMetalForm] = useState({
    subcategory: 'Gold Bar', metal: 'Gold', purity: '999', weight: 0, quantity: 1,
    cost_basis: 0, market_value: 0, location: 'safe', notes: '',
  });

  const showCash = method === 'cash' || method === 'partial';
  const showMetal = method === 'metal' || method === 'partial';

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#76707F]">Record whether you received cash, returned metal, or both.</p>

      <div>
        <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Settlement method</label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {([
            { id: 'cash', label: 'Cash out' },
            { id: 'metal', label: 'Metal return' },
            { id: 'partial', label: 'Cash + metal' },
          ] as { id: SettlementMethod; label: string }[]).map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`px-3 py-2 rounded-[8px] text-[12px] font-medium border ${method === m.id ? 'bg-[#2B2833] text-white border-[#2B2833]' : 'bg-white text-[#2B2833] border-black/[0.08]'}`}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {showCash && (
        <div className="rounded-[10px] border border-black/[0.06] bg-white p-3 space-y-3">
          <div className="text-[12px] font-semibold text-[#2B2833]">Cash received</div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount" type="number" value={String(amount)} onChange={v => setAmount(Number(v) || 0)} />
            <SelectField label="Payment method" value={payMethod} onChange={setPayMethod} options={['', 'Check', 'Wire', 'ACH', 'Cash', 'Other']} />
          </div>
          <Input label="Reference #" value={ref} onChange={setRef} />
        </div>
      )}

      {showMetal && (
        <div className="rounded-[10px] border border-black/[0.06] bg-white p-3 space-y-3">
          <div className="text-[12px] font-semibold text-[#2B2833]">Returned metal / product</div>
          <p className="text-[11px] text-[#76707F]">Enter what the refiner returned. It will be added to your inventory.</p>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Product type" value={metalForm.subcategory} onChange={v => setMetalForm(f => ({ ...f, subcategory: v }))}
              options={['Gold Bar', 'Silver Bar', 'Platinum Bar', 'Palladium Bar', 'Casting Grain', 'Shot / Grain', 'Bullion Coin', 'Other']} />
            <SelectField label="Metal" value={metalForm.metal} onChange={v => setMetalForm(f => ({ ...f, metal: v }))} options={['Gold', 'Silver', 'Platinum', 'Palladium']} />
            <Input label="Purity / karat" value={metalForm.purity} onChange={v => setMetalForm(f => ({ ...f, purity: v }))} />
            <Input label="Weight (g)" type="number" value={String(metalForm.weight)} onChange={v => setMetalForm(f => ({ ...f, weight: Number(v) || 0 }))} />
            <Input label="Quantity" type="number" value={String(metalForm.quantity)} onChange={v => setMetalForm(f => ({ ...f, quantity: Number(v) || 1 }))} />
            <Input label="Cost basis (each)" type="number" value={String(metalForm.cost_basis)} onChange={v => setMetalForm(f => ({ ...f, cost_basis: Number(v) || 0 }))} />
            <Input label="Market value (each)" type="number" value={String(metalForm.market_value)} onChange={v => setMetalForm(f => ({ ...f, market_value: Number(v) || 0 }))} />
            <Input label="Location" value={metalForm.location} onChange={v => setMetalForm(f => ({ ...f, location: v }))} />
          </div>
          <TextArea label="Notes" value={metalForm.notes} onChange={v => setMetalForm(f => ({ ...f, notes: v }))} />
          <div className="flex justify-end">
            <button
              disabled={disabled || !metalForm.weight}
              onClick={() => onAddReturnedMetal(batch.id, metalForm)}
              className="px-3 py-2 rounded-[8px] text-[13px] bg-white border border-black/[0.08] hover:bg-black/[0.02] flex items-center gap-1.5 disabled:opacity-40"
            ><Plus className="h-3.5 w-3.5" /> Add to inventory</button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          disabled={disabled}
          onClick={() => onRecord(batch.id, method, showCash ? { amount, method: payMethod, reference: ref } : null)}
          className="px-4 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40"
        >Record settlement</button>
        {batch.status === 'settled' && (
          <button onClick={() => onClose(batch.id)} className="px-4 py-2 rounded-[8px] text-[13px] bg-emerald-600 text-white hover:opacity-90">
            Close batch
          </button>
        )}
      </div>
    </div>
  );
}

// --- Reusable form atoms ---
function Input({ label, value, onChange, type = 'text', disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-[8px] border border-black/[0.08] bg-white px-3 text-[13px] disabled:opacity-60"
        style={type === 'number' ? ({ MozAppearance: 'textfield' } as any) : undefined}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-[8px] border border-black/[0.08] bg-white px-3 py-2 text-[13px] disabled:opacity-60"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 h-9 w-full rounded-[8px] border border-black/[0.08] bg-white px-3 text-[13px]">
        {options.map(o => <option key={o} value={o}>{o || '— select —'}</option>)}
      </select>
    </div>
  );
}
