import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Scissors, Archive, Gem, Watch, Coins, Diamond } from 'lucide-react';
import type { InventoryItemRecord } from './types';
import { DISPOSITIONS } from './types';
import { formatPurityLabel } from '@/components/store/MetalPuritySelect';

interface Props {
  item: InventoryItemRecord;
  onView: (item: InventoryItemRecord) => void;
  onEdit: (item: InventoryItemRecord) => void;
  onPartOut: (item: InventoryItemRecord) => void;
  onArchive: (item: InventoryItemRecord) => void;
  onDispositionChange?: (item: InventoryItemRecord, disposition: string) => void;
  hideProfit?: boolean;
}

// ── Status pills — match approved screenshot colors ──
const statusStyles: Record<string, string> = {
  'In Stock':         'bg-[#E8F5E9] text-[#2E7D32]',
  'Sold':             'bg-[#E8F5E9] text-[#2E7D32]',
  'Sent to Refinery': 'bg-[#FFF9E6] text-[#E65100]',
  'Parted Out':       'bg-[#F3E8FF] text-[#7C3AED]',
  'Archived':         'bg-[#F5F5F5] text-[#76707F]',
};

// ── Disposition pills — match approved screenshot ──
const dispositionStyles: Record<string, string> = {
  'Undecided':          'bg-[#F5F5F5]   text-[#76707F]',
  'Scrap Candidate':    'bg-[#E8F5E9]   text-[#2E7D32]',
  'Showroom Candidate': 'bg-[#E3F2FD]   text-[#1565C0]',
  'Part-Out Candidate': 'bg-[#F3E8FF]   text-[#7C3AED]',
};

// ── Approved screen label map ──
const dispositionLabel: Record<string, string> = {
  'Undecided':          'Not Set Available',
  'Scrap Candidate':    'Scrap Available',
  'Showroom Candidate': 'Investment Available',
  'Part-Out Candidate': 'Part-Out Available',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function firstMetal(metals: any): { type: string; karat: any } | null {
  if (!metals) return null;
  const arr = Array.isArray(metals) ? metals : [];
  const m = arr[0];
  if (!m) return null;
  return { type: String(m.type || m.metal || ''), karat: m.karat };
}

function metalTypeOnly(metals: any): string {
  const m = firstMetal(metals);
  return m?.type || '—';
}

function purityOnly(metals: any): string {
  const m = firstMetal(metals);
  if (!m || !m.type) return '—';
  return formatPurityLabel(m.type, m.karat);
}

// ── Category icon + tile color — matches approved screenshot ──
function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'watch':    return Watch;
    case 'bullion':  return Coins;
    case 'stones':   return Diamond;
    default:         return Gem;
  }
}

// Approved: Jewelry = purple tile, Watch = blue-teal tile
function getCategoryTileClass(category: string): string {
  switch (category?.toLowerCase()) {
    case 'watch':   return 'bg-[#E0F0FF] text-[#4889FA]';
    case 'bullion': return 'bg-[#FFF9E6] text-[#D4A029]';
    case 'stones':  return 'bg-[#FCE4EC] text-[#E91E63]';
    default:        return 'bg-[#ECEAFF] text-[#6B5EF9]';   // Jewelry / default — purple
  }
}

export function InventoryItemRow({
  item, onView, onEdit, onPartOut, onArchive, onDispositionChange, hideProfit,
}: Props) {
  const Icon      = getCategoryIcon(item.category);
  const tileClass = getCategoryTileClass(item.category);
  const statusCls = statusStyles[item.processing_status] || 'bg-[#F5F5F5] text-[#76707F]';
  const dispCls   = dispositionStyles[item.disposition]  || 'bg-[#F5F5F5] text-[#76707F]';
  const dispLabel = dispositionLabel[item.disposition]   || item.disposition;

  return (
    <tr
      className="cursor-pointer hover:bg-[#FAFAF9] transition-colors"
      onClick={() => onView(item)}
    >
      {/* ── Category icon tile ── */}
      <td className="px-5 py-4">
        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${tileClass}`}>
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </div>
      </td>

      {/* ── ID — mono, short ── */}
      <td className="px-4 py-4 font-mono text-[13px] text-[#76707F] whitespace-nowrap">
        {item.id.slice(0, 7)}
      </td>

      {/* ── Description + category sub-label ── */}
      <td className="px-4 py-4">
        <div className="text-[14px] font-medium text-[#2B2833] leading-tight">
          {item.description || `${item.category} - ${item.subcategory}`}
        </div>
        <div className="text-[12px] text-[#A8A3AE] mt-0.5">{item.category}</div>
      </td>

      {/* ── Metal karat ── */}
      <td className="px-4 py-4 text-[14px] text-[#2B2833] whitespace-nowrap">
        {metalSummary(item.metals)}
      </td>

      {/* ── Department / disposition pill ── */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        {onDispositionChange ? (
          <Select value={item.disposition} onValueChange={(v) => onDispositionChange(item, v)}>
            <SelectTrigger
              className={`h-7 w-auto min-w-[130px] text-[11px] font-medium rounded-full px-3 border-0 shadow-none focus:ring-0 ${dispCls}`}
            >
              <SelectValue>{dispLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
              {DISPOSITIONS.map(d => (
                <SelectItem key={d} value={d} className="text-[12px]">
                  {dispositionLabel[d] || d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${dispCls}`}>
            {dispLabel}
          </span>
        )}
      </td>

      {/* ── Status pill ── */}
      <td className="px-4 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${statusCls}`}>
          {item.processing_status}
        </span>
      </td>

      {/* ── Location ── */}
      <td className="px-4 py-4 text-[14px] text-[#76707F] lowercase">
        {item.location || '—'}
      </td>

      {/* ── Cost ── */}
      <td className="px-4 py-4 text-right text-[14px] font-medium text-[#2B2833] tabular-nums whitespace-nowrap">
        {fmt(item.payout_amount || 0)}
      </td>

      {/* ── Market Value ── */}
      <td className="px-4 py-4 text-right text-[14px] font-semibold text-[#2B2833] tabular-nums whitespace-nowrap">
        {fmt(item.estimated_resale_value || item.estimated_scrap_value || item.market_value_at_intake || 0)}
      </td>

      {/* ── Date ── */}
      <td className="px-4 py-4 text-[13px] text-[#A8A3AE] whitespace-nowrap">
        {new Date(item.created_at).toLocaleDateString('en-US', {
          month: 'numeric', day: 'numeric', year: 'numeric',
        })}
      </td>

      {/* ── Actions kebab menu ── */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="btn-icon">
              <MoreHorizontal className="h-4 w-4 text-[#76707F]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white/95 backdrop-blur-xl rounded-[14px] border border-white/60 shadow-2xl min-w-[140px]"
          >
            <DropdownMenuItem
              onClick={() => onView(item)}
              className="text-[13px] text-[#2B2833] rounded-[8px] focus:bg-[#F8F7FB]"
            >
              <Eye className="h-3.5 w-3.5 mr-2 text-[#76707F]" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(item)}
              className="text-[13px] text-[#2B2833] rounded-[8px] focus:bg-[#F8F7FB]"
            >
              <Edit className="h-3.5 w-3.5 mr-2 text-[#76707F]" />
              Edit
            </DropdownMenuItem>
            {item.is_part_out_eligible && (
              <DropdownMenuItem
                onClick={() => onPartOut(item)}
                className="text-[13px] text-[#2B2833] rounded-[8px] focus:bg-[#F8F7FB]"
              >
                <Scissors className="h-3.5 w-3.5 mr-2 text-[#76707F]" />
                Part Out
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-black/[0.04]" />
            <DropdownMenuItem
              onClick={() => onArchive(item)}
              className="text-[13px] text-[#F87171] rounded-[8px] focus:bg-[#FFF5F5] focus:text-[#F87171]"
            >
              <Archive className="h-3.5 w-3.5 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
