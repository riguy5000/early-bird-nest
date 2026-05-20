import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatUSD } from '@/lib/utils';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { computeBatchTotals } from './scrapCalc';
import { MetalSummaryPanel } from './MetalSummaryPanel';
import { SCRAP_STATUS_LABELS, type ScrapBatchRecord, type ScrapBatchItemRecord, type AssayData, type SettlementMethod, type ScrapBatchActivityRecord } from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  batch: ScrapBatchRecord | null;
  batchItems: ScrapBatchItemRecord[];
  allInventory: InventoryItemRecord[];
  onUpdateBatch: (batchId: string, patch: Partial<ScrapBatchRecord>) => Promise<boolean>;
  onUpdateItem: (itemId: string, patch: Partial<ScrapBatchItemRecord>) => Promise<boolean>;
  onRemoveItem: (itemId: string) => Promise<boolean>;
  onFinalize: (
    batchId: string,
    header: { refiner_name: string; tracking_number: string; shipping_method: string; refiner_contact?: string; insurance_amount?: number; notes?: string },
    estimates: { gross: number; fee: number; net: number },
    inventoryItemIds: string[],
  ) => Promise<boolean>;
  onRecordAssay: (batchId: string, assay: AssayData, fee: number, lossNotes: string, refinerRef: string, finalAmount: number) => Promise<boolean>;
  onRecordSettlement: (batchId: string, method: SettlementMethod, cash: { amount: number; method: string; reference: string } | null) => Promise<boolean>;
  onAddReturnedMetal: (batchId: string, info: any) => Promise<boolean>;
  onCloseBatch: (batchId: string) => Promise<boolean>;
  onCancelDraft: (batchId: string) => Promise<boolean>;
  loadActivity: (batchId: string) => Promise<ScrapBatchActivityRecord[]>;
}

type TabId = 'items' | 'shipping' | 'metals' | 'assay' | 'settlement' | 'returned' | 'activity';

export function ScrapBatchDrawer(props: Props) {
  const { open, onClose, batch, batchItems, allInventory } = props;
  const [tab, setTab] = useState<TabId>('items');
  const prices = useMetalPrices();
  const [activity, setActivity] = useState<ScrapBatchActivityRecord[]>([]);

  useEffect(() => {
    if (batch && tab === 'activity') {
      props.loadActivity(batch.id).then(setActivity);
    }
  }, [batch, tab]);

  if (!batch) return null;
  const isDraft = batch.status === 'draft';
  const isClosed = batch.status === 'closed';
  const linkedItems = useMemo(() =>
    batchItems.map(bi => ({ bi, inv: allInventory.find(i => i.id === bi.inventory_item_id) }))
  , [batchItems, allInventory]);

  const totals = useMemo(() => {
    const invItems = linkedItems.map(li => li.inv).filter((x): x is InventoryItemRecord => !!x);
    const overrides = linkedItems.flatMap(li => li.inv ? [{ itemId: li.inv.id, metalIndex: 0, sendOutWeight: li.bi.send_out_weight }] : []);
    return computeBatchTotals(invItems, prices, undefined, overrides);
  }, [linkedItems, prices]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'items', label: 'Items' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'metals', label: 'Metals' },
    { id: 'assay', label: 'Assay' },
    { id: 'settlement', label: 'Settlement' },
    { id: 'returned', label: 'Returned' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="overflow-y-auto p-6 bg-white/85 backdrop-blur-2xl w-full sm:max-w-[640px]">
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
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                tab === t.id ? 'bg-[#2B2833] text-white' : 'text-[#76707F] hover:bg-black/[0.04]'
              }`}
            >{t.label}</button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {tab === 'items' && <ItemsTab linkedItems={linkedItems} isDraft={isDraft} onUpdateItem={props.onUpdateItem} onRemoveItem={props.onRemoveItem} />}
          {tab === 'shipping' && <ShippingTab batch={batch} isDraft={isDraft} isClosed={isClosed} onUpdate={props.onUpdateBatch} onFinalize={() => {
            const invIds = linkedItems.map(li => li.inv?.id).filter((x): x is string => !!x);
            return props.onFinalize(batch.id, {
              refiner_name: batch.refiner_name,
              tracking_number: batch.tracking_number,
              shipping_method: batch.shipping_method,
              refiner_contact: batch.refiner_contact,
              insurance_amount: batch.insurance_amount,
              notes: batch.notes,
            }, { gross: totals.estimatedValue, fee: 0, net: totals.estimatedValue }, invIds);
          }} onCancel={() => props.onCancelDraft(batch.id)} />}
          {tab === 'metals' && <MetalSummaryPanel totals={totals} feePercent={0} />}
          {tab === 'assay' && <AssayTab batch={batch} onRecord={props.onRecordAssay} disabled={batch.status === 'draft' || batch.status === 'closed'} />}
          {tab === 'settlement' && <SettlementTab batch={batch} onRecord={props.onRecordSettlement} onClose={props.onCloseBatch} disabled={batch.status === 'draft' || batch.status === 'closed'} />}
          {tab === 'returned' && <ReturnedMetalTab batch={batch} onAdd={props.onAddReturnedMetal} disabled={batch.status === 'draft' || batch.status === 'closed'} />}
          {tab === 'activity' && <ActivityTab activity={activity} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: ScrapBatchRecord['status'] }) {
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    assay_received: 'bg-indigo-100 text-indigo-800',
    settled: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-700',
  };
  return <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${colors[status]}`}>{SCRAP_STATUS_LABELS[status]}</span>;
}

function ItemsTab({ linkedItems, isDraft, onUpdateItem, onRemoveItem }: {
  linkedItems: { bi: ScrapBatchItemRecord; inv?: InventoryItemRecord }[];
  isDraft: boolean;
  onUpdateItem: (id: string, patch: Partial<ScrapBatchItemRecord>) => Promise<boolean>;
  onRemoveItem: (id: string) => Promise<boolean>;
}) {
  return (
    <div className="rounded-[10px] border border-black/[0.06] divide-y divide-black/[0.04]">
      {linkedItems.length === 0 && <div className="p-6 text-center text-[13px] text-[#76707F]">No items in this batch</div>}
      {linkedItems.map(({ bi, inv }) => (
        <div key={bi.id} className="p-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-[#2B2833] truncate">
              {inv?.description || `${inv?.category || ''} ${inv?.subcategory || ''}`}
            </div>
            <div className="text-[11px] text-[#76707F] mt-0.5">
              {bi.metal} {bi.purity} · est. {formatUSD(bi.estimated_value)} · orig {bi.original_weight}g
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#76707F]">Send-out (g)</label>
            <input
              type="number"
              step="0.01"
              disabled={!isDraft}
              defaultValue={bi.send_out_weight}
              onBlur={e => {
                const v = Number(e.target.value);
                if (v !== bi.send_out_weight) onUpdateItem(bi.id, { send_out_weight: v });
              }}
              className="h-8 w-24 rounded-[6px] border border-black/[0.08] bg-white px-2 text-[13px] disabled:opacity-60"
              style={{ MozAppearance: 'textfield' } as any}
            />
            {isDraft && (
              <button onClick={() => onRemoveItem(bi.id)} className="p-1.5 rounded-[6px] hover:bg-red-50 text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShippingTab({ batch, isDraft, isClosed, onUpdate, onFinalize, onCancel }: {
  batch: ScrapBatchRecord;
  isDraft: boolean;
  isClosed: boolean;
  onUpdate: (id: string, patch: Partial<ScrapBatchRecord>) => Promise<boolean>;
  onFinalize: () => Promise<boolean>;
  onCancel: () => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    refiner_name: batch.refiner_name,
    refiner_contact: batch.refiner_contact,
    shipping_method: batch.shipping_method,
    tracking_number: batch.tracking_number,
    insurance_amount: batch.insurance_amount,
    notes: batch.notes,
  });
  const lockMost = isClosed;

  return (
    <div className="space-y-3">
      <Input label="Refiner Name" value={form.refiner_name} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_name: v }))} />
      <Input label="Refiner Contact" value={form.refiner_contact} disabled={lockMost} onChange={v => setForm(f => ({ ...f, refiner_contact: v }))} />
      <Input label="Shipping Method" value={form.shipping_method} disabled={lockMost} onChange={v => setForm(f => ({ ...f, shipping_method: v }))} />
      <Input label="Tracking Number" value={form.tracking_number} disabled={lockMost} onChange={v => setForm(f => ({ ...f, tracking_number: v }))} />
      <Input label="Insurance Amount" type="number" value={String(form.insurance_amount)} disabled={lockMost} onChange={v => setForm(f => ({ ...f, insurance_amount: Number(v) || 0 }))} />
      <TextArea label="Notes" value={form.notes} disabled={lockMost} onChange={v => setForm(f => ({ ...f, notes: v }))} />

      <div className="flex justify-end gap-2 pt-2">
        {isDraft && (
          <button onClick={() => onCancel()} className="px-3 py-2 rounded-[8px] text-[13px] text-red-600 hover:bg-red-50">
            Cancel Draft
          </button>
        )}
        {!lockMost && (
          <button onClick={() => onUpdate(batch.id, form)} className="px-3 py-2 rounded-[8px] text-[13px] bg-white border border-black/[0.08] hover:bg-black/[0.02]">
            Save
          </button>
        )}
        {isDraft && (
          <button onClick={async () => { await onUpdate(batch.id, form); await onFinalize(); }} className="px-3 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90">
            Finalize Send-Out
          </button>
        )}
      </div>
    </div>
  );
}

function AssayTab({ batch, onRecord, disabled }: { batch: ScrapBatchRecord; onRecord: Props['onRecordAssay']; disabled: boolean }) {
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
  return (
    <div className="space-y-3">
      <Input label="Refiner Reference #" value={form.refiner_reference} onChange={v => setForm(f => ({ ...f, refiner_reference: v }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Gold Recovered (g)" type="number" value={String(form.gold_recovered)} onChange={v => setForm(f => ({ ...f, gold_recovered: Number(v) || 0 }))} />
        <Input label="Silver Recovered (g)" type="number" value={String(form.silver_recovered)} onChange={v => setForm(f => ({ ...f, silver_recovered: Number(v) || 0 }))} />
        <Input label="Platinum Recovered (g)" type="number" value={String(form.platinum_recovered)} onChange={v => setForm(f => ({ ...f, platinum_recovered: Number(v) || 0 }))} />
        <Input label="Palladium Recovered (g)" type="number" value={String(form.palladium_recovered)} onChange={v => setForm(f => ({ ...f, palladium_recovered: Number(v) || 0 }))} />
      </div>
      <TextArea label="Purity Breakdown" value={form.purity_breakdown} onChange={v => setForm(f => ({ ...f, purity_breakdown: v }))} />
      <Input label="Refiner Fee / Deduction" type="number" value={String(form.refiner_fee_actual)} onChange={v => setForm(f => ({ ...f, refiner_fee_actual: Number(v) || 0 }))} />
      <TextArea label="Stone / Dust / Loss Notes" value={form.loss_notes} onChange={v => setForm(f => ({ ...f, loss_notes: v }))} />
      <Input label="Final Settlement Amount" type="number" value={String(form.final_settlement_amount)} onChange={v => setForm(f => ({ ...f, final_settlement_amount: Number(v) || 0 }))} />
      <div className="flex justify-end">
        <button
          disabled={disabled}
          onClick={() => onRecord(batch.id, {
            gold_recovered: form.gold_recovered, silver_recovered: form.silver_recovered,
            platinum_recovered: form.platinum_recovered, palladium_recovered: form.palladium_recovered,
            purity_breakdown: form.purity_breakdown,
          }, form.refiner_fee_actual, form.loss_notes, form.refiner_reference, form.final_settlement_amount)}
          className="px-3 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40"
        >
          Save Assay
        </button>
      </div>
    </div>
  );
}

function SettlementTab({ batch, onRecord, onClose, disabled }: { batch: ScrapBatchRecord; onRecord: Props['onRecordSettlement']; onClose: Props['onCloseBatch']; disabled: boolean }) {
  const [method, setMethod] = useState<SettlementMethod>(batch.settlement_method || 'cash');
  const [amount, setAmount] = useState(batch.cash_received);
  const [payMethod, setPayMethod] = useState(batch.cash_payment_method);
  const [ref, setRef] = useState(batch.cash_reference);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Settlement Method</label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {(['cash', 'metal', 'partial'] as SettlementMethod[]).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-2 rounded-[8px] text-[12px] font-medium border ${method === m ? 'bg-[#2B2833] text-white border-[#2B2833]' : 'bg-white text-[#2B2833] border-black/[0.08]'}`}
            >{m === 'cash' ? 'Cash Out' : m === 'metal' ? 'Metal Return' : 'Cash + Metal'}</button>
          ))}
        </div>
      </div>

      {(method === 'cash' || method === 'partial') && (
        <>
          <Input label="Cash Amount Received" type="number" value={String(amount)} onChange={v => setAmount(Number(v) || 0)} />
          <Input label="Payment Method" value={payMethod} onChange={setPayMethod} placeholder="Wire / Check / ACH" />
          <Input label="Payment Reference #" value={ref} onChange={setRef} />
        </>
      )}

      {method === 'metal' && (
        <div className="text-[12px] text-[#76707F] p-3 rounded-[8px] bg-black/[0.02]">
          Use the <b>Returned</b> tab to add the returned metal products to inventory.
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          disabled={disabled}
          onClick={() => onRecord(batch.id, method, (method === 'cash' || method === 'partial') ? { amount, method: payMethod, reference: ref } : null)}
          className="px-3 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40"
        >Record Settlement</button>
        {batch.status === 'settled' && (
          <button onClick={() => onClose(batch.id)} className="px-3 py-2 rounded-[8px] text-[13px] bg-emerald-600 text-white hover:opacity-90">
            Close Batch
          </button>
        )}
      </div>
    </div>
  );
}

function ReturnedMetalTab({ batch, onAdd, disabled }: { batch: ScrapBatchRecord; onAdd: Props['onAddReturnedMetal']; disabled: boolean }) {
  const [form, setForm] = useState({
    subcategory: 'Gold Bar', metal: 'Gold', purity: '999', weight: 0, quantity: 1,
    cost_basis: 0, market_value: 0, location: 'safe', notes: '',
  });
  return (
    <div className="space-y-3">
      <div className="text-[12px] text-[#76707F]">Add metal products received from refiner back into Inventory.</div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Product Type" value={form.subcategory} onChange={v => setForm(f => ({ ...f, subcategory: v }))}
          options={['Gold Bar', 'Silver Bar', 'Platinum Bar', 'Palladium Bar', 'Casting Grain', 'Shot / Grain', 'Bullion Coin', 'Other']} />
        <SelectField label="Metal" value={form.metal} onChange={v => setForm(f => ({ ...f, metal: v }))}
          options={['Gold', 'Silver', 'Platinum', 'Palladium']} />
        <Input label="Purity / Karat" value={form.purity} onChange={v => setForm(f => ({ ...f, purity: v }))} />
        <Input label="Weight (g)" type="number" value={String(form.weight)} onChange={v => setForm(f => ({ ...f, weight: Number(v) || 0 }))} />
        <Input label="Quantity" type="number" value={String(form.quantity)} onChange={v => setForm(f => ({ ...f, quantity: Number(v) || 1 }))} />
        <Input label="Cost Basis (each)" type="number" value={String(form.cost_basis)} onChange={v => setForm(f => ({ ...f, cost_basis: Number(v) || 0 }))} />
        <Input label="Market Value (each)" type="number" value={String(form.market_value)} onChange={v => setForm(f => ({ ...f, market_value: Number(v) || 0 }))} />
        <Input label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
      </div>
      <TextArea label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
      <div className="flex justify-end">
        <button
          disabled={disabled}
          onClick={() => onAdd(batch.id, form)}
          className="px-3 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
        ><Plus className="h-3.5 w-3.5" /> Add to Inventory</button>
      </div>
    </div>
  );
}

function ActivityTab({ activity }: { activity: ScrapBatchActivityRecord[] }) {
  if (activity.length === 0) return <div className="text-[13px] text-[#76707F] p-4 text-center">No activity yet</div>;
  return (
    <div className="space-y-2">
      {activity.map(a => (
        <div key={a.id} className="rounded-[8px] border border-black/[0.06] bg-white p-3">
          <div className="flex justify-between items-center">
            <div className="text-[13px] font-medium text-[#2B2833]">{a.event_type.replace(/_/g, ' ')}</div>
            <div className="text-[11px] text-[#76707F]">{new Date(a.created_at).toLocaleString()}</div>
          </div>
          {Object.keys(a.details || {}).length > 0 && (
            <pre className="text-[11px] text-[#76707F] mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(a.details, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
