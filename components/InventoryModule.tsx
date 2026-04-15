import React, { useState, useCallback } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search, Package, Plus, Download, Gem, Archive, Factory, Sparkles, Layers, X
} from 'lucide-react';
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

  const clearFilters = () => { setFilters({ search: '', category: '', disposition: '', processing_status: '', location: '', date_preset: '', date_from: '', date_to: '' }); };
  const hasActiveFilters = filters.category || filters.disposition || filters.processing_status || filters.location || filters.date_preset;

  const getTabItems = () => {
    switch (activeTab) {
      case 'showroom': return showroomItems;
      case 'scrap': return scrapItems;
      case 'components': return componentItems;
      case 'archive': return archivedItems;
      default: return activeItems;
    }
  };

  if (!currentStore) {
    return <div className="glass-card p-6"><p className="text-[#76707F] text-[14px]">Select a store to view inventory.</p></div>;
  }

  const tabs = [
    { id: 'active', label: 'Active', icon: Package, count: activeItems.length },
    { id: 'batches', label: 'Batches', icon: Layers, count: batches.length },
    { id: 'showroom', label: 'Showroom', icon: Sparkles, count: showroomItems.length },
    { id: 'scrap', label: 'Credit', icon: Factory, count: scrapItems.length },
    { id: 'components', label: 'Consignment', icon: Gem, count: componentItems.length },
    { id: 'archive', label: 'Auction', icon: Archive, count: archivedItems.length },
  ];

  const summaryCards = [
    { label: 'TOTAL', value: activeItems.length, sub: fmt(totalActiveValue), onClick: () => setActiveTab('active') },
    { label: 'CONSIGNED', value: componentItems.length, sub: fmt(0), onClick: () => setActiveTab('components') },
    { label: 'STORE PIPELINE', value: scrapItems.length, sub: fmt(totalScrapValue), onClick: () => setActiveTab('scrap') },
    { label: 'ARCHIVED', value: archivedItems.length, sub: '', onClick: () => setActiveTab('archive') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient">Inventory</h1>
          <p className="text-[15px] text-[#76707F]">{currentStore.name}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary-dark flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Inventory
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <button key={card.label} onClick={card.onClick} className="kpi-card text-left">
            <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">{card.label}</div>
            <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">{card.value}</div>
            {card.sub && <div className="text-[13px] text-[#76707F] mt-1">{card.sub}</div>}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A3AE]" />
          <input
            placeholder="Search inventory..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="input-glass pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filters.category} onValueChange={v => setFilters(prev => ({ ...prev, category: v === 'all' ? '' : v }))}>
            <SelectTrigger className="w-32 h-9 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.disposition} onValueChange={v => setFilters(prev => ({ ...prev, disposition: v === 'all' ? '' : v }))}>
            <SelectTrigger className="w-36 h-9 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dispositions</SelectItem>
              {DISPOSITIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.date_preset} onValueChange={v => setFilters(prev => ({ ...prev, date_preset: v === 'all' ? '' : v }))}>
            <SelectTrigger className="w-28 h-9 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px]"><SelectValue placeholder="Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-[13px] text-[#76707F] hover:text-[#2B2833] flex items-center gap-1 px-3 py-1.5 rounded-[8px] hover:bg-white/40 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button onClick={handleExportCSV} className="btn-secondary-light text-[13px] px-4 py-2 flex items-center gap-1.5 ml-auto">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/80 text-[#2B2833] shadow-md ring-1 ring-white/70'
                : 'text-[#76707F] hover:text-[#2B2833] hover:bg-white/40'
            }`}
            style={activeTab === tab.id ? { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {activeTab === 'batches' ? (
          <BatchView batches={batches} allItems={items} onViewItem={handleView} onEditItem={handleEdit} onPartOutItem={handlePartOut} onArchiveItem={handleArchive} onDispositionChange={handleDispositionChange} />
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-[#76707F]">
            <div className="animate-spin h-6 w-6 border-2 border-[#6B5EF9] border-t-transparent rounded-full mr-3" />
            Loading...
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
              activeTab === 'archive' ? 'No archived items' :
              activeTab === 'showroom' ? 'No showroom items — assign disposition to items' :
              activeTab === 'scrap' ? 'No scrap pipeline items' :
              activeTab === 'components' ? 'No component items — part out an item to create components' :
              'No active inventory items — complete a Take-In to add inventory'
            }
          />
        )}
      </div>

      <InventoryDetailDrawer item={selectedItem} open={showDetail} onClose={() => setShowDetail(false)} onPartOut={handlePartOut} onArchive={handleArchive} onDispositionChange={handleDispositionChange} />
      <AddInventoryModal open={showAddModal} onClose={() => setShowAddModal(false)} storeId={storeId} employeeId={employeeId} onCreated={refetch} />
      <PartOutModal open={showPartOut} onClose={() => { setShowPartOut(false); setPartOutItem(null); }} parentItem={partOutItem} storeId={storeId} employeeId={employeeId} onComplete={refetch} />
    </div>
  );
}
