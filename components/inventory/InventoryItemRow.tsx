import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Scissors, Archive, Gem, Watch, Coins, Diamond } from 'lucide-react';
import type { InventoryItemRecord } from './types';
import { DISPOSITIONS } from './types';

interface Props {
  item: InventoryItemRecord;
  onView: (item: InventoryItemRecord) => void;
  onEdit: (item: InventoryItemRecord) => void;
  onPartOut: (item: InventoryItemRecord) => void;
  onArchive: (item: InventoryItemRecord) => void;
  onDispositionChange?: (item: InventoryItemRecord, disposition: string) => void;
  hideProfit?: boolean;
}

const statusColor: Record<string, string> = {
  'In Stock': 'bg-[#E8F5E9] text-[#2E7D32] border-0',
  'Sold': 'bg-[#E8F5E9] text-[#2E7D32] border-0',
  'Sent to Refinery': 'bg-[#FFF9E6] text-[#E65100] border-0',
  'Parted Out': 'bg-[#F3E8FF] text-[#7C3AED] border-0',
  'Archived': 'bg-[#F5F5F5] text-[#76707F] border-0',
};

const dispositionStyles: Record<string, string> = {
  'Undecided': 'bg-[#F5F5F5] text-[#76707F] border-0',
  'Scrap Candidate': 'bg-[#E8F5E9] text-[#2E7D32] border-0',
  'Showroom Candidate': 'bg-[#E3F2FD] text-[#1565C0] border-0',
  'Part-Out Candidate': 'bg-[#F3E8FF] text-[#7C3AED] border-0',
};

const dispositionLabel: Record<string, string> = {
  'Undecided': 'Not Set Available',
  'Scrap Candidate': 'Scrap Available',
  'Showroom Candidate': 'Investment Available',
  'Part-Out Candidate': 'Part-Out Available',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function metalSummary(metals: any) {
  if (!metals) return '—';
  const arr = Array.isArray(metals) ? metals : [];
  if (!arr.length) return '—';
  const first = arr[0];
  if (!first) return '—';
  const karat = first.karat || first.type || '';
  return karat ? `${karat.replace('Gold ', '').replace('k', ' kt')}` : '—';
}

function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'watch': return Watch;
    case 'bullion': return Coins;
    case 'stones': return Diamond;
    default: return Gem;
  }
}

function getCategoryColor(category: string) {
  switch (category?.toLowerCase()) {
    case 'watch': return 'bg-[#E8E6FF] text-[#6B5EF9]';
    case 'bullion': return 'bg-[#FFF9E6] text-[#D4A029]';
    case 'stones': return 'bg-[#FCE4EC] text-[#E91E63]';
    default: return 'bg-[#E8E6FF] text-[#6B5EF9]';
  }
}

export function InventoryItemRow({ item, onView, onEdit, onPartOut, onArchive, onDispositionChange, hideProfit }: Props) {
  const Icon = getCategoryIcon(item.category);
  const colorClass = getCategoryColor(item.category);

  return (
    <tr className="cursor-pointer hover:bg-[#FAFAF9] transition-colors" onClick={() => onView(item)}>
      <td className="px-6 py-4">
        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${colorClass}`}>
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </div>
      </td>
      <td className="px-6 py-4 font-mono text-[13px] text-[#76707F]">{item.id.slice(0, 7)}</td>
      <td className="px-6 py-4">
        <div className="text-[14px] font-medium text-[#2B2833]">{item.description || `${item.category} - ${item.subcategory}`}</div>
        <div className="text-[12px] text-[#A8A3AE]">{item.category}</div>
      </td>
      <td className="px-6 py-4 text-[14px] text-[#2B2833]">{metalSummary(item.metals)}</td>
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        {onDispositionChange ? (
          <Select value={item.disposition} onValueChange={(v) => onDispositionChange(item, v)}>
            <SelectTrigger className={`h-7 w-auto min-w-[130px] text-[11px] font-medium rounded-full px-3 ${dispositionStyles[item.disposition] || 'bg-[#F5F5F5] text-[#76707F]'}`}>
              <SelectValue>{dispositionLabel[item.disposition] || item.disposition}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DISPOSITIONS.map(d => (
                <SelectItem key={d} value={d} className="text-[12px]">{dispositionLabel[d] || d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge className={`text-[11px] rounded-full px-3 py-1 ${dispositionStyles[item.disposition] || ''}`}>
            {dispositionLabel[item.disposition] || item.disposition}
          </Badge>
        )}
      </td>
      <td className="px-6 py-4">
        <Badge className={`text-[11px] rounded-full px-3 py-1 ${statusColor[item.processing_status] || 'bg-[#F5F5F5] text-[#76707F]'}`}>
          {item.processing_status}
        </Badge>
      </td>
      <td className="px-6 py-4 text-[14px] text-[#76707F]">{item.location || '—'}</td>
      <td className="px-6 py-4 text-right text-[14px] font-medium text-[#2B2833] tabular-nums">{fmt(item.payout_amount || 0)}</td>
      <td className="px-6 py-4 text-right text-[14px] font-semibold text-[#2B2833] tabular-nums">
        {fmt(item.estimated_resale_value || item.estimated_scrap_value || item.market_value_at_intake || 0)}
      </td>
      <td className="px-6 py-4 text-[13px] text-[#A8A3AE]">
        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
      </td>
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
              <MoreHorizontal className="h-4 w-4 text-[#76707F]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-xl rounded-[14px] border border-white/60 shadow-2xl">
            <DropdownMenuItem onClick={() => onView(item)} className="rounded-[8px]">
              <Eye className="h-3.5 w-3.5 mr-2 text-[#76707F]" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-[8px]">
              <Edit className="h-3.5 w-3.5 mr-2 text-[#76707F]" /> Edit
            </DropdownMenuItem>
            {item.is_part_out_eligible && (
              <DropdownMenuItem onClick={() => onPartOut(item)} className="rounded-[8px]">
                <Scissors className="h-3.5 w-3.5 mr-2 text-[#76707F]" /> Part Out
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive(item)} className="text-[#F87171] rounded-[8px]">
              <Archive className="h-3.5 w-3.5 mr-2" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}