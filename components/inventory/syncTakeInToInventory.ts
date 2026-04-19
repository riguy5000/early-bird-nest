import { supabase } from '@/integrations/supabase/client';

/**
 * When a Take-In transaction is completed as a real purchase,
 * create inventory batch + inventory items automatically.
 */
export async function syncTakeInToInventory(transactionData: {
  batchId: string;
  storeId: string;
  employeeId: string;
  items: any[];
  customer: any | null;
  paymentMethod: string;
  totalMarketValue: number;
  totalPayout: number;
  status: string;
  batchPhotos?: string[];
}) {
  // Only sync completed purchases, not quotes or drafts
  if (transactionData.status !== 'Purchase') return null;

  try {
    // Find customer_id if customer was saved
    let customerId: string | null = null;
    if (transactionData.customer?.id) {
      customerId = transactionData.customer.id;
    }

    // Find employee profile id
    let employeeProfileId: string | null = null;
    if (transactionData.employeeId) {
      const { data: ep } = await supabase
        .from('employee_profiles')
        .select('id')
        .eq('auth_user_id', transactionData.employeeId)
        .maybeSingle();
      employeeProfileId = ep?.id || null;
    }

    // Create inventory batch with batch photos (original full batch image)
    const { data: batch, error: batchErr } = await supabase.from('inventory_batches').insert({
      store_id: transactionData.storeId,
      take_in_ref: transactionData.batchId,
      customer_id: customerId,
      employee_id: employeeProfileId,
      total_payout: transactionData.totalPayout,
      total_items: transactionData.items.length,
      source: 'take-in',
      status: 'active',
      batch_photos: transactionData.batchPhotos || [],
    } as any).select().single();

    if (batchErr) throw batchErr;
    const batchId = (batch as any).id;

    // Create inventory items
    const inventoryItems = transactionData.items.map((item: any) => ({
      store_id: transactionData.storeId,
      batch_id: batchId,
      category: item.category || 'Jewelry',
      subcategory: item.subType || '',
      description: `${item.category}${item.subType ? ' - ' + item.subType : ''}`,
      disposition: 'Undecided',
      processing_status: 'In Stock',
      metals: item.metals || [],
      stones: item.stones || [],
      // Pack category-specific specs into watch_info jsonb (no migration needed).
      // For Watch items, preserve existing watchInfo and merge category specs alongside.
      watch_info: { ...(item.watchInfo || {}), specs: item.specs || {}, itemType: item.itemType || '' },
      test_method: item.testMethod || '',
      weight: (item.metals || []).reduce((s: number, m: any) => s + (parseFloat(m.weight) || 0), 0),
      market_value_at_intake: item.marketValue || 0,
      payout_amount: item.payoutAmount || 0,
      payout_percentage: item.payoutPercentage || 0,
      photos: item.photos || [],
      notes: item.notes || '',
      source: 'take-in',
      take_in_item_ref: item.id || '',
      customer_id: customerId,
      employee_id: employeeProfileId,
      location: 'safe',
      is_scrap_eligible: true,
      is_part_out_eligible: item.category === 'Jewelry',
      is_resellable: false,
    }));

    const { error: itemsErr } = await supabase.from('inventory_items').insert(inventoryItems as any);
    if (itemsErr) throw itemsErr;

    return batchId;
  } catch (err) {
    console.error('Failed to sync take-in to inventory:', err);
    throw err;
  }
}
