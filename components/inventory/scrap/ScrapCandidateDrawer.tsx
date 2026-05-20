import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatUSD } from '@/lib/utils';
import { formatPurity } from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { primaryMetalForItem } from './scrapCalc';
import { Plus, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  item: InventoryItemRecord | null;
  isSelected: boolean;
  inDraft: boolean;
  onToggleSelect: (id: string) => void;
}

export function ScrapCandidateDrawer({ open, onClose, item, isSelected, inDraft, onToggleSelect }: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto p-6 bg-white/85 backdrop-blur-2xl w-full sm:max-w-[480px]">
        {item && <Body item={item} isSelected={isSelected} inDraft={inDraft} onToggleSelect={onToggleSelect} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ item, isSelected, inDraft, onToggleSelect, onClose }: { item: InventoryItemRecord; isSelected: boolean; inDraft: boolean; onToggleSelect: (id: string) => void; onClose: () => void }) {
  const p = primaryMetalForItem(item);
  const photo = item.photos?.[0];
  const estValue = item.estimated_scrap_value || item.market_value_at_intake || 0;

  return (
    <>
      <SheetHeader className="text-left space-y-1 pb-4 border-b border-black/[0.06]">
        <SheetTitle className="text-[18px] font-semibold text-[#2B2833] tracking-tight">
          {item.description || item.subcategory || item.category}
        </SheetTitle>
        <div className="text-[12px] text-[#76707F] font-mono">{item.id.slice(0, 8)}</div>
      </SheetHeader>

      {photo && (
        <div className="mt-4 rounded-[12px] overflow-hidden border border-black/[0.06] bg-black/[0.03]">
          <img src={photo} alt="item" className="w-full h-48 object-cover" />
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Category" value={item.category} />
        <Field label="Subtype" value={item.subcategory || '—'} />
        <Field label="Metal" value={p.metal || '—'} />
        <Field label="Purity" value={formatPurity(p.metal, p.purity)} />
        <Field label="Weight" value={p.weight ? `${p.weight} g` : '—'} />
        <Field label="Est. Value" value={formatUSD(estValue)} />
        <Field label="Location" value={item.location || '—'} />
        <Field label="Status" value={item.processing_status} />
      </dl>

      {item.notes && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Notes</div>
          <p className="mt-1 text-[13px] text-[#2B2833] whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}

      {item.take_in_item_ref && (
        <div className="mt-4 text-[12px] text-[#76707F]">
          <span className="font-medium text-[#2B2833]">Intake ref:</span> {item.take_in_item_ref}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {!inDraft ? (
          <button
            onClick={() => { onToggleSelect(item.id); onClose(); }}
            className="px-3 py-2.5 rounded-[10px] text-[13px] font-medium bg-[#2B2833] text-white hover:opacity-90 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> {isSelected ? 'Remove from selection' : 'Add to batch'}
          </button>
        ) : (
          <div className="px-3 py-2.5 rounded-[10px] text-[12px] text-amber-800 bg-amber-50 border border-amber-200 text-center">
            Already in a draft scrap batch.
          </div>
        )}
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-[10px] text-[13px] text-[#2B2833] bg-white border border-black/[0.08] hover:bg-black/[0.02] flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Close
        </button>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-[#76707F] uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-[#2B2833] font-medium">{value}</dd>
    </div>
  );
}
