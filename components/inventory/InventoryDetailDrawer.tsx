import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scissors, Archive } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
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
    <div className="flex justify-between py-1.5 border-b border-black/[0.04] last:border-0">
      <span className="text-[12px] text-[#76707F]">{label}</span>
      <span className="text-[13px] font-medium text-[#2B2833] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function InventoryDetailDrawer({ item, open, onClose, onPartOut, onArchive, onDispositionChange }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!item) return null;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[20px] font-semibold text-[#2B2833] tracking-tight">
              {item.description || `${item.category} - ${item.subcategory}`}
            </SheetTitle>
            <div className="flex gap-2 mt-1 items-center">
              {onDispositionChange ? (
                <Select
                  value={item.disposition}
                  onValueChange={(v) => onDispositionChange(item, v)}
                >
                  <SelectTrigger className="h-7 w-[160px] text-[12px] font-medium bg-white/60 border border-black/[0.06] rounded-[8px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
                    {DISPOSITIONS.map(d => (
                      <SelectItem key={d} value={d} className="text-[12px]">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#F5F5F5] text-[#76707F]">{item.disposition}</span>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#E8F5E9] text-[#2E7D32]">{item.processing_status}</span>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {item.photos?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {item.photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => openLightbox(i)}
                    className="flex-shrink-0 rounded-[10px] overflow-hidden border border-black/[0.06] hover:ring-2 hover:ring-[#6B5EF9]/30 transition-all cursor-pointer"
                  >
                    <img
                      src={url}
                      className="w-24 h-24 rounded-[10px] object-cover"
                      alt={`Item photo ${i + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white/60 rounded-[12px] p-4 ring-1 ring-white/50">
              <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Item Info</h4>
              <Field label="Item ID" value={item.id.slice(0, 12)} />
              <Field label="Batch ID" value={item.batch_id?.slice(0, 12)} />
              <Field label="Category" value={item.category} />
              <Field label="Subcategory" value={item.subcategory} />
              <Field label="Source" value={item.source} />
              <Field label="Test Method" value={item.test_method} />
              <Field label="Weight" value={item.weight ? `${item.weight}g` : undefined} />
              <Field label="Location" value={item.location} />
            </div>

            <div className="border-t border-black/[0.04]" />

            <div className="bg-white/60 rounded-[12px] p-4 ring-1 ring-white/50">
              <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Values</h4>
              <Field label="Market Value at Intake" value={fmt(item.market_value_at_intake)} />
              <Field label="Payout" value={fmt(item.payout_amount)} />
              <Field label="Payout %" value={`${item.payout_percentage}%`} />
              <Field label="Est. Scrap Value" value={fmt(item.estimated_scrap_value)} />
              <Field label="Est. Resale Value" value={fmt(item.estimated_resale_value)} />
              {item.selling_price > 0 && <Field label="Selling Price" value={fmt(item.selling_price)} />}
              {item.sold_amount > 0 && <Field label="Sold Amount" value={fmt(item.sold_amount)} />}
            </div>

            <div className="border-t border-black/[0.04]" />

            {item.metals?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Metals</h4>
                {item.metals.map((m: any, i: number) => (
                  <div key={i} className="text-[13px] text-[#2B2833] py-1">
                    {m.type} {m.karat}K — {m.weight}g
                  </div>
                ))}
              </div>
            )}

            {item.stones?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Stones</h4>
                {item.stones.map((s: any, i: number) => (
                  <div key={i} className="text-[13px] text-[#2B2833] py-1">
                    {s.type} {s.color} {s.size ? `${s.size}ct` : ''} {s.labCert || ''}
                  </div>
                ))}
              </div>
            )}

            {item.notes && (
              <div>
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-[13px] text-[#76707F] leading-relaxed">{item.notes}</p>
              </div>
            )}

            {item.parent_item_id && (
              <div>
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Derived From</h4>
                <p className="text-[13px] font-mono text-[#76707F]">{item.parent_item_id.slice(0, 12)}</p>
              </div>
            )}

            <div className="border-t border-black/[0.04]" />

            <div className="flex gap-2 pt-2">
              {item.is_part_out_eligible && !item.is_archived && (
                <Button variant="outline" size="sm" onClick={() => onPartOut(item)} className="btn-secondary-light text-[13px] px-4 py-2 flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5" /> Part Out
                </Button>
              )}
              {!item.is_archived && (
                <Button variant="outline" size="sm" onClick={() => onArchive(item)} className="text-[13px] px-4 py-2 flex items-center gap-1.5 bg-white/60 border border-black/[0.06] rounded-[10px] text-[#F87171] hover:bg-[#FFF5F5]">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ImageLightbox
        images={item.photos || []}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
