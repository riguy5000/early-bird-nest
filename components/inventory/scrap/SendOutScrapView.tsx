import React, { useMemo, useState } from 'react';
import { formatUSD } from '@/lib/utils';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useScrapBatches } from './useScrapBatches';
import { computeBatchTotals, primaryMetalForItem } from './scrapCalc';
import { ScrapBatchDrawer } from './ScrapBatchDrawer';
import { SCRAP_STATUS_LABELS, type ScrapBatchRecord } from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { Send, FileText } from 'lucide-react';

interface Props {
  storeId: string;
  employeeId?: string;
  allItems: InventoryItemRecord[];
}

export function SendOutScrapView({ storeId, employeeId, allItems }: Props) {
  const prices = useMetalPrices();
  const scrap = useScrapBatches(storeId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);

  // Scrap candidates that are NOT yet finalized into a batch.
  // Draft items still appear here so user can see them; finalized (archived) items don't.
  const candidates = useMemo(() => allItems.filter(i =>
    i.disposition === 'Scrap Candidate' && !i.is_archived && !i.scrap_batch_id
  ), [allItems]);

  // Items currently in draft batches (still in inventory, flagged in UI)
  const draftItemIds = useMemo(() => {
    const draftBatchIds = new Set(scrap.batches.filter(b => b.status === 'draft').map(b => b.id));
    return new Set(scrap.items.filter(i => draftBatchIds.has(i.batch_id)).map(i => i.inventory_item_id));
  }, [scrap.batches, scrap.items]);

  const selectedItems = useMemo(() => candidates.filter(i => selectedIds.has(i.id)), [candidates, selectedIds]);
  const totals = useMemo(() => computeBatchTotals(selectedItems, prices), [selectedItems, prices]);

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

  return (
    <div className="p-5 space-y-5">
      {/* Existing batches */}
      {scrap.batches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-semibold text-[#2B2833]">Scrap Batches</h3>
            <span className="text-[12px] text-[#76707F]">{scrap.batches.length} total</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scrap.batches.map(b => (
              <BatchCard key={b.id} batch={b} itemCount={scrap.items.filter(i => i.batch_id === b.id).length} onClick={() => setOpenBatchId(b.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Candidates section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[14px] font-semibold text-[#2B2833]">Scrap Candidates</h3>
            <p className="text-[12px] text-[#76707F]">Items marked as Scrap Candidate, ready to be refined.</p>
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={handleCreateBatch}
              className="px-3 py-2 rounded-[8px] text-[13px] font-medium bg-[#2B2833] text-white hover:opacity-90 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Create Scrap Batch ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Selection summary */}
        {selectedItems.length > 0 && (
          <div className="rounded-[10px] bg-black/[0.02] border border-black/[0.06] p-3 mb-3 grid grid-cols-2 md:grid-cols-6 gap-3 text-[12px]">
            <Stat label="Selected" value={String(totals.itemCount)} />
            <Stat label="Gold (g)" value={totals.goldGrams.toFixed(2)} />
            <Stat label="Silver (g)" value={totals.silverGrams.toFixed(2)} />
            <Stat label="Platinum (g)" value={totals.platinumGrams.toFixed(2)} />
            <Stat label="Palladium (g)" value={totals.palladiumGrams.toFixed(2)} />
            <Stat label="Est. Value" value={formatUSD(totals.estimatedValue)} />
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
                <th className="px-3 py-2 text-left">Karat</th>
                <th className="px-3 py-2 text-right">Weight</th>
                <th className="px-3 py-2 text-right">Est. Value</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {candidates.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-[13px] text-[#76707F]">
                  No scrap candidate items. Mark items as <b>Scrap Candidate</b> in Inventory to send them here.
                </td></tr>
              )}
              {candidates.map(item => {
                const p = primaryMetalForItem(item);
                const inDraft = draftItemIds.has(item.id);
                return (
                  <tr key={item.id} className={`hover:bg-black/[0.01] ${inDraft ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggle(item.id)} disabled={inDraft} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#76707F]">{item.id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]">{item.description || item.subcategory}</td>
                    <td className="px-3 py-2">{p.metal || '—'}</td>
                    <td className="px-3 py-2">{p.purity || '—'}</td>
                    <td className="px-3 py-2 text-right">{p.weight ? `${p.weight}g` : '—'}</td>
                    <td className="px-3 py-2 text-right">{formatUSD(item.estimated_scrap_value || item.market_value_at_intake || 0)}</td>
                    <td className="px-3 py-2">
                      {inDraft ? <span className="text-amber-700 text-[11px] font-medium">In Scrap Draft</span> : item.processing_status}
                    </td>
                    <td className="px-3 py-2 text-[#76707F]">{item.location}</td>
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
        onUpdateBatch={scrap.updateBatch}
        onUpdateItem={scrap.updateBatchItem}
        onRemoveItem={scrap.removeBatchItem}
        onFinalize={scrap.finalizeSendOut}
        onRecordAssay={scrap.recordAssay}
        onRecordSettlement={scrap.recordSettlement}
        onAddReturnedMetal={scrap.addReturnedMetal}
        onCloseBatch={scrap.closeBatch}
        onCancelDraft={async (id) => { const ok = await scrap.cancelDraft(id); if (ok) setOpenBatchId(null); return ok; }}
        loadActivity={scrap.loadActivity}
      />
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

function BatchCard({ batch, itemCount, onClick }: { batch: ScrapBatchRecord; itemCount: number; onClick: () => void }) {
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    assay_received: 'bg-indigo-100 text-indigo-800',
    settled: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-700',
  };
  return (
    <button onClick={onClick} className="text-left rounded-[12px] border border-black/[0.06] bg-white p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2B2833]">
          <FileText className="h-3.5 w-3.5" />
          {batch.batch_number}
        </div>
        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${colors[batch.status]}`}>{SCRAP_STATUS_LABELS[batch.status]}</span>
      </div>
      <div className="text-[11px] text-[#76707F]">{batch.refiner_name || 'No refiner'}</div>
      <div className="text-[11px] text-[#76707F] mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''} · {formatUSD(batch.estimated_gross_value || 0)}</div>
      <div className="text-[10px] text-[#A8A3AE] mt-2">{new Date(batch.created_at).toLocaleDateString()}</div>
    </button>
  );
}
