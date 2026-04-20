import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CATEGORIES, SUBCATEGORIES, DISPOSITIONS, LOCATIONS } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  employeeId: string;
  onCreated: () => void;
  parentItemId?: string;
}

export function AddInventoryModal({ open, onClose, storeId, employeeId, onCreated, parentItemId }: Props) {
  const [category, setCategory] = useState('Jewelry');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [disposition, setDisposition] = useState('Undecided');
  const [location, setLocation] = useState('safe');
  const [metalType, setMetalType] = useState('Gold');
  const [karat, setKarat] = useState('14');
  const [weight, setWeight] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let batchId: string | null = null;
      if (!parentItemId) {
        const { data: batch, error: batchErr } = await supabase.from('inventory_batches').insert({
          store_id: storeId,
          employee_id: employeeId,
          total_items: 1,
          total_payout: 0,
          source: parentItemId ? 'derived' : 'manual',
          status: 'active',
        } as any).select().single();
        if (batchErr) throw batchErr;
        batchId = (batch as any).id;
      }

      const metals = weight ? [{ type: metalType, karat: parseInt(karat), weight: parseFloat(weight) }] : [];

      const { error } = await supabase.from('inventory_items').insert({
        store_id: storeId,
        batch_id: batchId,
        category,
        subcategory,
        description,
        disposition,
        processing_status: 'In Stock',
        metals,
        weight: parseFloat(weight) || 0,
        estimated_resale_value: parseFloat(estimatedValue) || 0,
        estimated_scrap_value: parseFloat(estimatedValue) || 0,
        location,
        notes,
        source: parentItemId ? 'derived' : 'manual',
        parent_item_id: parentItemId || null,
        employee_id: employeeId,
        is_part_out_eligible: category === 'Jewelry',
        is_scrap_eligible: true,
        is_resellable: disposition === 'Showroom Candidate',
      } as any);

      if (error) throw error;
      toast.success('Inventory item added');
      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>{parentItemId ? 'Add Derived Component' : 'Add Inventory Item'}</SheetTitle>
          <SheetDescription>
            {parentItemId ? 'Create a child component from this item.' : 'Manually add a new item to inventory.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory(''); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {(SUBCATEGORIES[category] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 14k Gold Ring with Sapphire" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Metal</Label>
              <Select value={metalType} onValueChange={setMetalType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Gold', 'Silver', 'Platinum', 'Palladium'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Karat</Label>
              <Select value={karat} onValueChange={setKarat}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['8', '9', '10', '14', '18', '22', '24'].map(k => <SelectItem key={k} value={k}>{k}K</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Weight (g)</Label>
              <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Disposition</Label>
              <Select value={disposition} onValueChange={setDisposition}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISPOSITIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Estimated Value</Label>
            <Input type="number" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <SheetFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Add Item'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
