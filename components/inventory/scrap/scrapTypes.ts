export type ScrapBatchStatus = 'draft' | 'sent' | 'assay_received' | 'settled' | 'closed';
export type SettlementMethod = '' | 'cash' | 'metal' | 'partial';

export interface ScrapBatchRecord {
  id: string;
  store_id: string;
  batch_number: string;
  status: ScrapBatchStatus;
  refiner_name: string;
  refiner_contact: string;
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

export const SCRAP_STATUS_LABELS: Record<ScrapBatchStatus, string> = {
  draft: 'Draft',
  sent: 'Sent to Refiner',
  assay_received: 'Assay Received',
  settled: 'Settled',
  closed: 'Closed',
};
