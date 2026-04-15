import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Scissors, Archive } from 'lucide-react';
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
  'In Stock': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Sold': 'bg-emerald-100 text-emerald-800',
  'Sent to Refinery': 'bg-orange-100 text-orange-700',
  'Parted Out': 'bg-purple-100 text-purple-700',
  'Archived': 'bg-muted text-muted-foreground',
};

const dispositionStyles: Record<string, string> = {
  'Undecided': 'border-muted-foreground/30 text-muted-foreground',
  'Scrap Candidate': 'border-orange-300 bg-orange-50 text-orange-700',
  'Showroom Candidate': 'border-blue-300 bg-blue-50 text-blue-700',
  'Part-Out Candidate': 'border-purple-300 bg-purple-50 text-purple-700',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function metalSummary(metals: any[]) {
  if (!metals?.length) return '—';
  return metals.map((m: any) => `${m.karat || m.type || ''}${m.weight ? ` ${m.weight}g` : ''}`).join(', ');
}

export function InventoryItemRow({ item, onView, onEdit, onPartOut, onArchive, onDispositionChange, hideProfit }: Props) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onView(item)}>
      <TableCell className="w-10">
        {item.photos?.[0] ? (
          <img src={item.photos[0]} className="w-8 h-8 rounded object-cover flex-shrink-0" alt="" />
        ) : (
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
            {item.category.charAt(0)}
          </div>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{item.id.slice(0, 8)}</TableCell>
      <TableCell>
        <div className="font-medium text-sm">{item.description || `${item.category} - ${item.subcategory}`}</div>
        <div className="text-xs text-muted-foreground">{item.category} · {item.subcategory}</div>
      </TableCell>
      <TableCell className="text-xs">{metalSummary(item.metals)}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {onDispositionChange ? (
          <Select
            value={item.disposition}
            onValueChange={(v) => onDispositionChange(item, v)}
          >
            <SelectTrigger className={`h-7 w-[145px] text-[10px] font-medium border rounded-md ${dispositionStyles[item.disposition] || ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPOSITIONS.map(d => (
                <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className={`text-[10px] ${dispositionStyles[item.disposition] || ''}`}>
            {item.disposition}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[10px] ${statusColor[item.processing_status] || ''}`}>
          {item.processing_status}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">{item.location}</TableCell>
      <TableCell className="text-right tabular-nums text-sm">{fmt(item.payout_amount)}</TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {fmt(item.estimated_resale_value || item.estimated_scrap_value || item.market_value_at_intake)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(item.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(item)}>
              <Eye className="h-3.5 w-3.5 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            {item.is_part_out_eligible && (
              <DropdownMenuItem onClick={() => onPartOut(item)}>
                <Scissors className="h-3.5 w-3.5 mr-2" /> Part Out
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive(item)} className="text-destructive">
              <Archive className="h-3.5 w-3.5 mr-2" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
