import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scissors, Archive } from 'lucide-react';
import type { InventoryItemRecord } from './types';
import { DISPOSITIONS } from './types';

interface Props {
  item: InventoryItemRecord | null;
  open: boolean;
  onClose: () => void;
  onPartOut: (item: InventoryItemRecord) => void;
  onArchive: (item: InventoryItemRecord) => void;
  onDispositionChange?: (item: InventoryItemRecord, disposition: string) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '' || value === '—') return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function InventoryDetailDrawer({ item, open, onClose, onPartOut, onArchive, onDispositionChange }: Props) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {item.description || `${item.category} - ${item.subcategory}`}
          </SheetTitle>
          <div className="flex gap-2 mt-1 items-center">
            {onDispositionChange ? (
              <Select
                value={item.disposition}
                onValueChange={(v) => onDispositionChange(item, v)}
              >
                <SelectTrigger className="h-7 w-[160px] text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSITIONS.map(d => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{item.disposition}</Badge>
            )}
            <Badge variant="outline">{item.processing_status}</Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {item.photos?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {item.photos.map((url, i) => (
                <img key={i} src={url} className="w-24 h-24 rounded-lg object-cover border" alt="" />
              ))}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Item Info</h4>
            <Field label="Item ID" value={item.id.slice(0, 12)} />
            <Field label="Batch ID" value={item.batch_id?.slice(0, 12)} />
            <Field label="Category" value={item.category} />
            <Field label="Subcategory" value={item.subcategory} />
            <Field label="Source" value={item.source} />
            <Field label="Test Method" value={item.test_method} />
            <Field label="Weight" value={item.weight ? `${item.weight}g` : undefined} />
            <Field label="Location" value={item.location} />
          </div>

          <Separator />

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Values</h4>
            <Field label="Market Value at Intake" value={fmt(item.market_value_at_intake)} />
            <Field label="Payout" value={fmt(item.payout_amount)} />
            <Field label="Payout %" value={`${item.payout_percentage}%`} />
            <Field label="Est. Scrap Value" value={fmt(item.estimated_scrap_value)} />
            <Field label="Est. Resale Value" value={fmt(item.estimated_resale_value)} />
            {item.selling_price > 0 && <Field label="Selling Price" value={fmt(item.selling_price)} />}
            {item.sold_amount > 0 && <Field label="Sold Amount" value={fmt(item.sold_amount)} />}
          </div>

          <Separator />

          {item.metals?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metals</h4>
              {item.metals.map((m: any, i: number) => (
                <div key={i} className="text-sm py-1">
                  {m.type} {m.karat}K — {m.weight}g
                </div>
              ))}
            </div>
          )}

          {item.stones?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stones</h4>
              {item.stones.map((s: any, i: number) => (
                <div key={i} className="text-sm py-1">
                  {s.type} {s.color} {s.size ? `${s.size}ct` : ''} {s.labCert || ''}
                </div>
              ))}
            </div>
          )}

          {item.notes && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm">{item.notes}</p>
            </div>
          )}

          {item.parent_item_id && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Derived From</h4>
              <p className="text-sm font-mono">{item.parent_item_id.slice(0, 12)}</p>
            </div>
          )}

          <Separator />

          <div className="flex gap-2 pt-2">
            {item.is_part_out_eligible && !item.is_archived && (
              <Button variant="outline" size="sm" onClick={() => onPartOut(item)}>
                <Scissors className="h-3.5 w-3.5 mr-1.5" /> Part Out
              </Button>
            )}
            {!item.is_archived && (
              <Button variant="outline" size="sm" onClick={() => onArchive(item)} className="text-destructive">
                <Archive className="h-3.5 w-3.5 mr-1.5" /> Archive
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
