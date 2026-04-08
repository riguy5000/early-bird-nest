import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Building, Mail } from 'lucide-react';

interface RootAdminAddStoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function RootAdminAddStore({ open, onOpenChange, onCreated }: RootAdminAddStoreProps) {
  const [mode, setMode] = useState<'manual' | 'invite'>('manual');
  const [loading, setLoading] = useState(false);

  // Manual mode fields
  const [manual, setManual] = useState({
    storeName: '', storeType: 'jewelry_pawn', ownerFirstName: '', ownerLastName: '',
    ownerEmail: '', ownerPhone: '', storeAddress: '', timezone: 'America/New_York',
    status: 'active', notes: '', tempPassword: '',
  });

  // Invite mode fields
  const [invite, setInvite] = useState({
    storeName: '', storeType: 'jewelry_pawn', ownerEmail: '', ownerName: '',
    timezone: 'America/New_York', status: 'active',
  });

  const handleManualCreate = async () => {
    if (!manual.storeName || !manual.ownerEmail) {
      toast.error('Store name and owner email are required');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('root-admin', {
        body: {
          action: 'create-store',
          mode: 'manual',
          storeName: manual.storeName,
          storeType: manual.storeType,
          ownerFirstName: manual.ownerFirstName,
          ownerLastName: manual.ownerLastName,
          ownerEmail: manual.ownerEmail,
          ownerPhone: manual.ownerPhone,
          storeAddress: manual.storeAddress,
          timezone: manual.timezone,
          status: manual.status,
          notes: manual.notes,
          tempPassword: manual.tempPassword || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(`Store "${manual.storeName}" created successfully`);
      onOpenChange(false);
      resetForm();
      onCreated();
    } catch (e: any) {
      toast.error('Failed to create store: ' + e.message);
    }
    setLoading(false);
  };

  const handleInviteCreate = async () => {
    if (!invite.storeName || !invite.ownerEmail) {
      toast.error('Store name and owner email are required');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('root-admin', {
        body: {
          action: 'create-store',
          mode: 'invite',
          storeName: invite.storeName,
          storeType: invite.storeType,
          ownerEmail: invite.ownerEmail,
          ownerName: invite.ownerName,
          timezone: invite.timezone,
          status: invite.status,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(`Invite sent to ${invite.ownerEmail} for store "${invite.storeName}"`);
      onOpenChange(false);
      resetForm();
      onCreated();
    } catch (e: any) {
      toast.error('Failed to create store: ' + e.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setManual({ storeName: '', storeType: 'jewelry_pawn', ownerFirstName: '', ownerLastName: '', ownerEmail: '', ownerPhone: '', storeAddress: '', timezone: 'America/New_York', status: 'active', notes: '', tempPassword: '' });
    setInvite({ storeName: '', storeType: 'jewelry_pawn', ownerEmail: '', ownerName: '', timezone: 'America/New_York', status: 'active' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Store</DialogTitle>
          <DialogDescription>Create a store manually or send an invite to the owner</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1"><Building className="h-3 w-3 mr-1" />Create Manually</TabsTrigger>
            <TabsTrigger value="invite" className="flex-1"><Mail className="h-3 w-3 mr-1" />Invite Owner</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Store Name *</Label>
                <Input value={manual.storeName} onChange={e => setManual(p => ({ ...p, storeName: e.target.value }))} placeholder="Store name" />
              </div>
              <div className="space-y-1">
                <Label>Store Type</Label>
                <Select value={manual.storeType} onValueChange={v => setManual(p => ({ ...p, storeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jewelry_pawn">Jewelry & Pawn</SelectItem>
                    <SelectItem value="pawn">Pawn Only</SelectItem>
                    <SelectItem value="jewelry">Jewelry Only</SelectItem>
                    <SelectItem value="gold_buyer">Gold Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={manual.status} onValueChange={v => setManual(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Owner First Name</Label>
                <Input value={manual.ownerFirstName} onChange={e => setManual(p => ({ ...p, ownerFirstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Owner Last Name</Label>
                <Input value={manual.ownerLastName} onChange={e => setManual(p => ({ ...p, ownerLastName: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Owner Email *</Label>
                <Input type="email" value={manual.ownerEmail} onChange={e => setManual(p => ({ ...p, ownerEmail: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Owner Phone</Label>
                <Input value={manual.ownerPhone} onChange={e => setManual(p => ({ ...p, ownerPhone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Timezone</Label>
                <Select value={manual.timezone} onValueChange={v => setManual(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern</SelectItem>
                    <SelectItem value="America/Chicago">Central</SelectItem>
                    <SelectItem value="America/Denver">Mountain</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Store Address</Label>
                <Input value={manual.storeAddress} onChange={e => setManual(p => ({ ...p, storeAddress: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Temporary Password (optional)</Label>
                <Input type="password" value={manual.tempPassword} onChange={e => setManual(p => ({ ...p, tempPassword: e.target.value }))} placeholder="Auto-generated if empty" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Notes (optional)</Label>
                <Textarea value={manual.notes} onChange={e => setManual(p => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleManualCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Store'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Store Name *</Label>
                <Input value={invite.storeName} onChange={e => setInvite(p => ({ ...p, storeName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Store Type</Label>
                <Select value={invite.storeType} onValueChange={v => setInvite(p => ({ ...p, storeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jewelry_pawn">Jewelry & Pawn</SelectItem>
                    <SelectItem value="pawn">Pawn Only</SelectItem>
                    <SelectItem value="jewelry">Jewelry Only</SelectItem>
                    <SelectItem value="gold_buyer">Gold Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Timezone</Label>
                <Select value={invite.timezone} onValueChange={v => setInvite(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern</SelectItem>
                    <SelectItem value="America/Chicago">Central</SelectItem>
                    <SelectItem value="America/Denver">Mountain</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Owner Email *</Label>
                <Input type="email" value={invite.ownerEmail} onChange={e => setInvite(p => ({ ...p, ownerEmail: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Owner Name (optional)</Label>
                <Input value={invite.ownerName} onChange={e => setInvite(p => ({ ...p, ownerName: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleInviteCreate} disabled={loading}>
                {loading ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
