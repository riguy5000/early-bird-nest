export type ScrapBatchStatus = 'draft' | 'sent' | 'assay_received' | 'settled' | 'closed';
export type SettlementMethod = '' | 'cash' | 'metal' | 'partial';

export interface ScrapBatchRecord {
  id: string;
  store_id: string;
  batch_number: string;
  status: ScrapBatchStatus;
  refiner_id: string | null;
  refiner_name: string;
  refiner_contact: string;
  refiner_address: string;
  refiner_phone: string;
  refiner_email: string;
  shipping_method: string;
  tracking_number: string;
  insurance_amount: number;
  notes: string;
  created_by: string | null;
  sent_at: string | null;
  assay_received_at: string | null;
  settled_at: string | null;
  closed_at: string | null;
  estimated_gross_value: number;
  estimated_fee: number;
  estimated_net_value: number;
  assay_data: AssayData;
  refiner_reference: string;
  refiner_fee_actual: number;
  loss_notes: string;
  final_settlement_amount: number;
  settlement_method: SettlementMethod;
  cash_received: number;
  cash_payment_method: string;
  cash_reference: string;
  cash_received_at: string | null;
  attachment_urls: string[];
  assay_gold_spot_price: number;
  assay_silver_spot_price: number;
  assay_platinum_spot_price: number;
  assay_palladium_spot_price: number;
  assay_spot_price_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssayData {
  gold_recovered?: number;
  silver_recovered?: number;
  platinum_recovered?: number;
  palladium_recovered?: number;
  purity_breakdown?: string;
}

export interface ScrapBatchItemRecord {
  id: string;
  batch_id: string;
  inventory_item_id: string;
  send_out_weight: number;
  original_weight: number;
  metal: string;
  purity: string;
  estimated_value: number;
  notes: string;
}

export interface ScrapBatchActivityRecord {
  id: string;
  batch_id: string;
  event_type: string;
  details: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export interface RefinerRecord {
  id: string;
  store_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const SCRAP_STATUS_LABELS: Record<ScrapBatchStatus, string> = {
  draft: 'Draft',
  sent: 'Sent to Refiner',
  assay_received: 'Assay Received',
  settled: 'Closed',
  closed: 'Closed',
};

/** Map any internal status to one of the 4 main user-facing statuses. */
export function displayStatus(s: ScrapBatchStatus): 'draft' | 'sent' | 'assay_received' | 'closed' {
  if (s === 'settled' || s === 'closed') return 'closed';
  return s;
}

/** Format a metal purity for display. Gold karats get a trailing "K". */
export function formatPurity(metal: string, purity: string): string {
  if (!purity) return '—';
  const m = (metal || '').toLowerCase();
  const p = String(purity).trim();
  if (m === 'gold') {
    // Already has K?
    if (/k$/i.test(p)) return p.toUpperCase();
    // Numeric karat like "14"
    if (/^\d{1,2}(\.\d+)?$/.test(p)) return `${p}K`;
  }
  return p;
}
