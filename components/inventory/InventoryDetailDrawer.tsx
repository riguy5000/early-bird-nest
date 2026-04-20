import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
        <SheetContent className="overflow-y-auto p-6 bg-white/70 backdrop-blur-2xl backdrop-saturate-200">
          <SheetHeader className="text-left space-y-2 pb-4 border-b border-black/[0.06]">
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
                    className="flex-shrink-0 rounded-[10px] overflow-hidden border border-black/[0.06] hover:ring-2 hover:ring-black/10 transition-all cursor-pointer"
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

            {/* Category-specific specs from Take-In (stored in watch_info.specs) */}
            {(() => {
              const wi = item.watch_info || {};
              const specs = wi.specs || {};
              const itemType = wi.itemType || '';
              const hasItemType = !!itemType;
              const specEntries = Object.entries(specs).filter(([, v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
              if (!hasItemType && specEntries.length === 0 && !wi.brand && !wi.model) return null;
              return (
                <div className="bg-white/60 rounded-[12px] p-4 ring-1 ring-white/50">
                  <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">
                    {item.category} Details
                  </h4>
                  <Field label="Item Type" value={itemType} />
                  {/* Watch top-level fields (legacy watchInfo) */}
                  <Field label="Brand" value={wi.brand} />
                  <Field label="Model" value={wi.model} />
                  <Field label="Reference #" value={wi.reference} />
                  <Field label="Serial #" value={wi.serial} />
                  <Field label="Movement" value={wi.movement} />
                  <Field label="Dial Color" value={wi.dialColor} />
                  <Field label="Case Size" value={wi.caseSize} />
                  <Field label="Band" value={wi.band} />
                  <Field label="Condition" value={wi.condition} />
                  {wi.working !== undefined && <Field label="Working" value={wi.working ? 'Yes' : 'No'} />}
                  {wi.box !== undefined && <Field label="Box" value={wi.box ? 'Yes' : 'No'} />}
                  {wi.papers !== undefined && <Field label="Papers" value={wi.papers ? 'Yes' : 'No'} />}
                  {/* All category-specific spec fields */}
                  {specEntries.map(([k, v]) => {
                    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
                    const display = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : Array.isArray(v) ? v.join(', ') : String(v);
                    return <Field key={k} label={label} value={display} />;
                  })}
                </div>
              );
            })()}

            {item.metals?.length > 0 && (
              <div className="bg-white/60 rounded-[12px] p-4 ring-1 ring-white/50">
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Metals</h4>
                {item.metals.map((m: any, i: number) => {
                  const metalType = m.type || '—';
                  const purityLabel = (() => {
                    const v = m.karat;
                    if (v === undefined || v === null || v === '') return '';
                    const n = Number(v);
                    if (!Number.isFinite(n) || n <= 0) return '';
                    if (metalType === 'Gold') return `${n}K`;
                    if (metalType === 'Silver') {
                      if (n === 925) return '925 Sterling';
                      if (n === 999) return '999 Fine';
                      return String(n);
                    }
                    if (metalType === 'Platinum') return `${n} Platinum`;
                    if (metalType === 'Palladium') return `${n} Palladium`;
                    return String(n);
                  })();
                  return (
                    <div key={i} className="py-2 border-b border-black/[0.04] last:border-0">
                      <div className="text-[13px] font-medium text-[#2B2833]">
                        {metalType} {purityLabel} {m.weight ? `— ${m.weight}g` : ''}
                      </div>
                      <div className="text-[12px] text-[#76707F] mt-0.5 space-x-2">
                        {m.color && <span>Color: {m.color}</span>}
                        {m.hallmark && <span>Hallmark: {m.hallmark}</span>}
                        {m.testMethod && <span>Test: {m.testMethod}</span>}
                        {m.payoutPercentage !== undefined && <span>{m.payoutPercentage}%</span>}
                        {m.payoutAmount !== undefined && <span>{fmt(m.payoutAmount)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {item.stones?.length > 0 && (
              <div className="bg-white/60 rounded-[12px] p-4 ring-1 ring-white/50">
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Stones</h4>
                {item.stones.map((s: any, i: number) => {
                  const type = s.stoneType || s.type || 'Stone';
                  const carat = s.caratWeight || s.size || '';
                  const sizeMm = s.sizeMm || s.measurements || '';
                  const cert = s.certNumber || s.labCert || s.reportNumber || '';
                  const origin = s.origin || s.naturalLab || '';
                  return (
                    <div key={i} className="py-2 border-b border-black/[0.04] last:border-0">
                      <div className="text-[13px] font-medium text-[#2B2833]">
                        {type}
                        {s.shape ? ` · ${s.shape}` : ''}
                        {carat ? ` · ${carat}ct` : ''}
                        {s.quantity > 1 ? ` · qty ${s.quantity}` : ''}
                      </div>
                      <div className="text-[12px] text-[#76707F] mt-0.5 space-x-2">
                        {sizeMm && <span>Size: {sizeMm}mm</span>}
                        {s.color && <span>Color: {s.color}</span>}
                        {s.clarity && <span>Clarity: {s.clarity}</span>}
                        {s.cut && <span>Cut: {s.cut}</span>}
                        {origin && <span>{origin}</span>}
                        {s.treatment && <span>Treatment: {s.treatment}</span>}
                        {cert && <span>Cert #: {cert}</span>}
                        {s.includedInOffer !== undefined && <span>{s.includedInOffer ? 'In offer' : 'Not in offer'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {item.notes && (
              <div className="bg-white/60 rounded-[12px] p-4 ring-1 ring-white/50">
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-[13px] text-[#2B2833] leading-relaxed whitespace-pre-wrap">{item.notes}</p>
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
                <button onClick={() => onPartOut(item)} className="btn-secondary-light flex items-center gap-1.5 text-[13px]">
                  <Scissors className="h-3.5 w-3.5" /> Part Out
                </button>
              )}
              {!item.is_archived && (
                <button onClick={() => onArchive(item)} className="flex items-center gap-1.5 px-5 py-2.5 bg-white/60 border border-black/[0.06] rounded-[10px] text-[13px] font-medium text-[#F87171] hover:bg-[#FFF5F5] transition-all">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
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
