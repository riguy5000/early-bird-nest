import React, { useMemo, useState } from 'react';
import { formatUSD } from '@/lib/utils';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useScrapBatches } from './useScrapBatches';
import { computeBatchTotals, primaryMetalForItem } from './scrapCalc';
import { ScrapBatchDrawer } from './ScrapBatchDrawer';
import { ScrapCandidateDrawer } from './ScrapCandidateDrawer';
import { SCRAP_STATUS_LABELS, formatPurity, type ScrapBatchRecord, type ScrapBatchStatus } from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { Send, FileText, Search, Trash2, AlertTriangle, Package, CheckCircle2, Clock, Truck } from 'lucide-react';

interface Props {
  storeId: string;
  employeeId?: string;
  allItems: InventoryItemRecord[];
}

type StatusFilter = 'all' | ScrapBatchStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent to Refiner' },
  { id: 'assay_received', label: 'Assay Received' },
  { id: 'settled', label: 'Settled' },
  { id: 'closed', label: 'Closed' },
];

export function SendOutScrapView({ storeId, employeeId, allItems }: Props) {
  const prices = useMetalPrices();
  const scrap = useScrapBatches(storeId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [confirmDelete, setConfirmDelete] = useState<ScrapBatchRecord | null>(null);

  const candidates = useMemo(() => allItems.filter(i =>
    i.disposition === 'Scrap Candidate' && !i.is_archived && !i.scrap_batch_id
  ), [allItems]);

  const draftItemIds = useMemo(() => {
    const draftBatchIds = new Set(scrap.batches.filter(b => b.status === 'draft').map(b => b.id));
    return new Set(scrap.items.filter(i => draftBatchIds.has(i.batch_id)).map(i => i.inventory_item_id));
  }, [scrap.batches, scrap.items]);

  const selectedItems = useMemo(() => candidates.filter(i => selectedIds.has(i.id)), [candidates, selectedIds]);
  const totals = useMemo(() => computeBatchTotals(selectedItems, prices), [selectedItems, prices]);

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scrap.batches.filter(b => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (!q) return true;
      const itemMatch = scrap.items.some(i =>
        i.batch_id === b.id && (i.inventory_item_id.toLowerCase().includes(q) || i.metal.toLowerCase().includes(q))
      );
      return (
        b.batch_number.toLowerCase().includes(q) ||
        b.refiner_name.toLowerCase().includes(q) ||
        b.tracking_number.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        itemMatch
      );
    });
  }, [scrap.batches, scrap.items, search, filter]);

  const summary = useMemo(() => {
    const acc = { draft: 0, sent: 0, settled: 0, totalValue: 0 };
    scrap.batches.forEach(b => {
      if (b.status === 'draft') acc.draft += 1;
      else if (b.status === 'sent' || b.status === 'assay_received') acc.sent += 1;
      else if (b.status === 'settled' || b.status === 'closed') acc.settled += 1;
      acc.totalValue += b.estimated_gross_value || 0;
    });
    return acc;
  }, [scrap.batches]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === candidates.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(candidates.map(c => c.id)));
  };

  const handleCreateBatch = async () => {
    if (selectedItems.length === 0) return;
    const id = await scrap.createDraft(selectedItems, employeeId);
    if (id) {
      setSelectedIds(new Set());
      setOpenBatchId(id);
    }
  };

  const openBatch = scrap.batches.find(b => b.id === openBatchId) || null;
  const openBatchItems = openBatch ? scrap.items.filter(i => i.batch_id === openBatch.id) : [];
  const previewItem = candidates.find(i => i.id === previewItemId) || null;

  return (
    <div className="p-5 space-y-5">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Clock className="h-4 w-4" />} label="Draft batches" value={String(summary.draft)} tint="amber" />
        <SummaryCard icon={<Truck className="h-4 w-4" />} label="In transit / awaiting assay" value={String(summary.sent)} tint="blue" />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Settled / closed" value={String(summary.settled)} tint="emerald" />
        <SummaryCard icon={<Package className="h-4 w-4" />} label="Total est. value" value={formatUSD(summary.totalValue)} tint="slate" />
      </div>

      {/* Batches section */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#2B2833]">Scrap batches</h3>
            <p className="text-[12px] text-[#76707F]">Track every batch you're sending to a refiner.</p>
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#76707F]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search batch, refiner, tracking…"
              className="h-9 w-[280px] pl-8 pr-3 rounded-[10px] border border-black/[0.08] bg-white text-[13px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {FILTERS.map(f => {
            const count = f.id === 'all' ? scrap.batches.length : scrap.batches.filter(b => b.status === f.id).length;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
                  active
                    ? 'bg-[#2B2833] text-white border-[#2B2833]'
                    : 'bg-white text-[#2B2833] border-black/[0.08] hover:bg-black/[0.02]'
                }`}
              >
                {f.label} <span className={active ? 'text-white/70' : 'text-[#76707F]'}>· {count}</span>
              </button>
            );
          })}
        </div>

        {filteredBatches.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-black/[0.08] bg-white p-6 text-center">
            <p className="text-[13px] text-[#76707F]">No batches match. Select scrap candidates below to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBatches.map(b => (
              <BatchCard
                key={b.id}
                batch={b}
                itemCount={scrap.items.filter(i => i.batch_id === b.id).length}
                onClick={() => setOpenBatchId(b.id)}
                onDelete={b.status === 'draft' ? () => setConfirmDelete(b) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Candidates section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#2B2833]">Scrap candidates</h3>
            <p className="text-[12px] text-[#76707F]">Click an item to inspect it, or select multiple to start a batch.</p>
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={handleCreateBatch}
              className="px-3 py-2 rounded-[10px] text-[13px] font-medium bg-[#2B2833] text-white hover:opacity-90 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Create scrap batch ({selectedItems.length})
            </button>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="rounded-[10px] bg-[#FAF8F2] border border-black/[0.06] p-3 mb-3 grid grid-cols-2 md:grid-cols-6 gap-3 text-[12px]">
            <Stat label="Selected" value={String(totals.itemCount)} />
            <Stat label="Gold" value={`${totals.goldGrams.toFixed(2)} g`} />
            <Stat label="Silver" value={`${totals.silverGrams.toFixed(2)} g`} />
            <Stat label="Platinum" value={`${totals.platinumGrams.toFixed(2)} g`} />
            <Stat label="Palladium" value={`${totals.palladiumGrams.toFixed(2)} g`} />
            <Stat label="Est. value" value={formatUSD(totals.estimatedValue)} />
          </div>
        )}

        <div className="rounded-[12px] border border-black/[0.06] bg-white overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wider text-[#76707F]">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input type="checkbox" checked={candidates.length > 0 && selectedIds.size === candidates.length} onChange={toggleAll} />
                </th>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Metal</th>
                <th className="px-3 py-2 text-left">Purity</th>
                <th className="px-3 py-2 text-right">Weight</th>
                <th className="px-3 py-2 text-right">Est. value</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {candidates.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-[13px] text-[#76707F]">
                  No scrap candidate items. Mark items as <b>Scrap Candidate</b> in Inventory to see them here.
                </td></tr>
              )}
              {candidates.map(item => {
                const p = primaryMetalForItem(item);
                const inDraft = draftItemIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-black/[0.02] cursor-pointer ${inDraft ? 'opacity-60' : ''}`}
                    onClick={() => setPreviewItemId(item.id)}
                  >
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggle(item.id)} disabled={inDraft} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#76707F]">{item.id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]">{item.description || item.subcategory}</td>
                    <td className="px-3 py-2">{p.metal || '—'}</td>
                    <td className="px-3 py-2">{formatPurity(p.metal, p.purity)}</td>
                    <td className="px-3 py-2 text-right">{p.weight ? `${p.weight}g` : '—'}</td>
                    <td className="px-3 py-2 text-right">{formatUSD(item.estimated_scrap_value || item.market_value_at_intake || 0)}</td>
                    <td className="px-3 py-2">
                      {inDraft
                        ? <span className="text-amber-700 text-[11px] font-medium">In draft batch</span>
                        : <span className="text-[#76707F] text-[12px]">{item.processing_status}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ScrapBatchDrawer
        open={!!openBatch}
        onClose={() => setOpenBatchId(null)}
        batch={openBatch}
        batchItems={openBatchItems}
        allInventory={allItems}
        refiners={scrap.refiners}
        onUpdateBatch={scrap.updateBatch}
        onUpdateItem={scrap.updateBatchItem}
        onRemoveItem={scrap.removeBatchItem}
        onFinalize={scrap.finalizeSendOut}
        onRecordAssay={scrap.recordAssay}
        onRecordSettlement={scrap.recordSettlement}
        onAddReturnedMetal={scrap.addReturnedMetal}
        onCloseBatch={scrap.closeBatch}
        onDeleteDraft={async (id) => { const ok = await scrap.deleteDraft(id); if (ok) setOpenBatchId(null); return ok; }}
        onSaveRefiner={scrap.saveRefiner}
        loadActivity={scrap.loadActivity}
      />

      <ScrapCandidateDrawer
        open={!!previewItem}
        onClose={() => setPreviewItemId(null)}
        item={previewItem}
        isSelected={previewItem ? selectedIds.has(previewItem.id) : false}
        inDraft={previewItem ? draftItemIds.has(previewItem.id) : false}
        onToggleSelect={toggle}
      />

      {confirmDelete && (
        <DeleteConfirmModal
          batch={confirmDelete}
          itemCount={scrap.items.filter(i => i.batch_id === confirmDelete.id).length}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await scrap.deleteDraft(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#76707F] uppercase tracking-wider">{label}</div>
      <div className="text-[14px] font-semibold text-[#2B2833]">{value}</div>
    </div>
  );
}

function SummaryCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: 'amber' | 'blue' | 'emerald' | 'slate' }) {
  const tints: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <div className="rounded-[12px] border border-black/[0.06] bg-white p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-[10px] border flex items-center justify-center ${tints[tint]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] text-[#76707F] uppercase tracking-wider">{label}</div>
        <div className="text-[16px] font-semibold text-[#2B2833] truncate">{value}</div>
      </div>
    </div>
  );
}

function BatchCard({ batch, itemCount, onClick, onDelete }: { batch: ScrapBatchRecord; itemCount: number; onClick: () => void; onDelete?: () => void }) {
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    assay_received: 'bg-indigo-100 text-indigo-800',
    settled: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-700',
  };
  return (
    <div className="text-left rounded-[12px] border border-black/[0.06] bg-white p-4 hover:shadow-md transition-all relative group">
      <button onClick={onClick} className="block w-full text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2B2833]">
            <FileText className="h-3.5 w-3.5" />
            {batch.batch_number}
          </div>
          <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${colors[batch.status]}`}>{SCRAP_STATUS_LABELS[batch.status]}</span>
        </div>
        <div className="text-[12px] text-[#2B2833]">{batch.refiner_name || <span className="text-[#76707F]">No refiner yet</span>}</div>
        <div className="text-[11px] text-[#76707F] mt-0.5">
          {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatUSD(batch.estimated_gross_value || 0)}
        </div>
        {batch.tracking_number && (
          <div className="text-[11px] text-[#76707F] mt-1 truncate">Tracking: {batch.tracking_number}</div>
        )}
        <div className="text-[10px] text-[#A8A3AE] mt-2">{new Date(batch.created_at).toLocaleDateString()}</div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[6px] text-red-600 hover:bg-red-50"
          title="Delete draft"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function DeleteConfirmModal({ batch, itemCount, onCancel, onConfirm }: { batch: ScrapBatchRecord; itemCount: number; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-[14px] max-w-[420px] w-full p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-[#2B2833]">Delete draft batch?</h3>
            <p className="mt-1 text-[13px] text-[#76707F]">
              Are you sure you want to delete <span className="font-medium text-[#2B2833]">{batch.batch_number}</span>?
              The {itemCount} item{itemCount !== 1 ? 's' : ''} will return to Scrap Candidates.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-3 py-2 rounded-[8px] text-[13px] text-[#2B2833] bg-white border border-black/[0.08] hover:bg-black/[0.02]">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-[8px] text-[13px] bg-red-600 text-white hover:opacity-90">Delete draft</button>
        </div>
      </div>
    </div>
  );
}
