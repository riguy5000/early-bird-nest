import React, { useState, useCallback } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Package, Plus, Download, Gem, Archive, Factory, Sparkles, Layers, X } from 'lucide-react';
import { useInventoryData } from './inventory/useInventoryData';
import { InventoryItemTable } from './inventory/InventoryItemTable';
import { InventoryDetailDrawer } from './inventory/InventoryDetailDrawer';
import { AddInventoryModal } from './inventory/AddInventoryModal';
import { PartOutModal } from './inventory/PartOutModal';
import { BatchView } from './inventory/BatchView';
import { CATEGORIES, DISPOSITIONS } from './inventory/types';
import type { InventoryItemRecord } from './inventory/types';

interface Store { id: string; name: string; }

interface InventoryModuleProps {
  currentStore: Store | null;
  employeeId?: string;
  hideProfit?: boolean;
  permissions?: Record<string, boolean>;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function InventoryModule({ currentStore, employeeId = '', hideProfit, permissions }: InventoryModuleProps) {
  const storeId = currentStore?.id || '';
  const {
    items, activeItems, showroomItems, scrapItems, componentItems, archivedItems, batches,
    loading, filters, setFilters, refetch,
    totalActiveValue, totalShowroomValue, totalScrapValue,
  } = useInventoryData(storeId);

  const [activeTab, setActiveTab] = useState('active');
  const [selectedItem, setSelectedItem] = useState<InventoryItemRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPartOut, setShowPartOut] = useState(false);
  const [partOutItem, setPartOutItem] = useState<InventoryItemRecord | null>(null);

  const handleView = useCallback((item: InventoryItemRecord) => { setSelectedItem(item); setShowDetail(true); }, []);
  const handleEdit = useCallback((item: InventoryItemRecord) => { setSelectedItem(item); setShowDetail(true); }, []);
  const handlePartOut = useCallback((item: InventoryItemRecord) => { setPartOutItem(item); setShowPartOut(true); }, []);

  const handleDispositionChange = useCallback(async (item: InventoryItemRecord, disposition: string) => {
    try {
      const { error } = await supabase.from('inventory_items').update({ disposition } as any).eq('id', item.id);
      if (error) throw error;
      await supabase.from('inventory_status_history').insert({ item_id: item.id, field_changed: 'disposition', old_value: item.disposition, new_value: disposition, changed_by: employeeId || null, notes: `Changed disposition to ${disposition}` } as any);
      toast.success(`Disposition set to ${disposition}`);
      refetch();
    } catch (err: any) { toast.error(err.message || 'Failed to update disposition'); }
  }, [employeeId, refetch]);

  const handleArchive = useCallback(async (item: InventoryItemRecord) => {
    try {
      const { error } = await supabase.from('inventory_items').update({ is_archived: true, processing_status: 'Archived', archive_reason: 'Manual archive', archive_date: new Date().toISOString() } as any).eq('id', item.id);
      if (error) throw error;
      await supabase.from('inventory_status_history').insert({ item_id: item.id, field_changed: 'processing_status', old_value: item.processing_status, new_value: 'Archived', changed_by: employeeId || null, notes: 'Manual archive' } as any);
      toast.success('Item archived');
      refetch();
    } catch (err: any) { toast.error(err.message || 'Archive failed'); }
  }, [employeeId, refetch]);

  const handleExportCSV = useCallback(() => {
    const csvItems = activeTab === 'archive' ? archivedItems : activeItems;
    if (csvItems.length === 0) return;
    const rows = csvItems.map(i => [i.id.slice(0, 12), i.category, i.subcategory, i.description, i.disposition, i.processing_status, i.location, i.payout_amount, i.estimated_resale_value || i.estimated_scrap_value, i.created_at.slice(0, 10)].join(','));
    const csv = ['ID,Category,Subcategory,Description,Disposition,Status,Location,Paid,Value,Date', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${storeId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }, [activeTab, archivedItems, activeItems, storeId]);

  const clearFilters = () => setFilters({ search: '', category: '', disposition: '', processing_status: '', location: '', date_preset: '', date_from: '', date_to: '' });
  const hasActiveFilters = !!(filters.category || filters.disposition || filters.processing_status || filters.location || filters.date_preset);

  const getTabItems = () => {
    switch (activeTab) {
      case 'showroom':    return showroomItems;
      case 'scrap':       return scrapItems;
      case 'components':  return componentItems;
      case 'archive':     return archivedItems;
      default:            return activeItems;
    }
  };

  if (!currentStore) {
    return <div className="glass-card p-6"><p className="text-[#76707F] text-[14px]">Select a store to view inventory.</p></div>;
  }

  // ── Tab definitions — labels match approved screenshot exactly ──
  const tabs = [
    { id: 'active',     label: 'Active' },
    { id: 'batches',    label: 'Batches' },
    { id: 'showroom',   label: 'Showroom' },
    { id: 'scrap',      label: 'Credit' },
    { id: 'components', label: 'Consignment' },
    { id: 'archive',    label: 'Auction' },
  ];

  // ── Stat cards — match approved screenshot (flat white, uppercase label) ──
  const summaryCards = [
    { label: 'TOTAL',          value: activeItems.length,    sub: fmt(totalActiveValue),  onClick: () => setActiveTab('active') },
    { label: 'CONSIGNED',      value: componentItems.length, sub: fmt(0),                 onClick: () => setActiveTab('components') },
    { label: 'STORE PIPELINE', value: scrapItems.length,     sub: fmt(totalScrapValue),   onClick: () => setActiveTab('scrap') },
    { label: 'ARCHIVED',       value: archivedItems.length,  sub: '',                     onClick: () => setActiveTab('archive') },
  ];

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">Inventory</h1>
          <p className="text-[15px] text-[#76707F] mt-0.5">{currentStore.name}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary-dark flex items-center gap-2 mt-1"
        >
          <Plus className="h-4 w-4" />
          Add Inventory
        </button>
      </div>

      {/* ── Stat cards — flat white, no icons, uppercase label ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="text-left bg-white/85 backdrop-blur-sm rounded-[16px] p-5 ring-1 ring-white/60 hover:shadow-md transition-all"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">
              {card.label}
            </div>
            <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight leading-none">
              {card.value}
            </div>
            {card.sub && (
              <div className="text-[13px] text-[#76707F] mt-2">{card.sub}</div>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + Filters — single glass card ── */}
      <div className="glass-card px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Search input — left, flex-1 */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A3AE] pointer-events-none" />
            <input
              placeholder="Search inventory..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input-glass pl-10"
            />
          </div>

          {/* Filter controls — right cluster */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Category dropdown */}
            <Select value={filters.category || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, category: v === 'all' ? '' : v }))}>
              <SelectTrigger className="h-9 w-32 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px] text-[#2B2833]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Department / disposition dropdown */}
            <Select value={filters.disposition || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, disposition: v === 'all' ? '' : v }))}>
              <SelectTrigger className="h-9 w-36 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px] text-[#2B2833]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
                <SelectItem value="all">All Dispositions</SelectItem>
                {DISPOSITIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Date dropdown */}
            <Select value={filters.date_preset || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, date_preset: v === 'all' ? '' : v }))}>
              <SelectTrigger className="h-9 w-24 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px] text-[#2B2833]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[13px] text-[#76707F] hover:text-[#2B2833] px-2 py-1.5 rounded-[8px] hover:bg-white/40 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            {/* Export — plain text style, matches screenshot */}
            <button
              onClick={handleExportCSV}
              className="text-[13px] font-medium text-[#2B2833] hover:text-[#6B5EF9] px-2 py-1.5 transition-colors"
            >
              Export
            </button>
          </div>
        </div>

        {/* ── View tabs — inside search card, second row ── */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-black/[0.04]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-[8px] text-[14px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2B2833] text-white shadow-sm'
                  : 'text-[#76707F] hover:text-[#2B2833] hover:bg-black/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="glass-card overflow-hidden">
        {activeTab === 'batches' ? (
          <BatchView
            batches={batches}
            allItems={items}
            onViewItem={handleView}
            onEditItem={handleEdit}
            onPartOutItem={handlePartOut}
            onArchiveItem={handleArchive}
            onDispositionChange={handleDispositionChange}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-[#76707F] gap-3">
            <div className="h-5 w-5 border-2 border-[#6B5EF9] border-t-transparent rounded-full animate-spin" />
            <span className="text-[14px]">Loading...</span>
          </div>
        ) : (
          <InventoryItemTable
            items={getTabItems()}
            onView={handleView}
            onEdit={handleEdit}
            onPartOut={handlePartOut}
            onArchive={handleArchive}
            onDispositionChange={handleDispositionChange}
            hideProfit={hideProfit}
            emptyMessage={
              activeTab === 'archive'     ? 'No archived items' :
              activeTab === 'showroom'    ? 'No showroom items — assign disposition to items' :
              activeTab === 'scrap'       ? 'No scrap pipeline items' :
              activeTab === 'components'  ? 'No component items — part out an item to create components' :
              'No active inventory items — complete a Take-In to add inventory'
            }
          />
        )}
      </div>

      {/* Sub-components */}
      <InventoryDetailDrawer
        item={selectedItem}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onPartOut={handlePartOut}
        onArchive={handleArchive}
        onDispositionChange={handleDispositionChange}
      />
      <AddInventoryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        storeId={storeId}
        employeeId={employeeId}
        onCreated={refetch}
      />
      <PartOutModal
        open={showPartOut}
        onClose={() => { setShowPartOut(false); setPartOutItem(null); }}
        parentItem={partOutItem}
        storeId={storeId}
        employeeId={employeeId}
        onComplete={refetch}
      />
    </div>
  );
}
