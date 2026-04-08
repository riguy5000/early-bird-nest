import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InventoryItemRecord, InventoryBatchRecord, InventoryFilters } from './types';

export function useInventoryData(storeId: string) {
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [batches, setBatches] = useState<InventoryBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '', category: '', disposition: '', processing_status: '',
    location: '', date_preset: '', date_from: '', date_to: '',
  });

  const loadItems = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      let query = supabase.from('inventory_items').select('*').eq('store_id', storeId).order('created_at', { ascending: false });

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.disposition) query = query.eq('disposition', filters.disposition);
      if (filters.processing_status) query = query.eq('processing_status', filters.processing_status);
      if (filters.location) query = query.eq('location', filters.location);
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,subcategory.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,take_in_item_ref.ilike.%${filters.search}%`);
      }

      // Date filtering
      if (filters.date_preset === 'today') {
        query = query.gte('created_at', new Date().toISOString().slice(0, 10));
      } else if (filters.date_preset === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte('created_at', d.toISOString());
      } else if (filters.date_preset === '30d') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        query = query.gte('created_at', d.toISOString());
      } else if (filters.date_preset === '90d') {
        const d = new Date(); d.setDate(d.getDate() - 90);
        query = query.gte('created_at', d.toISOString());
      } else if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
        if (filters.date_to) query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems((data || []) as unknown as InventoryItemRecord[]);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId, filters]);

  const loadBatches = useCallback(async () => {
    if (!storeId) return;
    try {
      const { data, error } = await supabase
        .from('inventory_batches')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBatches((data || []) as unknown as InventoryBatchRecord[]);
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  }, [storeId]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadBatches(); }, [loadBatches]);

  const refetch = useCallback(() => {
    loadItems();
    loadBatches();
  }, [loadItems, loadBatches]);

  // Computed subsets
  const activeItems = items.filter(i => !i.is_archived && i.processing_status !== 'Archived');
  const showroomItems = items.filter(i => i.disposition === 'Showroom Candidate' || i.processing_status === 'In Showcase' || i.processing_status === 'Listed for Sale' || i.processing_status === 'Ready for Showroom');
  const scrapItems = items.filter(i => i.disposition === 'Scrap Candidate' || i.processing_status === 'Ready for Scrap' || i.processing_status === 'Sent to Refinery');
  const componentItems = items.filter(i => i.category === 'Components' || i.parent_item_id != null);
  const archivedItems = items.filter(i => i.is_archived || i.processing_status === 'Archived');

  const totalActiveValue = activeItems.reduce((s, i) => s + (i.estimated_resale_value || i.estimated_scrap_value || i.market_value_at_intake || 0), 0);
  const totalShowroomValue = showroomItems.reduce((s, i) => s + (i.estimated_resale_value || i.selling_price || i.market_value_at_intake || 0), 0);
  const totalScrapValue = scrapItems.reduce((s, i) => s + (i.estimated_scrap_value || i.market_value_at_intake || 0), 0);

  return {
    items, activeItems, showroomItems, scrapItems, componentItems, archivedItems, batches,
    loading, filters, setFilters, refetch,
    totalActiveValue, totalShowroomValue, totalScrapValue,
  };
}
