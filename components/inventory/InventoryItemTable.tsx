import React from 'react';
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

export function InventoryItemTable({ items, onView, onEdit, onPartOut, onArchive, onDispositionChange, hideProfit, emptyMessage }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#A8A3AE]">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-[14px]">{emptyMessage || 'No inventory items found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="table-header-gradient">
          <tr>
            <th className="w-10 px-6 py-3"></th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Metal</th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-right text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Cost</th>
            <th className="px-6 py-3 text-right text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Market Value</th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Date</th>
            <th className="w-10 px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04]">
          {items.map(item => (
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
  );
}