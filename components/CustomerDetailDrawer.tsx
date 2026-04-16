import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

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

export function CustomerDetailDrawer({ customer, open, onClose, onEdit }: Props) {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!customer || !open) return;
    loadHistory();
  }, [customer?.id, open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

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
  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const totalSpent = batches.reduce((s, b) => s + (b.total_payout || 0), 0);
  const totalItems = batches.reduce((s, b) => s + (b.total_items || 0), 0);

  if (!open) return null;

  // Slide-in animation keyframe injected inline
  const slideStyle = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0.8; } to { transform: translateX(0); opacity: 1; } }`;

  return (
    <>
      <style>{slideStyle}</style>
      {/* ── Backdrop — dimmed haze, matches approved screenshot ── */}
      <div
        className="fixed inset-0 z-40 bg-black/[0.18] backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* ── Drawer panel — floating frosted card, gap from all edges ── */}
      <div
        className="fixed z-50 flex flex-col"
        style={{
          animation: 'slideInRight 0.25s cubic-bezier(0,0,0.2,1)',
          top: '16px',
          right: '16px',
          bottom: '16px',
          width: '300px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Drawer header — name + close button ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] flex-shrink-0">
          <h2 className="text-[20px] font-semibold text-[#2B2833] tracking-tight">
            {fullName || 'Unknown Customer'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-[#76707F]" />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Contact Information */}
          <div>
            <p className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">
              Contact Information
            </p>
            <div className="space-y-3">
              {customer.email && (
                <div>
                  <p className="text-[11px] text-[#76707F] mb-0.5">Email</p>
                  <p className="text-[15px] font-medium text-[#2B2833]">{customer.email}</p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <p className="text-[11px] text-[#76707F] mb-0.5">Phone</p>
                  <p className="text-[15px] font-medium text-[#2B2833]">{customer.phone}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <p className="text-[11px] text-[#76707F] mb-0.5">Address</p>
                  <p className="text-[15px] font-medium text-[#2B2833]">{customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-black/[0.04]" />

          {/* Transaction History */}
          <div>
            <p className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-3">
              Transaction History
            </p>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#6B5EF9] border-t-transparent" />
              </div>
            ) : batches.length === 0 ? (
              <p className="text-[14px] text-[#76707F]">No transactions found.</p>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#76707F]">{totalItems} items</span>
                <span className="text-[22px] font-semibold text-[#2B2833] tabular-nums">
                  {fmtCurrency(totalSpent)}
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-black/[0.04]" />

          {/* Customer Since */}
          <div>
            <p className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-2">
              Customer Since
            </p>
            <p className="text-[15px] font-medium text-[#2B2833]">
              {new Date(customer.createdAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* ── Footer action button ── */}
        <div className="px-6 py-5 border-t border-black/[0.06] flex-shrink-0">
          <button
            onClick={() => onEdit(customer)}
            className="w-full btn-primary-dark flex items-center justify-center"
          >
            Edit Customer
          </button>
        </div>

      </div>
    </>
  );
}
