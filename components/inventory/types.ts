export interface InventoryItemRecord {
  id: string;
  batch_id: string | null;
  store_id: string;
  category: string;
  subcategory: string;
  description: string;
  disposition: 'Undecided' | 'Scrap Candidate' | 'Showroom Candidate' | 'Part-Out Candidate';
  processing_status: string;
  metals: any[];
  stones: any[];
  watch_info: any;
  test_method: string;
  weight: number;
  market_value_at_intake: number;
  payout_amount: number;
  payout_percentage: number;
  estimated_scrap_value: number;
  estimated_resale_value: number;
  selling_price: number;
  sold_amount: number;
  sold_date: string | null;
  sale_channel: string;
  location: string;
  location_notes: string;
  photos: string[];
  notes: string;
  is_resellable: boolean;
  is_scrap_eligible: boolean;
  is_part_out_eligible: boolean;
  is_archived: boolean;
  parent_item_id: string | null;
  source: string;
  take_in_item_ref: string;
  customer_id: string | null;
  employee_id: string | null;
  archive_reason: string;
  archive_date: string | null;
  sent_to_refinery_date: string | null;
  refinery_lot_id: string | null;
  showroom_ready: boolean;
  showroom_location: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer_name?: string;
  employee_name?: string;
  batch_ref?: string;
  children_count?: number;
}

export interface InventoryBatchRecord {
  id: string;
  store_id: string;
  take_in_ref: string | null;
  customer_id: string | null;
  employee_id: string | null;
  total_payout: number;
  total_items: number;
  batch_notes: string;
  batch_photos: string[];
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined
  customer_name?: string;
  employee_name?: string;
  items?: InventoryItemRecord[];
}

export interface RefineryLotRecord {
  id: string;
  store_id: string;
  lot_number: string;
  item_ids: string[];
  sent_date: string | null;
  expected_melt_value: number;
  actual_settlement: number;
  difference: number;
  status: string;
  notes: string;
  created_at: string;
}

export interface InventoryFilters {
  search: string;
  category: string;
  disposition: string;
  processing_status: string;
  location: string;
  date_preset: string;
  date_from: string;
  date_to: string;
}

export const CATEGORIES = ['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware', 'Components'];
export const DISPOSITIONS = ['Undecided', 'Scrap Candidate', 'Showroom Candidate', 'Part-Out Candidate'];
export const PROCESSING_STATUSES = [
  'In Stock', 'Under Review', 'Tagged', 'Ready for Scrap', 'Sent to Refinery',
  'Ready for Showroom', 'In Showcase', 'Listed for Sale', 'Sold', 'Parted Out', 'Archived'
];
export const LOCATIONS = ['safe', 'bag', 'showcase', 'shelf', 'refinery bin', 'office', 'offsite', 'repair bench', 'stone parcel box', 'watch drawer'];
export const SUBCATEGORIES: Record<string, string[]> = {
  Jewelry: ['Ring', 'Earrings', 'Necklace', 'Bracelet', 'Pendant', 'Chain', 'Brooch', 'Mounting', 'Other'],
  Watch: ['Luxury Watch', 'Dress Watch', 'Sport Watch', 'Pocket Watch', 'Other'],
  Bullion: ['Gold Coin', 'Silver Coin', 'Gold Bar', 'Silver Bar', 'Round', 'Other'],
  Stones: ['Diamond', 'Sapphire', 'Ruby', 'Emerald', 'Loose Stone', 'Melee Parcel', 'Other'],
  Silverware: ['Spoon', 'Fork', 'Knife', 'Serving Piece', 'Flatware Set', 'Other'],
  Components: ['Loose Stone', 'Empty Mounting', 'Watch Bracelet', 'Watch Movement', 'Clasp', 'Chain Segment', 'Scrap Remainder', 'Other'],
};
