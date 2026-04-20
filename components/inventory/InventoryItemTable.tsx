import React, { useState } from 'react';
import { InventoryItemRow } from './InventoryItemRow';
import type { InventoryItemRecord } from './types';
import { Package } from 'lucide-react';

interface Props {
  items: InventoryItemRecord[];
  onView: (item: InventoryItemRecord) => void;
  onEdit: (item: InventoryItemRecord) => void;
  onPartOut: (item: InventoryItemRecord) => void;
  onArchive: (item: InventoryItemRecord) => void;
  onDispositionChange?: (item: InventoryItemRecord, disposition: string) => void;
  hideProfit?: boolean;
  emptyMessage?: string;
}

const PAGE_SIZE = 5;

export function InventoryItemTable({
  items, onView, onEdit, onPartOut, onArchive, onDispositionChange, hideProfit, emptyMessage,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if items change (filter applied etc.)
  React.useEffect(() => { setCurrentPage(1); }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-[14px] icon-container flex items-center justify-center mb-4">
          <Package className="h-7 w-7 text-[#6B5EF9]" strokeWidth={2} />
        </div>
        <p className="text-[14px] text-[#A8A3AE]">{emptyMessage || 'No inventory items found'}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Generate page numbers to show (max 5 around current)
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* ── thead — subtle gradient with bottom border ── */}
          <thead className="table-header-gradient border-b border-black/[0.04]">
            <tr>
              {/* Icon column — no label */}
              <th className="w-14 px-5 py-3" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Metal</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Karat / Purity</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Department</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Cost</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Market Value</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          {/* ── tbody — dividers ── */}
          <tbody className="divide-y divide-black/[0.04]">
            {pageItems.map(item => (
              <InventoryItemRow
                key={item.id}
                item={item}
                onView={onView}
                onEdit={onEdit}
                onPartOut={onPartOut}
                onArchive={onArchive}
                onDispositionChange={onDispositionChange}
                hideProfit={hideProfit}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination footer — always visible, matches approved screenshot ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-black/[0.04]">
          {/* "Showing X to Y of Z items" */}
          <p className="text-[13px] text-[#A8A3AE]">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length} items
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            {/* Prev arrow */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#76707F] hover:bg-black/[0.04] disabled:opacity-30 disabled:pointer-events-none transition-colors text-[15px]"
            >
              ←
            </button>

            {/* Page numbers */}
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-[8px] text-[14px] font-medium transition-all ${
                  page === currentPage
                    ? 'bg-[#2B2833] text-white shadow-sm'
                    : 'text-[#76707F] hover:bg-black/[0.04] hover:text-[#2B2833]'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Next arrow */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#76707F] hover:bg-black/[0.04] disabled:opacity-30 disabled:pointer-events-none transition-colors text-[15px]"
            >
              →
            </button>
          </div>
        </div>
    </div>
  );
}
