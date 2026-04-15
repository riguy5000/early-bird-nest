import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, History, Package, DollarSign } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  idType: string;
  idNumber: string;
  notes: string;
  createdAt: string;
  storeId: string;
  gender?: string;
  idScanUrl?: string;
  idScanBackUrl?: string;
}

interface Props {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

interface BatchRecord {
  id: string;
  created_at: string;
  total_payout: number;
  total_items: number;
  status: string;
  source: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="py-2">
      <div className="text-[11px] text-[#76707F] uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-[15px] font-medium text-[#2B2833] mt-0.5">{value}</div>
    </div>
  );
}

export function CustomerDetailDrawer({ customer, open, onClose, onEdit }: Props) {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!customer || !open) return;
    loadHistory();
  }, [customer?.id, open]);

  const loadHistory = async () => {
    if (!customer) return;
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('inventory_batches')
        .select('id, created_at, total_payout, total_items, status, source')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setBatches(data || []);
    } catch (e) {
      console.error('Error loading customer history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!customer) return null;

  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const fmtCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const totalSpent = batches.reduce((s, b) => s + b.total_payout, 0);
  const totalItems = batches.reduce((s, b) => s + b.total_items, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{fullName || 'Unknown Customer'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Contact Information */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Contact Information</h4>
            <div className="space-y-0.5">
              <Field label="Email" value={customer.email} />
              <Field label="Phone" value={customer.phone} />
              <Field label="Address" value={customer.address} />
            </div>
          </div>

          <Separator className="bg-black/[0.04]" />

          {/* Transaction History */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">Transaction History</h4>
            {loadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6B5EF9] mx-auto" />
              </div>
            ) : batches.length === 0 ? (
              <p className="text-[14px] text-[#76707F] py-2">No transactions found.</p>
            ) : (
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-[#76707F]">{totalItems} items</span>
                <span className="text-[22px] font-semibold text-[#2B2833]">{fmtCurrency(totalSpent)}</span>
              </div>
            )}
          </div>

          <Separator className="bg-black/[0.04]" />

          {/* Customer Since */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">Customer Since</h4>
            <p className="text-[15px] font-medium text-[#2B2833]">
              {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <SheetFooter>
          <button
            onClick={() => onEdit(customer)}
            className="w-full py-3 bg-[#2B2833] text-white rounded-[10px] text-[15px] font-semibold hover:bg-[#3B3846] transition-all"
            style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.10)' }}
          >
            Edit Customer
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
