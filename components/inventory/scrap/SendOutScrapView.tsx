import React, { useMemo, useState } from 'react';
import { formatUSD } from '@/lib/utils';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useScrapBatches } from './useScrapBatches';
import { computeBatchTotals, primaryMetalForItem } from './scrapCalc';
import { ScrapBatchDrawer } from './ScrapBatchDrawer';
import { ScrapCandidateDrawer } from './ScrapCandidateDrawer';
import { SCRAP_STATUS_LABELS, formatPurity, displayStatus, type ScrapBatchRecord, type ScrapBatchStatus } from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { Send, FileText, Search, Trash2, AlertTriangle, Package, CheckCircle2, Clock, Truck, X } from 'lucide-react';

interface Props {
  storeId: string;
  employeeId?: string;
  allItems: InventoryItemRecord[];
}

type StatusFilter = 'all' | 'draft' | 'sent' | 'assay_received' | 'closed';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent to Refiner' },
  { id: 'assay_received', label: 'Assay Received' },
  { id: 'closed', label: 'Closed' },
];

const BATCH_PAGE_SIZE = 12;

interface MetalFilter {
  metal: string;        // '' means total for that metal across purities
  purity: string;       // '' means any purity
}

export function SendOutScrapView({ storeId, employeeId, allItems }: Props) {
  const prices = useMetalPrices();
  const scrap = useScrapBatches(storeId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [confirmDelete, setConfirmDelete] = useState<ScrapBatchRecord | null>(null);
  const [confirmRemoveCandidate, setConfirmRemoveCandidate] = useState<InventoryItemRecord | null>(null);
  const [metalFilter, setMetalFilter] = useState<MetalFilter | null>(null);
  const [visibleBatches, setVisibleBatches] = useState(BATCH_PAGE_SIZE);

  const candidates = useMemo(() => allItems.filter(i =>
    i.disposition === 'Scrap Candidate' && !i.is_archived && !i.scrap_batch_id
  ), [allItems]);

  const draftItemIds = useMemo(() => {
    const draftBatchIds = new Set(scrap.batches.filter(b => b.status === 'draft').map(b => b.id));
    return new Set(scrap.items.filter(i => draftBatchIds.has(i.batch_id)).map(i => i.inventory_item_id));
  }, [scrap.batches, scrap.items]);

  // Metal/purity grams breakdown across ALL candidates (for filter chips)
  const metalBreakdown = useMemo(() => {
    const map = new Map<string, { metal: string; purity: string; grams: number; value: number }>();
    const metalTotals: Record<string, number> = { Gold: 0, Silver: 0, Platinum: 0, Palladium: 0 };
    let totalValue = 0;
    candidates.forEach(item => {
      const metals = Array.isArray(item.metals) ? item.metals : [];
      const v = item.estimated_scrap_value || item.market_value_at_intake || 0;
      totalValue += v;
      metals.forEach((m: any) => {
        const metal = String(m?.type || m?.metal || '');
        const purity = String(m?.karat || m?.purity || '');
        const weight = Number(m?.weight) || 0;
        if (!metal || weight <= 0) return;
        const key = `${metal}::${purity}`;
        const cur = map.get(key) || { metal, purity, grams: 0, value: 0 };
        cur.grams += weight;
        map.set(key, cur);
        if (metal in metalTotals) metalTotals[metal] += weight;
      });
    });
    return {
      byPurity: Array.from(map.values()).sort((a, b) => a.metal.localeCompare(b.metal) || a.purity.localeCompare(b.purity)),
      metalTotals,
      totalValue,
    };
  }, [candidates]);

  // Lookup for inventory items by id — used by batch search to match item descriptions/categories
  const inventoryById = useMemo(() => {
    const map = new Map<string, InventoryItemRecord>();
    allItems.forEach(it => map.set(it.id, it));
    return map;
  }, [allItems]);

  const query = search.trim().toLowerCase();
  const queryNum = query && !isNaN(Number(query)) ? Number(query) : null;

  const filteredCandidates = useMemo(() => {
    return candidates.filter(item => {
      if (metalFilter) {
        const metals = Array.isArray(item.metals) ? item.metals : [];
        const matchesMetal = metals.some((m: any) => {
          const metal = String(m?.type || m?.metal || '');
          const purity = String(m?.karat || m?.purity || '');
          if (metalFilter.metal && metal !== metalFilter.metal) return false;
          if (metalFilter.purity && purity !== metalFilter.purity) return false;
          return true;
        });
        if (!matchesMetal) return false;
      }
      if (!query) return true;

      const metals = Array.isArray(item.metals) ? item.metals : [];
      const haystack = [
        item.id,
        item.take_in_item_ref || '',
        item.category || '',
        item.subcategory || '',
        item.description || '',
        item.notes || '',
        ...metals.flatMap((m: any) => [String(m?.type || m?.metal || ''), String(m?.karat || m?.purity || '')]),
      ].join(' ').toLowerCase();

      if (haystack.includes(query)) return true;

      if (queryNum !== null) {
        const w = Number(item.weight) || 0;
        if (Math.abs(w - queryNum) < 0.05) return true;
      }
      return false;
    });
  }, [candidates, metalFilter, query, queryNum]);

  const selectedItems = useMemo(() => candidates.filter(i => selectedIds.has(i.id)), [candidates, selectedIds]);
  const totals = useMemo(() => computeBatchTotals(selectedItems, prices), [selectedItems, prices]);

  // Selected breakdown by metal/purity
  const selectedBreakdown = useMemo(() => {
    const map = new Map<string, { metal: string; purity: string; grams: number }>();
    selectedItems.forEach(item => {
      (Array.isArray(item.metals) ? item.metals : []).forEach((m: any) => {
        const metal = String(m?.type || m?.metal || '');
        const purity = String(m?.karat || m?.purity || '');
        const weight = Number(m?.weight) || 0;
        if (!metal || weight <= 0) return;
        const key = `${metal}::${purity}`;
        const cur = map.get(key) || { metal, purity, grams: 0 };
        cur.grams += weight;
        map.set(key, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.metal.localeCompare(b.metal) || a.purity.localeCompare(b.purity));
  }, [selectedItems]);

  const filteredBatches = useMemo(() => {
    return scrap.batches.filter(b => {
      if (filter !== 'all' && displayStatus(b.status) !== filter) return false;
      if (!query) return true;
      const batchItems = scrap.items.filter(i => i.batch_id === b.id);
      const itemMatch = batchItems.some(i => {
        if (i.inventory_item_id.toLowerCase().includes(query)) return true;
        if (i.metal.toLowerCase().includes(query)) return true;
        if (i.purity.toLowerCase().includes(query)) return true;
        const inv = inventoryById.get(i.inventory_item_id);
        if (inv) {
          const hay = `${inv.description || ''} ${inv.category || ''} ${inv.subcategory || ''} ${inv.take_in_item_ref || ''}`.toLowerCase();
          if (hay.includes(query)) return true;
        }
        return false;
      });
      return (
        b.batch_number.toLowerCase().includes(query) ||
        b.refiner_name.toLowerCase().includes(query) ||
        b.tracking_number.toLowerCase().includes(query) ||
        SCRAP_STATUS_LABELS[b.status].toLowerCase().includes(query) ||
        itemMatch
      );
    });
  }, [scrap.batches, scrap.items, inventoryById, query, filter]);

  // Summary: clearly-labeled cards
  const summary = useMemo(() => {
    let draft = 0, awaiting = 0, closed = 0, closedSettlement = 0;
    scrap.batches.forEach(b => {
      const s = displayStatus(b.status);
      if (s === 'draft') draft += 1;
      else if (s === 'sent' || s === 'assay_received') awaiting += 1;
      else if (s === 'closed') { closed += 1; closedSettlement += b.final_settlement_amount || b.cash_received || 0; }
    });
    return { draft, awaiting, closed, closedSettlement };
  }, [scrap.batches]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const target = filteredCandidates.filter(c => !draftItemIds.has(c.id));
    const allSelected = target.length > 0 && target.every(c => selectedIds.has(c.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) target.forEach(c => next.delete(c.id));
      else target.forEach(c => next.add(c.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

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
  const shownBatches = filteredBatches.slice(0, visibleBatches);

  const isMetalFilterActive = (m: MetalFilter | null) =>
    metalFilter && (metalFilter.metal === m?.metal) && (metalFilter.purity === m?.purity);

  return (
    <div className="p-5 space-y-5">
      {/* Top summary cards — clearly labeled */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Clock className="h-4 w-4" />} label="Draft batches" value={String(summary.draft)} tint="amber" />
        <SummaryCard icon={<Truck className="h-4 w-4" />} label="Sent / awaiting assay" value={String(summary.awaiting)} tint="blue" />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Closed batches" value={String(summary.closed)} tint="emerald" />
        <SummaryCard
          icon={<Package className="h-4 w-4" />}
          label="Open scrap candidate value"
          value={formatUSD(metalBreakdown.totalValue)}
          tint="slate"
          hint={`${candidates.length} item${candidates.length === 1 ? '' : 's'} ready`}
        />
      </div>


      {/* Unified search — applies to both batches and candidates */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#76707F]" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setVisibleBatches(BATCH_PAGE_SIZE); }}
          placeholder="Search batches and candidates — ID, metal, purity, description, refiner, tracking…"
          className="h-10 w-full pl-9 pr-9 rounded-[10px] border border-black/[0.08] bg-white text-[13px] focus:outline-none focus:border-[#2B2833]/30 focus:ring-2 focus:ring-[#2B2833]/5"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setVisibleBatches(BATCH_PAGE_SIZE); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#76707F] hover:bg-black/[0.05]"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Batches section */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#2B2833]">
              Scrap batches
              {query && (
                <span className="ml-2 text-[12px] font-normal text-[#76707F]">
                  · {filteredBatches.length} of {scrap.batches.length}
                </span>
              )}
            </h3>
            <p className="text-[12px] text-[#76707F]">Track every batch you're sending to a refiner.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {FILTERS.map(f => {
            const count = f.id === 'all'
              ? scrap.batches.length
              : scrap.batches.filter(b => displayStatus(b.status) === f.id).length;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setVisibleBatches(BATCH_PAGE_SIZE); }}
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
            <p className="text-[13px] text-[#76707F]">
              {query
                ? <>No batches match <span className="font-medium text-[#2B2833]">"{search}"</span>.</>
                : <>No batches match. Select scrap candidates below to create one.</>}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shownBatches.map(b => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  itemCount={scrap.items.filter(i => i.batch_id === b.id).length}
                  onClick={() => setOpenBatchId(b.id)}
                  onDelete={b.status === 'draft' ? () => setConfirmDelete(b) : undefined}
                />
              ))}
            </div>
            {visibleBatches < filteredBatches.length && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setVisibleBatches(v => v + BATCH_PAGE_SIZE)}
                  className="px-4 py-2 rounded-[10px] text-[13px] bg-white border border-black/[0.08] hover:bg-black/[0.02]"
                >
                  Load more ({filteredBatches.length - visibleBatches} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Candidates section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#2B2833]">
              Scrap candidates
              {query && (
                <span className="ml-2 text-[12px] font-normal text-[#76707F]">
                  · {filteredCandidates.length} of {candidates.length}
                </span>
              )}
            </h3>
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

        {/* Metal/purity filter chips — show grams available */}
        {(metalBreakdown.byPurity.length > 0 || metalFilter) && (
          <div className="rounded-[12px] border border-black/[0.06] bg-white p-3 mb-3">
            <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">
              Available by metal / purity — click to filter
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                label="All"
                active={!metalFilter}
                onClick={() => setMetalFilter(null)}
              />
              {/* Broader metal totals */}
              {Object.entries(metalBreakdown.metalTotals).map(([metal, grams]) => (
                grams > 0 && (
                  <FilterChip
                    key={`total-${metal}`}
                    label={`Total ${metal}: ${grams.toFixed(1)}g`}
                    active={!!(metalFilter && metalFilter.metal === metal && !metalFilter.purity)}
                    onClick={() => setMetalFilter({ metal, purity: '' })}
                    variant="metal"
                  />
                )
              ))}
              {/* Per metal/purity */}
              {metalBreakdown.byPurity.map(row => (
                <FilterChip
                  key={`${row.metal}-${row.purity}`}
                  label={`${row.metal} ${formatPurity(row.metal, row.purity)}: ${row.grams.toFixed(1)}g`}
                  active={!!(metalFilter && metalFilter.metal === row.metal && metalFilter.purity === row.purity)}
                  onClick={() => setMetalFilter({ metal: row.metal, purity: row.purity })}
                />
              ))}
            </div>
            {metalFilter && (
              <div className="mt-2 text-[11px] text-[#76707F]">
                Showing only {metalFilter.metal} {metalFilter.purity && formatPurity(metalFilter.metal, metalFilter.purity)} items.{' '}
                <button onClick={() => setMetalFilter(null)} className="text-[#2B2833] font-medium underline">Clear</button>
              </div>
            )}
          </div>
        )}

        {/* Live selected summary */}
        {selectedItems.length > 0 && (
          <div className="rounded-[12px] bg-[#FAF8F2] border border-black/[0.06] p-3 mb-3 sticky top-2 z-10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-semibold text-[#2B2833]">Selected to send</div>
              <button onClick={clearSelection} className="text-[11px] text-[#76707F] hover:text-[#2B2833] flex items-center gap-1">
                <X className="h-3 w-3" /> Clear selection
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[12px]">
              <Stat label="Items" value={String(totals.itemCount)} />
              <Stat label="Total Gold" value={`${totals.goldGrams.toFixed(2)} g`} />
              <Stat label="Total Silver" value={`${totals.silverGrams.toFixed(2)} g`} />
              <Stat label="Total Platinum/Pd" value={`${(totals.platinumGrams + totals.palladiumGrams).toFixed(2)} g`} />
              <Stat label="Est. value" value={formatUSD(totals.estimatedValue)} />
            </div>
            {selectedBreakdown.length > 0 && (
              <div className="mt-2 pt-2 border-t border-black/[0.06] flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#2B2833]">
                {selectedBreakdown.map(r => (
                  <span key={`${r.metal}-${r.purity}`}>
                    <span className="text-[#76707F]">{r.metal} {formatPurity(r.metal, r.purity)}:</span>{' '}
                    <span className="font-medium">{r.grams.toFixed(2)}g</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-[12px] border border-black/[0.06] bg-white overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wider text-[#76707F]">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={filteredCandidates.length > 0 && filteredCandidates.filter(c => !draftItemIds.has(c.id)).every(c => selectedIds.has(c.id))}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Metal</th>
                <th className="px-3 py-2 text-left">Purity</th>
                <th className="px-3 py-2 text-right">Weight</th>
                <th className="px-3 py-2 text-right">Est. value</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredCandidates.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-[13px] text-[#76707F]">
                  {query
                    ? <>No scrap candidates match <span className="font-medium text-[#2B2833]">"{search}"</span>. <button onClick={() => setSearch('')} className="text-[#2B2833] underline">Clear search</button>.</>
                    : metalFilter
                      ? <>No candidates match this filter. <button onClick={() => setMetalFilter(null)} className="text-[#2B2833] underline">Clear filter</button>.</>
                      : <>No scrap candidate items. Mark items as <b>Scrap Candidate</b> in Inventory to see them here.</>}
                </td></tr>
              )}
              {filteredCandidates.map(item => {
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
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      {!inDraft && (
                        <button
                          onClick={() => setConfirmRemoveCandidate(item)}
                          title="Remove from Scrap Candidates"
                          className="p-1.5 rounded-[6px] text-[#76707F] hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
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
        livePrices={prices}
      />

      <ScrapCandidateDrawer
        open={!!previewItem}
        onClose={() => setPreviewItemId(null)}
        item={previewItem}
        isSelected={previewItem ? selectedIds.has(previewItem.id) : false}
        inDraft={previewItem ? draftItemIds.has(previewItem.id) : false}
        onToggleSelect={toggle}
        onRemoveFromCandidates={(item) => { setPreviewItemId(null); setConfirmRemoveCandidate(item); }}
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

      {confirmRemoveCandidate && (
        <RemoveCandidateModal
          item={confirmRemoveCandidate}
          onCancel={() => setConfirmRemoveCandidate(null)}
          onConfirm={async () => {
            await scrap.removeCandidate(confirmRemoveCandidate.id);
            setConfirmRemoveCandidate(null);
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

function FilterChip({ label, active, onClick, variant }: { label: string; active: boolean; onClick: () => void; variant?: 'metal' }) {
  const base = 'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border';
  if (active) return <button onClick={onClick} className={`${base} bg-[#2B2833] text-white border-[#2B2833]`}>{label}</button>;
  if (variant === 'metal') return <button onClick={onClick} className={`${base} bg-[#FAF8F2] text-[#2B2833] border-amber-200/60 hover:bg-amber-50`}>{label}</button>;
  return <button onClick={onClick} className={`${base} bg-white text-[#2B2833] border-black/[0.08] hover:bg-black/[0.02]`}>{label}</button>;
}

function SummaryCard({ icon, label, value, tint, hint }: { icon: React.ReactNode; label: string; value: string; tint: 'amber' | 'blue' | 'emerald' | 'slate'; hint?: string }) {
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
        {hint && <div className="text-[10px] text-[#A8A3AE] mt-0.5 truncate">{hint}</div>}
      </div>
    </div>
  );
}

function BatchCard({ batch, itemCount, onClick, onDelete }: { batch: ScrapBatchRecord; itemCount: number; onClick: () => void; onDelete?: () => void }) {
  const dStatus = displayStatus(batch.status);
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    assay_received: 'bg-indigo-100 text-indigo-800',
    closed: 'bg-emerald-100 text-emerald-800',
  };
  const dateInfo = dStatus === 'closed' && batch.closed_at
    ? `Closed ${new Date(batch.closed_at).toLocaleDateString()}`
    : dStatus === 'sent' && batch.sent_at
      ? `Sent ${new Date(batch.sent_at).toLocaleDateString()}`
      : `Created ${new Date(batch.created_at).toLocaleDateString()}`;
  const valueLabel = dStatus === 'closed'
    ? `Settled ${formatUSD(batch.final_settlement_amount || batch.cash_received || 0)}`
    : `Est. ${formatUSD(batch.estimated_gross_value || 0)}`;

  return (
    <div className="text-left rounded-[12px] border border-black/[0.06] bg-white p-4 hover:shadow-md transition-all relative group">
      <button onClick={onClick} className="block w-full text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2B2833]">
            <FileText className="h-3.5 w-3.5" />
            {batch.batch_number}
          </div>
          <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${colors[dStatus]}`}>{SCRAP_STATUS_LABELS[batch.status]}</span>
        </div>
        <div className="text-[12px] text-[#2B2833]">{batch.refiner_name || <span className="text-[#76707F]">No refiner yet</span>}</div>
        <div className="text-[11px] text-[#76707F] mt-0.5">
          {itemCount} item{itemCount !== 1 ? 's' : ''} · {valueLabel}
        </div>
        {batch.tracking_number && (
          <div className="text-[11px] text-[#76707F] mt-1 truncate">Tracking: {batch.tracking_number}</div>
        )}
        <div className="text-[10px] text-[#A8A3AE] mt-2">{dateInfo}</div>
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
          <button onClick={onCancel} className="px-3 py-2 rounded-[8px] text-[13px] bg-white border border-black/[0.08]">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-[8px] text-[13px] bg-red-600 text-white">Delete draft</button>
        </div>
      </div>
    </div>
  );
}

function RemoveCandidateModal({ item, onCancel, onConfirm }: { item: InventoryItemRecord; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-[14px] max-w-[420px] w-full p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-[#2B2833]">Remove from Scrap Candidates?</h3>
            <p className="mt-1 text-[13px] text-[#76707F]">
              <span className="font-medium text-[#2B2833]">{item.description || item.subcategory || item.category}</span> will
              stay in your inventory and be set back to Undecided. It will no longer appear in this list.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-3 py-2 rounded-[8px] text-[13px] bg-white border border-black/[0.08]">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white">Remove from candidates</button>
        </div>
      </div>
    </div>
  );
}
