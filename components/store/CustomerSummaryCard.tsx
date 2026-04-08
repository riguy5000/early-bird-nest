import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, Edit, ScanLine, CreditCard, Image as ImageIcon } from 'lucide-react';
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
  const backUrl = getIdImageUrl(customer.idScanBackUrl);
  const hasIdImages = !!(frontUrl || backUrl);

  return (
    <>
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Customer</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 px-2 text-[10px] text-slate-500 hover:text-primary rounded-lg"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
              {customer.licenseNumber && (
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  ID: {customer.licenseNumber}
                </p>
              )}
            </div>
            {hasIdImages && (
              <button
                onClick={() => setShowIdImage(true)}
                className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
                title="View scanned ID"
              >
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {(customer.phone || customer.dateOfBirth) && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pl-9">
              {customer.phone && <span>{customer.phone}</span>}
              {customer.dateOfBirth && <span>DOB: {customer.dateOfBirth}</span>}
            </div>
          )}
          <div className="flex gap-1.5 pl-9">
            {customer.source === 'scan' && (
              <Badge variant="secondary" className="rounded text-[9px] px-1.5 py-0 h-4">
                <ScanLine className="h-2.5 w-2.5 mr-0.5" />
                ID Scanned
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ID Image Viewer */}
      <Dialog open={showIdImage} onOpenChange={setShowIdImage}>
        <DialogContent className="sm:max-w-lg">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Scanned ID — {customer.name}</h3>
            {frontUrl && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Front</p>
                <img src={frontUrl} alt="ID Front" className="w-full rounded-lg border object-contain max-h-64 bg-muted" />
              </div>
            )}
            {backUrl && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Back</p>
                <img src={backUrl} alt="ID Back" className="w-full rounded-lg border object-contain max-h-64 bg-muted" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
