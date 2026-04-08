import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Package, Calendar, User, DollarSign } from 'lucide-react';
import { InventoryItemTable } from './InventoryItemTable';
import type { InventoryBatchRecord, InventoryItemRecord } from './types';

interface Props {
  batches: InventoryBatchRecord[];
  allItems: InventoryItemRecord[];
  onViewItem: (item: InventoryItemRecord) => void;
  onEditItem: (item: InventoryItemRecord) => void;
  onPartOutItem: (item: InventoryItemRecord) => void;
  onArchiveItem: (item: InventoryItemRecord) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function BatchView({ batches, allItems, onViewItem, onEditItem, onPartOutItem, onArchiveItem }: Props) {
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const toggleBatch = (id: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">No batches found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map(batch => {
        const batchItems = allItems.filter(i => i.batch_id === batch.id);
        const isExpanded = expandedBatches.has(batch.id);
        const totalValue = batchItems.reduce((s, i) => s + (i.estimated_resale_value || i.market_value_at_intake || 0), 0);

        return (
          <Card key={batch.id} className="overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleBatch(batch.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    Batch {batch.id.slice(0, 8)}
                    <Badge variant="outline" className="text-[10px]">{batch.source}</Badge>
                    <Badge variant="outline" className="text-[10px]">{batch.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(batch.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" />{batchItems.length} items</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Paid: {fmt(batch.total_payout)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{fmt(totalValue)}</div>
                <div className="text-xs text-muted-foreground">current value</div>
              </div>
            </div>
            {isExpanded && (
              <CardContent className="pt-0 px-4 pb-4">
                {batch.batch_notes && (
                  <p className="text-xs text-muted-foreground mb-3 bg-muted/50 rounded p-2">{batch.batch_notes}</p>
                )}
                <InventoryItemTable
                  items={batchItems}
                  onView={onViewItem}
                  onEdit={onEditItem}
                  onPartOut={onPartOutItem}
                  onArchive={onArchiveItem}
                  emptyMessage="No items in this batch"
                />
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
