import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DISPOSITIONS, LOCATIONS } from './types';
import { ItemSpecsForm, type ItemDraft } from './ItemSpecsForm';

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  employeeId: string;
  onCreated: () => void;
  parentItemId?: string;
}

const emptyDraft: ItemDraft = {
  category: 'Jewelry',
  subcategory: '',
  brand: '',
  condition: '',
  size: '',
  description: '',
  notes: '',
  photos: [],
  metals: [],
  stones: [],
  specs: {},
  watchInfo: {},
};

export function AddInventoryModal({ open, onClose, storeId, employeeId, onCreated, parentItemId }: Props) {
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [disposition, setDisposition] = useState('Undecided');
  const [location, setLocation] = useState('safe');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const reset = () => {
    setDraft(emptyDraft);
    setEstimatedValue('');
    setCostBasis('');
    setDisposition('Undecided');
    setLocation('safe');
  };

  const patchDraft = (patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${storeId}/manual/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('batch-photos').upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data } = supabase.storage.from('batch-photos').getPublicUrl(path);
        if (data?.publicUrl) uploaded.push(data.publicUrl);
      }
      patchDraft({ photos: [...draft.photos, ...uploaded] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let batchId: string | null = null;
      if (!parentItemId) {
        const { data: batch, error: batchErr } = await supabase
          .from('inventory_batches')
          .insert({
            store_id: storeId,
            employee_id: employeeId,
            total_items: 1,
            total_payout: parseFloat(costBasis) || 0,
            source: 'manual',
            status: 'active',
          } as any)
          .select()
          .single();
        if (batchErr) throw batchErr;
        batchId = (batch as any).id;
      }

      const totalWeight = draft.metals.reduce((s, m) => s + (Number(m.weight) || 0), 0);

      // Compose description: "Category - Subtype" if subtype exists
      const subType = draft.subcategory || '';
      const desc = subType ? `${draft.category} - ${subType}` : draft.category;

      // Pack everything into watch_info.specs (matches Take-In sync convention)
      const packedWatchInfo = {
        ...(draft.watchInfo || {}),
        specs: {
          ...(draft.specs || {}),
          brand: draft.brand,
          condition: draft.condition,
          size: draft.size,
        },
        itemType: subType,
        brand: draft.brand,
        condition: draft.condition,
      };

      const { error } = await supabase.from('inventory_items').insert({
        store_id: storeId,
        batch_id: batchId,
        category: draft.category,
        subcategory: subType,
        description: desc,
        disposition,
        processing_status: 'In Stock',
        metals: draft.metals,
        stones: draft.stones,
        watch_info: packedWatchInfo,
        test_method: draft.specs?.testMethod || '',
        weight: totalWeight,
        market_value_at_intake: parseFloat(estimatedValue) || 0,
        payout_amount: parseFloat(costBasis) || 0,
        estimated_resale_value: parseFloat(estimatedValue) || 0,
        estimated_scrap_value: parseFloat(estimatedValue) || 0,
        location,
        notes: draft.notes,
        photos: draft.photos,
        source: parentItemId ? 'derived' : 'manual',
        parent_item_id: parentItemId || null,
        employee_id: employeeId,
        is_part_out_eligible: draft.category === 'Jewelry',
        is_scrap_eligible: true,
        is_resellable: disposition === 'Showroom Candidate',
      } as any);

      if (error) throw error;
      toast.success('Inventory item added');
      reset();
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
      <SheetContent side="right" className="p-0 flex flex-col w-[640px] max-w-[95vw] sm:max-w-none">
        <SheetHeader className="pr-14">
          <SheetTitle>{parentItemId ? 'Add Derived Component' : 'Add Inventory Item'}</SheetTitle>
          <SheetDescription>
            {parentItemId
              ? 'Create a child component derived from this item.'
              : 'Manually add a new item to inventory with full intake details.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ItemSpecsForm
            value={draft}
            onChange={patchDraft}
            onPhotoUpload={handlePhotoUpload}
            uploadingPhoto={uploadingPhoto}
          />

          {/* Acquisition / Inventory placement */}
          <div className="mt-8 pt-6 border-t space-y-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Acquisition & Placement
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cost / Acquisition</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costBasis}
                  onChange={(e) => setCostBasis(e.target.value)}
                  placeholder="0.00"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estimated Market Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="0.00"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Disposition</Label>
                <Select value={disposition} onValueChange={setDisposition}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISPOSITIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Add Item'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
