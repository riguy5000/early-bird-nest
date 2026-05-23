import React from 'react';
import { formatUSD } from '@/lib/utils';
import { formatPurity, type ScrapBatchRecord, type ScrapBatchItemRecord } from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import type { BatchTotals } from './scrapCalc';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  batch: ScrapBatchRecord;
  linkedItems: { bi: ScrapBatchItemRecord; inv?: InventoryItemRecord }[];
  totals: BatchTotals;
}

export function ClosedBatchSummary({ batch, linkedItems, totals }: Props) {
  const a = batch.assay_data || {};
  const settlementLabel = batch.settlement_method === 'cash' ? 'Cash out'
    : batch.settlement_method === 'metal' ? 'Metal return'
    : batch.settlement_method === 'partial' ? 'Cash + metal' : '—';

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-emerald-100 bg-emerald-50/40 p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#2B2833]">This batch is closed.</div>
          <p className="text-[12px] text-[#76707F]">Final summary of what was sent, recovered, priced, and paid.</p>
        </div>
      </div>

      <Section title="Overview">
        <Row k="Batch" v={batch.batch_number} />
        <Row k="Refiner" v={batch.refiner_name || '—'} />
        <Row k="Tracking" v={batch.tracking_number || '—'} />
        <Row k="Items sent" v={String(linkedItems.length)} />
        <Row k="Date sent" v={batch.sent_at ? new Date(batch.sent_at).toLocaleDateString() : '—'} />
        <Row k="Assay received" v={batch.assay_received_at ? new Date(batch.assay_received_at).toLocaleDateString() : '—'} />
        <Row k="Closed" v={batch.closed_at ? new Date(batch.closed_at).toLocaleDateString() : '—'} />
      </Section>

      <Section title="What was sent (estimated)">
        <Row k="Total Gold" v={`${totals.goldGrams.toFixed(2)} g`} />
        <Row k="Total Silver" v={`${totals.silverGrams.toFixed(2)} g`} />
        <Row k="Total Platinum" v={`${totals.platinumGrams.toFixed(2)} g`} />
        <Row k="Total Palladium" v={`${totals.palladiumGrams.toFixed(2)} g`} />
        <Row k="Est. send-out value" v={formatUSD(batch.estimated_gross_value || totals.estimatedValue)} />
        {totals.byPurity.length > 0 && (
          <div className="pt-2 mt-2 border-t border-black/[0.06] space-y-1">
            {totals.byPurity.map(r => (
              <Row key={`${r.metal}-${r.purity}`} k={`${r.metal} ${formatPurity(r.metal, r.purity)}`} v={`${r.grams.toFixed(2)} g · ${formatUSD(r.estimatedValue)}`} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Assay results (recovered pure metals)">
        <Row k="Pure Gold recovered" v={`${(a.gold_recovered || 0).toFixed(2)} g`} />
        <Row k="Pure Silver recovered" v={`${(a.silver_recovered || 0).toFixed(2)} g`} />
        <Row k="Pure Platinum recovered" v={`${(a.platinum_recovered || 0).toFixed(2)} g`} />
        <Row k="Pure Palladium recovered" v={`${(a.palladium_recovered || 0).toFixed(2)} g`} />
        <Row k="Refiner fee" v={formatUSD(batch.refiner_fee_actual || 0)} />
        <Row k="Refiner reference" v={batch.refiner_reference || '—'} />
        {batch.loss_notes && <Row k="Loss / notes" v={batch.loss_notes} />}
      </Section>

      <Section title={`Market spot prices at assay${batch.assay_spot_price_timestamp ? ` (${new Date(batch.assay_spot_price_timestamp).toLocaleDateString()})` : ''}`}>
        <Row k="Gold (USD/oz)" v={batch.assay_gold_spot_price ? formatUSD(batch.assay_gold_spot_price) : '—'} />
        <Row k="Silver (USD/oz)" v={batch.assay_silver_spot_price ? formatUSD(batch.assay_silver_spot_price) : '—'} />
        <Row k="Platinum (USD/oz)" v={batch.assay_platinum_spot_price ? formatUSD(batch.assay_platinum_spot_price) : '—'} />
        <Row k="Palladium (USD/oz)" v={batch.assay_palladium_spot_price ? formatUSD(batch.assay_palladium_spot_price) : '—'} />
      </Section>

      <Section title="Settlement">
        <Row k="Method" v={settlementLabel} />
        {(batch.settlement_method === 'cash' || batch.settlement_method === 'partial') && (
          <>
            <Row k="Cash received" v={formatUSD(batch.cash_received || 0)} />
            <Row k="Payment method" v={batch.cash_payment_method || '—'} />
            <Row k="Reference #" v={batch.cash_reference || '—'} />
          </>
        )}
        <div className="pt-2 mt-2 border-t border-black/[0.06]">
          <Row k="Final settlement amount" v={formatUSD(batch.final_settlement_amount || batch.cash_received || 0)} bold />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-black/[0.06] bg-white">
      <div className="px-3 py-2 border-b border-black/[0.04] text-[12px] font-semibold text-[#2B2833]">{title}</div>
      <div className="px-3 py-2 space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-[#76707F]">{k}</span>
      <span className={bold ? 'font-semibold text-[#2B2833]' : 'text-[#2B2833]'}>{v}</span>
    </div>
  );
}
