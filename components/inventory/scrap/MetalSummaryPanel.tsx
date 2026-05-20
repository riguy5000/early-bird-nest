import React from 'react';
import { formatUSD } from '@/lib/utils';
import { formatPurity } from './scrapTypes';
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

  const metalEmoji: Record<string, string> = { Gold: '🟡', Silver: '⚪', Platinum: '⚙️', Palladium: '🔘' };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[12px] text-[#76707F] mb-2">Total weights across all items in this batch.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Gold" value={`${totals.goldGrams.toFixed(2)} g`} />
          <Stat label="Silver" value={`${totals.silverGrams.toFixed(2)} g`} />
          <Stat label="Platinum" value={`${totals.platinumGrams.toFixed(2)} g`} />
          <Stat label="Palladium" value={`${totals.palladiumGrams.toFixed(2)} g`} />
        </div>
      </div>

      {Object.keys(groupedByMetal).length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-semibold text-[#2B2833]">Breakdown by metal &amp; purity</div>
          <div className="space-y-2">
            {Object.entries(groupedByMetal).map(([metal, rows]) => (
              <div key={metal} className="rounded-[10px] border border-black/[0.06] bg-white">
                <div className="px-3 py-2 border-b border-black/[0.04] text-[12px] font-semibold text-[#2B2833] flex items-center gap-1.5">
                  <span>{metalEmoji[metal] || '◾'}</span> {metal}
                </div>
                <div className="divide-y divide-black/[0.04]">
                  {rows.map(r => (
                    <div key={`${r.metal}-${r.purity}`} className="px-3 py-1.5 flex justify-between text-[13px]">
                      <span className="text-[#76707F]">{formatPurity(r.metal, r.purity)}</span>
                      <span className="text-[#2B2833]">
                        <span className="font-medium">{r.grams.toFixed(2)} g</span>
                        <span className="text-[#76707F]"> · est. </span>
                        <span className="font-medium">{formatUSD(r.estimatedValue)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[10px] bg-[#FAF8F2] border border-black/[0.06] p-3 space-y-1.5">
        <Row label="Estimated melt value" value={formatUSD(totals.estimatedValue)} />
        {showFeeEditor ? (
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#76707F]">Refiner fee %</span>
            <input
              type="number"
              value={feePercent}
              onChange={e => onFeeChange?.(Number(e.target.value) || 0)}
              className="h-7 w-20 text-right rounded-[6px] border border-black/[0.08] bg-white px-2 text-[13px]"
              style={{ MozAppearance: 'textfield' } as any}
            />
          </div>
        ) : (
          <Row label="Estimated fee" value={`− ${formatUSD(fee)}`} />
        )}
        <div className="border-t border-black/[0.08] pt-1.5">
          <Row label="Estimated net" value={formatUSD(net)} bold />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-black/[0.06] bg-white px-3 py-2">
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
