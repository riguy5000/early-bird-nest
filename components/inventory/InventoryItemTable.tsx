import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">{emptyMessage || 'No inventory items found'}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10"></TableHead>
            <TableHead className="text-xs">ID</TableHead>
            <TableHead className="text-xs">Description</TableHead>
            <TableHead className="text-xs">Metal</TableHead>
            <TableHead className="text-xs">Disposition</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Location</TableHead>
            <TableHead className="text-xs text-right">Paid</TableHead>
            <TableHead className="text-xs text-right">Est. Value</TableHead>
            <TableHead className="text-xs">Date In</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>
    </div>
  );
}
