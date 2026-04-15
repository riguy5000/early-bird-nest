import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Edit, History, Package, DollarSign } from 'lucide-react';

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

function Field({ icon: Icon, label, value }: { icon?: any; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div>
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium mt-0.5">{value}</div>
      </div>
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

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              {fullName || 'Unknown Customer'}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact Information</h4>
            <div className="space-y-1">
              <Field icon={Mail} label="Email" value={customer.email} />
              <Field icon={Phone} label="Phone" value={customer.phone} />
              <Field icon={MapPin} label="Address" value={customer.address} />
            </div>
          </div>

          <Separator />

          {/* Personal Info */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Details</h4>
            <div className="space-y-1">
              <Field icon={Calendar} label="Date of Birth" value={customer.dateOfBirth} />
              {customer.gender && <Field label="Gender" value={customer.gender} />}
              <Field icon={CreditCard} label={customer.idType || 'ID Number'} value={customer.idNumber} />
              <Field icon={Calendar} label="Customer Since" value={new Date(customer.createdAt).toLocaleDateString()} />
            </div>
          </div>

          {/* ID Scan Images */}
          {(customer.idScanUrl || customer.idScanBackUrl) && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ID Scans</h4>
                <div className="flex gap-2">
                  {customer.idScanUrl && (
                    <img src={customer.idScanUrl} className="w-32 h-20 rounded-lg object-cover border" alt="ID Front" />
                  )}
                  {customer.idScanBackUrl && (
                    <img src={customer.idScanBackUrl} className="w-32 h-20 rounded-lg object-cover border" alt="ID Back" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {customer.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{customer.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Transaction History */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Transaction History
            </h4>
            {loadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
              </div>
            ) : batches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No transactions found.</p>
            ) : (
              <div className="space-y-2">
                {batches.map(batch => (
                  <div key={batch.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg border border-border/40">
                    <div>
                      <div className="text-xs font-medium flex items-center gap-1.5">
                        <Package className="h-3 w-3" />
                        {batch.total_items} items
                        <Badge variant="outline" className="text-[9px] ml-1">{batch.source}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary flex items-center gap-0.5">
                      <DollarSign className="h-3 w-3" />
                      {batch.total_payout.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Customer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
