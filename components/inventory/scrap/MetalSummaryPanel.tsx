import React from 'react';
import { formatUSD } from '@/lib/utils';
import type { BatchTotals } from './scrapCalc';

interface Props {
  totals: BatchTotals;
  feePercent?: number;
  onFeeChange?: (v: number) => void;
  showFeeEditor?: boolean;
}

export function MetalSummaryPanel({ totals, feePercent = 0, onFeeChange, showFeeEditor }: Props) {
  const fee = (totals.estimatedValue * feePercent) / 100;
  const net = totals.estimatedValue - fee;

  const groupedByMetal = totals.byPurity.reduce<Record<string, typeof totals.byPurity>>((acc, row) => {
    (acc[row.metal] = acc[row.metal] || []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <Stat label="Gold (g)" value={totals.goldGrams.toFixed(2)} />
        <Stat label="Silver (g)" value={totals.silverGrams.toFixed(2)} />
        <Stat label="Platinum (g)" value={totals.platinumGrams.toFixed(2)} />
        <Stat label="Palladium (g)" value={totals.palladiumGrams.toFixed(2)} />
      </div>

      {Object.keys(groupedByMetal).length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">By Metal & Purity</div>
          <div className="rounded-[10px] border border-black/[0.06] divide-y divide-black/[0.04]">
            {Object.entries(groupedByMetal).map(([metal, rows]) => (
              <div key={metal} className="px-3 py-2">
                <div className="text-[12px] font-semibold text-[#2B2833] mb-1">{metal}</div>
                {rows.map(r => (
                  <div key={`${r.metal}-${r.purity}`} className="flex justify-between text-[12px] text-[#2B2833] py-0.5">
                    <span className="text-[#76707F]">{r.purity || '—'}</span>
                    <span className="font-medium">{r.grams.toFixed(2)} g · {formatUSD(r.estimatedValue)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[10px] bg-black/[0.02] border border-black/[0.06] p-3 space-y-1.5">
        <Row label="Gross Estimated Melt Value" value={formatUSD(totals.estimatedValue)} />
        {showFeeEditor ? (
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#76707F]">Refiner Fee %</span>
            <input
              type="number"
              value={feePercent}
              onChange={e => onFeeChange?.(Number(e.target.value) || 0)}
              className="h-7 w-20 text-right rounded-[6px] border border-black/[0.08] bg-white px-2 text-[13px]"
            />
          </div>
        ) : null}
        <Row label="Estimated Fee" value={`− ${formatUSD(fee)}`} />
        <div className="border-t border-black/[0.08] pt-1.5">
          <Row label="Estimated Net" value={formatUSD(net)} bold />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-black/[0.06] bg-white px-3 py-2">
      <div className="text-[10px] text-[#76707F] uppercase tracking-wider">{label}</div>
      <div className="text-[15px] font-semibold text-[#2B2833]">{value}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-[#76707F]">{label}</span>
      <span className={bold ? 'font-semibold text-[#2B2833]' : 'text-[#2B2833]'}>{value}</span>
    </div>
  );
}
