import React, { useState, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search, Package, DollarSign, Plus, Download, SlidersHorizontal,
  Gem, Archive, Factory, Sparkles, Layers, X
} from 'lucide-react';
import { useInventoryData } from './inventory/useInventoryData';
import { InventoryItemTable } from './inventory/InventoryItemTable';
import { InventoryDetailDrawer } from './inventory/InventoryDetailDrawer';
import { AddInventoryModal } from './inventory/AddInventoryModal';
import { PartOutModal } from './inventory/PartOutModal';
import { BatchView } from './inventory/BatchView';
import { CATEGORIES, DISPOSITIONS, PROCESSING_STATUSES, LOCATIONS } from './inventory/types';
import type { InventoryItemRecord } from './inventory/types';

interface Store {
  id: string;
  name: string;
}

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
  const [showFilters, setShowFilters] = useState(false);

  const handleView = useCallback((item: InventoryItemRecord) => {
    setSelectedItem(item);
    setShowDetail(true);
  }, []);

  const handleEdit = useCallback((item: InventoryItemRecord) => {
    setSelectedItem(item);
    setShowDetail(true);
  }, []);

  const handlePartOut = useCallback((item: InventoryItemRecord) => {
    setPartOutItem(item);
    setShowPartOut(true);
  }, []);

  const handleArchive = useCallback(async (item: InventoryItemRecord) => {
    try {
      const { error } = await supabase.from('inventory_items')
        .update({
          is_archived: true,
          processing_status: 'Archived',
          archive_reason: 'Manual archive',
          archive_date: new Date().toISOString(),
        } as any)
        .eq('id', item.id);
      if (error) throw error;

      await supabase.from('inventory_status_history').insert({
        item_id: item.id,
        field_changed: 'processing_status',
        old_value: item.processing_status,
        new_value: 'Archived',
        changed_by: employeeId || null,
        notes: 'Manual archive',
      } as any);

      toast.success('Item archived');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Archive failed');
    }
  }, [employeeId, refetch]);

  const handleExportCSV = useCallback(() => {
    const csvItems = activeTab === 'archive' ? archivedItems : activeItems;
    if (csvItems.length === 0) return;
    const rows = csvItems.map(i => [
      i.id.slice(0, 12), i.category, i.subcategory, i.description, i.disposition,
      i.processing_status, i.location, i.payout_amount, i.estimated_resale_value || i.estimated_scrap_value,
      i.created_at.slice(0, 10),
    ].join(','));
    const csv = ['ID,Category,Subcategory,Description,Disposition,Status,Location,Paid,Value,Date', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${storeId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }, [activeTab, archivedItems, activeItems, storeId]);

  const clearFilters = () => {
    setFilters({ search: '', category: '', disposition: '', processing_status: '', location: '', date_preset: '', date_from: '', date_to: '' });
  };

  const hasActiveFilters = filters.category || filters.disposition || filters.processing_status || filters.location || filters.date_preset;

  const getTabItems = () => {
    switch (activeTab) {
      case 'active': return activeItems;
      case 'showroom': return showroomItems;
      case 'scrap': return scrapItems;
      case 'components': return componentItems;
      case 'archive': return archivedItems;
      default: return activeItems;
    }
  };

  if (!currentStore) {
    return (
      <Card><CardContent className="p-6"><p className="text-muted-foreground">Select a store to view inventory.</p></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">{currentStore.name} · {activeItems.length} active items</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <div className="text-xs text-muted-foreground">Total Active Value</div>
            <div className="text-lg font-bold">{fmt(totalActiveValue)}</div>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Inventory
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('active')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="text-xl font-bold">{activeItems.length}</div>
            <div className="text-xs text-muted-foreground">{fmt(totalActiveValue)}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('showroom')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Showroom</span>
            </div>
            <div className="text-xl font-bold">{showroomItems.length}</div>
            <div className="text-xs text-muted-foreground">{fmt(totalShowroomValue)}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('scrap')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Factory className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Scrap Pipeline</span>
            </div>
            <div className="text-xl font-bold">{scrapItems.length}</div>
            <div className="text-xs text-muted-foreground">{fmt(totalScrapValue)}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('archive')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Archived</span>
            </div>
            <div className="text-xl font-bold">{archivedItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 bg-card border rounded-lg p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-9"
          />
        </div>

        {/* Quick filters */}
        <Select value={filters.category} onValueChange={v => setFilters(prev => ({ ...prev, category: v === 'all' ? '' : v }))}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.disposition} onValueChange={v => setFilters(prev => ({ ...prev, disposition: v === 'all' ? '' : v }))}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Disposition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispositions</SelectItem>
            {DISPOSITIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.date_preset} onValueChange={v => setFilters(prev => ({ ...prev, date_preset: v === 'all' ? '' : v }))}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">
            <Package className="h-3.5 w-3.5" /> Active
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{activeItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Batches
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{batches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="showroom" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Showroom
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{showroomItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scrap" className="gap-1.5">
            <Factory className="h-3.5 w-3.5" /> Scrap
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{scrapItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-1.5">
            <Gem className="h-3.5 w-3.5" /> Components
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{componentItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-1.5">
            <Archive className="h-3.5 w-3.5" /> Archive
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{archivedItems.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="mt-4">
          <BatchView
            batches={batches}
            allItems={items}
            onViewItem={handleView}
            onEditItem={handleEdit}
            onPartOutItem={handlePartOut}
            onArchiveItem={handleArchive}
          />
        </TabsContent>

        {['active', 'showroom', 'scrap', 'components', 'archive'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                Loading...
              </div>
            ) : (
              <InventoryItemTable
                items={tab === activeTab ? getTabItems() : []}
                onView={handleView}
                onEdit={handleEdit}
                onPartOut={handlePartOut}
                onArchive={handleArchive}
                hideProfit={hideProfit}
                emptyMessage={
                  tab === 'archive' ? 'No archived items' :
                  tab === 'showroom' ? 'No showroom items — assign disposition to items' :
                  tab === 'scrap' ? 'No scrap pipeline items' :
                  tab === 'components' ? 'No component items — part out an item to create components' :
                  'No active inventory items — complete a Take-In to add inventory'
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Drawer */}
      <InventoryDetailDrawer
        item={selectedItem}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onPartOut={handlePartOut}
        onArchive={handleArchive}
      />

      {/* Add Modal */}
      <AddInventoryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        storeId={storeId}
        employeeId={employeeId}
        onCreated={refetch}
      />

      {/* Part Out Modal */}
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
