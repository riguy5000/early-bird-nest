import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, Edit, ScanLine, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CustomerData } from './CustomerDrawer';

interface CustomerSummaryCardProps {
  customer: CustomerData;
  onEdit: () => void;
}

export function CustomerSummaryCard({ customer, onEdit }: CustomerSummaryCardProps) {
  const [showIdImage, setShowIdImage] = useState(false);

  const getIdImageUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('customer-id-scans').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const frontUrl = getIdImageUrl(customer.idScanUrl);
  const backUrl  = getIdImageUrl(customer.idScanBackUrl);
  const hasIdImages = !!(frontUrl || backUrl);

  return (
    <>
      <div className="px-5 py-4 border-b border-black/[0.06]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">
            Customer
          </h3>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-[11px] font-medium text-[#6B5EF9] hover:text-[#5848D9] transition-colors"
          >
            <Edit className="h-3 w-3" />
            Edit
          </button>
        </div>

        {/* Customer card */}
        <div className="bg-white/60 border border-black/[0.06] rounded-[10px] p-3 space-y-1.5">
          <div className="flex items-center gap-2.5">
            {/* Avatar initials */}
            <div className="w-8 h-8 rounded-full icon-container flex-shrink-0 text-[12px] font-semibold text-[#6B5EF9]">
              {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CU'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#2B2833] truncate">{customer.name}</p>
              {customer.licenseNumber && (
                <p className="text-[11px] text-[#A8A3AE] font-mono truncate">
                  ID: {customer.licenseNumber}
                </p>
              )}
            </div>
            {hasIdImages && (
              <button
                onClick={() => setShowIdImage(true)}
                className="btn-icon flex-shrink-0"
                title="View scanned ID"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#76707F]" />
              </button>
            )}
          </div>

          {(customer.phone || customer.dateOfBirth) && (
            <div className="flex items-center gap-3 text-[12px] text-[#76707F] pl-10">
              {customer.phone && <span>{customer.phone}</span>}
              {customer.dateOfBirth && <span>DOB: {customer.dateOfBirth}</span>}
            </div>
          )}

          {customer.source === 'scan' && (
            <div className="pl-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                <ScanLine className="h-2.5 w-2.5" />
                ID Scanned
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ID Image Viewer */}
      <Dialog open={showIdImage} onOpenChange={setShowIdImage}>
        <DialogContent className="sm:max-w-lg bg-white/90 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-2xl">
          <div className="space-y-3 p-2">
            <h3 className="text-[15px] font-semibold text-[#2B2833]">
              Scanned ID — {customer.name}
            </h3>
            {frontUrl && (
              <div>
                <p className="text-[12px] text-[#76707F] mb-1.5">Front</p>
                <img src={frontUrl} alt="ID Front"
                  className="w-full rounded-[10px] border border-black/[0.06] object-contain max-h-64 bg-[#F8F7FB]" />
              </div>
            )}
            {backUrl && (
              <div>
                <p className="text-[12px] text-[#76707F] mb-1.5">Back</p>
                <img src={backUrl} alt="ID Back"
                  className="w-full rounded-[10px] border border-black/[0.06] object-contain max-h-64 bg-[#F8F7FB]" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
