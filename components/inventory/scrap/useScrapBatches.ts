import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ScrapBatchRecord,
  ScrapBatchItemRecord,
  ScrapBatchActivityRecord,
  ScrapBatchStatus,
  SettlementMethod,
  AssayData,
  RefinerRecord,
} from './scrapTypes';
import type { InventoryItemRecord } from '../types';
import { primaryMetalForItem } from './scrapCalc';

const sb = supabase as any;

export function useScrapBatches(storeId: string) {
  const [batches, setBatches] = useState<ScrapBatchRecord[]>([]);
  const [items, setItems] = useState<ScrapBatchItemRecord[]>([]);
  const [refiners, setRefiners] = useState<RefinerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        sb.from('scrap_batches').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
        sb.from('refiners').select('*').eq('store_id', storeId).eq('is_active', true).order('name'),
      ]);
      if (bRes.error) throw bRes.error;
      const list = (bRes.data || []) as ScrapBatchRecord[];
      setBatches(list);
      setRefiners((rRes.data || []) as RefinerRecord[]);

      if (list.length === 0) { setItems([]); return; }
      const ids = list.map(b => b.id);
      const { data: itemData, error: iErr } = await sb.from('scrap_batch_items').select('*').in('batch_id', ids);
      if (iErr) throw iErr;
      setItems((itemData || []) as ScrapBatchItemRecord[]);
    } catch (err: any) {
      console.error('useScrapBatches load:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const logActivity = async (batchId: string, eventType: string, details: Record<string, unknown> = {}) => {
    await sb.from('scrap_batch_activity').insert({ batch_id: batchId, event_type: eventType, details });
  };

  const createDraft = useCallback(async (selectedItems: InventoryItemRecord[], employeeId?: string) => {
    const { data: batch, error } = await sb.from('scrap_batches').insert({
      store_id: storeId,
      status: 'draft',
      created_by: employeeId || null,
    }).select().single();
    if (error) { toast.error(error.message); return null; }

    const rows = selectedItems.map(it => {
      const p = primaryMetalForItem(it);
      return {
        batch_id: batch.id,
        inventory_item_id: it.id,
        send_out_weight: p.weight,
        original_weight: p.weight,
        metal: p.metal,
        purity: p.purity,
        estimated_value: it.estimated_scrap_value || it.market_value_at_intake || 0,
        notes: '',
      };
    });
    if (rows.length > 0) {
      const { error: iErr } = await sb.from('scrap_batch_items').insert(rows);
      if (iErr) toast.error(iErr.message);
    }
    await logActivity(batch.id, 'batch_created', { item_count: selectedItems.length });
    toast.success('Scrap batch draft created');
    await load();
    return batch.id as string;
  }, [storeId, load]);

  const updateBatch = useCallback(async (batchId: string, patch: Partial<ScrapBatchRecord>) => {
    const { error } = await sb.from('scrap_batches').update(patch).eq('id', batchId);
    if (error) { toast.error(error.message); return false; }
    await load();
    return true;
  }, [load]);

  const updateBatchItem = useCallback(async (itemId: string, patch: Partial<ScrapBatchItemRecord>) => {
    const { error } = await sb.from('scrap_batch_items').update(patch).eq('id', itemId);
    if (error) { toast.error(error.message); return false; }
    await load();
    return true;
  }, [load]);

  const removeBatchItem = useCallback(async (itemId: string) => {
    const { error } = await sb.from('scrap_batch_items').delete().eq('id', itemId);
    if (error) { toast.error(error.message); return false; }
    await load();
    return true;
  }, [load]);

  const finalizeSendOut = useCallback(async (
    batchId: string,
    header: Partial<ScrapBatchRecord>,
    estimates: { gross: number; fee: number; net: number },
    inventoryItemIds: string[],
  ) => {
    if (inventoryItemIds.length === 0) { toast.error('Batch needs at least one item'); return false; }

    const { error: bErr } = await sb.from('scrap_batches').update({
      ...header,
      estimated_gross_value: estimates.gross,
      estimated_fee: estimates.fee,
      estimated_net_value: estimates.net,
      status: 'sent' as ScrapBatchStatus,
      sent_at: new Date().toISOString(),
    }).eq('id', batchId);
    if (bErr) { toast.error(bErr.message); return false; }

    const { error: iErr } = await sb.from('inventory_items').update({
      is_archived: true,
      processing_status: 'Sent to Refinery',
      archive_reason: 'Sent to Scrap',
      archive_date: new Date().toISOString(),
      scrap_batch_id: batchId,
    }).in('id', inventoryItemIds);
    if (iErr) { toast.error(iErr.message); return false; }

    await logActivity(batchId, 'batch_sent', { item_count: inventoryItemIds.length, refiner: header.refiner_name, tracking: header.tracking_number });
    toast.success('Batch sent to refiner');
    await load();
    return true;
  }, [load]);

  const recordAssay = useCallback(async (
    batchId: string,
    assay: AssayData,
    fee: number,
    lossNotes: string,
    refinerRef: string,
    finalAmount: number,
    spotPrices?: { gold: number; silver: number; platinum: number; palladium: number },
  ) => {
    const patch: any = {
      assay_data: assay,
      refiner_fee_actual: fee,
      loss_notes: lossNotes,
      refiner_reference: refinerRef,
      final_settlement_amount: finalAmount,
      status: 'assay_received' as ScrapBatchStatus,
      assay_received_at: new Date().toISOString(),
    };
    if (spotPrices) {
      patch.assay_gold_spot_price = spotPrices.gold;
      patch.assay_silver_spot_price = spotPrices.silver;
      patch.assay_platinum_spot_price = spotPrices.platinum;
      patch.assay_palladium_spot_price = spotPrices.palladium;
      patch.assay_spot_price_timestamp = new Date().toISOString();
    }
    const { error } = await sb.from('scrap_batches').update(patch).eq('id', batchId);
    if (error) { toast.error(error.message); return false; }
    await logActivity(batchId, 'assay_received', { final_amount: finalAmount });
    toast.success('Assay recorded');
    await load();
    return true;
  }, [load]);

  const recordSettlement = useCallback(async (
    batchId: string,
    method: SettlementMethod,
    cash: { amount: number; method: string; reference: string } | null,
  ) => {
    const now = new Date().toISOString();
    const patch: any = {
      settlement_method: method,
      status: 'closed' as ScrapBatchStatus,
      settled_at: now,
      closed_at: now,
    };
    if (cash) {
      patch.cash_received = cash.amount;
      patch.cash_payment_method = cash.method;
      patch.cash_reference = cash.reference;
      patch.cash_received_at = now;
    }
    const { error } = await sb.from('scrap_batches').update(patch).eq('id', batchId);
    if (error) { toast.error(error.message); return false; }
    await logActivity(batchId, 'settlement_recorded', { method, cash });
    await logActivity(batchId, 'batch_closed', {});
    toast.success('Batch closed');
    await load();
    return true;
  }, [load]);

  const addReturnedMetal = useCallback(async (
    batchId: string,
    metalInfo: {
      subcategory: string; metal: string; purity: string; weight: number; quantity: number;
      cost_basis: number; market_value: number; location: string; notes: string;
    },
  ) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) { toast.error('Batch not found'); return false; }
    const records = Array.from({ length: Math.max(1, metalInfo.quantity) }, () => ({
      store_id: storeId,
      category: 'Bullion',
      subcategory: metalInfo.subcategory,
      description: `${metalInfo.metal} ${metalInfo.purity} ${metalInfo.subcategory} (from refiner ${batch.batch_number})`,
      disposition: 'Investment Candidate',
      processing_status: 'In Stock',
      metals: [{ type: metalInfo.metal, karat: metalInfo.purity, weight: metalInfo.weight }],
      weight: metalInfo.weight,
      payout_amount: metalInfo.cost_basis,
      market_value_at_intake: metalInfo.market_value,
      estimated_scrap_value: metalInfo.market_value,
      estimated_resale_value: metalInfo.market_value,
      location: metalInfo.location || 'safe',
      notes: `Refiner return — Scrap Batch ${batch.batch_number}. ${metalInfo.notes}`,
      source: 'refiner-return',
      take_in_item_ref: batch.batch_number,
      is_resellable: true,
    }));
    const { error } = await sb.from('inventory_items').insert(records);
    if (error) { toast.error(error.message); return false; }
    await logActivity(batchId, 'metal_returned_to_inventory', { quantity: metalInfo.quantity, metal: metalInfo.metal });
    toast.success(`Added ${records.length} item(s) to inventory`);
    return true;
  }, [storeId, batches]);

  const closeBatch = useCallback(async (batchId: string) => {
    const { error } = await sb.from('scrap_batches').update({
      status: 'closed' as ScrapBatchStatus, closed_at: new Date().toISOString(),
    }).eq('id', batchId);
    if (error) { toast.error(error.message); return false; }
    await logActivity(batchId, 'batch_closed', {});
    toast.success('Batch closed');
    await load();
    return true;
  }, [load]);

  /** Delete a draft batch. Items return to Scrap Candidate (no archive change needed; draft items were never archived). */
  const deleteDraft = useCallback(async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return false;
    if (batch.status !== 'draft') { toast.error('Only draft batches can be deleted'); return false; }
    const { error } = await sb.from('scrap_batches').delete().eq('id', batchId);
    if (error) { toast.error(error.message); return false; }
    toast.success('Draft deleted. Items returned to Scrap Candidates.');
    await load();
    return true;
  }, [batches, load]);

  /** Admin archive of a non-draft batch (restores items to inventory if requested). */
  const archiveBatch = useCallback(async (batchId: string) => {
    const { error } = await sb.from('scrap_batches').update({
      status: 'closed' as ScrapBatchStatus, closed_at: new Date().toISOString(),
    }).eq('id', batchId);
    if (error) { toast.error(error.message); return false; }
    toast.success('Batch archived');
    await load();
    return true;
  }, [load]);

  const loadActivity = useCallback(async (batchId: string): Promise<ScrapBatchActivityRecord[]> => {
    const { data } = await sb.from('scrap_batch_activity').select('*').eq('batch_id', batchId).order('created_at', { ascending: false });
    return (data || []) as ScrapBatchActivityRecord[];
  }, []);

  // Refiner CRUD
  const saveRefiner = useCallback(async (input: Partial<RefinerRecord> & { name: string }) => {
    if (!input.name?.trim()) { toast.error('Refiner name required'); return null; }
    if (input.id) {
      const { id, ...patch } = input;
      const { error } = await sb.from('refiners').update(patch).eq('id', id);
      if (error) { toast.error(error.message); return null; }
      await load();
      return id;
    }
    const { data, error } = await sb.from('refiners').insert({
      store_id: storeId,
      name: input.name,
      contact_person: input.contact_person || '',
      phone: input.phone || '',
      email: input.email || '',
      address: input.address || '',
      notes: input.notes || '',
    }).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success('Refiner saved');
    await load();
    return data?.id as string;
  }, [storeId, load]);

  /** Remove an item from Scrap Candidates without deleting it (returns to Undecided). */
  const removeCandidate = useCallback(async (inventoryItemId: string) => {
    const { error } = await sb.from('inventory_items')
      .update({ disposition: 'Undecided' })
      .eq('id', inventoryItemId);
    if (error) { toast.error(error.message); return false; }
    toast.success('Removed from Scrap Candidates');
    return true;
  }, []);

  return {
    batches, items, refiners, loading, refetch: load,
    createDraft, updateBatch, updateBatchItem, removeBatchItem,
    finalizeSendOut, recordAssay, recordSettlement, addReturnedMetal,
    closeBatch, deleteDraft, archiveBatch, loadActivity, saveRefiner,
    removeCandidate,
  };
}
