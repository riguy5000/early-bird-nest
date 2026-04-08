import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Scissors } from 'lucide-react';
import { CATEGORIES, SUBCATEGORIES, DISPOSITIONS } from './types';
import type { InventoryItemRecord } from './types';

interface ChildItemDraft {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  disposition: string;
  weight: string;
  estimatedValue: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  parentItem: InventoryItemRecord | null;
  storeId: string;
  employeeId: string;
  onComplete: () => void;
}

export function PartOutModal({ open, onClose, parentItem, storeId, employeeId, onComplete }: Props) {
  const [children, setChildren] = useState<ChildItemDraft[]>([
    { id: '1', category: 'Stones', subcategory: 'Loose Stone', description: '', disposition: 'Undecided', weight: '', estimatedValue: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const addChild = () => {
    setChildren(prev => [...prev, {
      id: Date.now().toString(),
      category: 'Components',
      subcategory: 'Scrap Remainder',
      description: '',
      disposition: 'Scrap Candidate',
      weight: '',
      estimatedValue: '',
    }]);
  };

  const removeChild = (id: string) => {
    setChildren(prev => prev.filter(c => c.id !== id));
  };

  const updateChild = (id: string, field: string, value: string) => {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handlePartOut = async () => {
    if (!parentItem || children.length === 0) return;
    setSaving(true);
    try {
      // Create child items
      const inserts = children.map(c => ({
        store_id: storeId,
        batch_id: parentItem.batch_id,
        category: c.category,
        subcategory: c.subcategory,
        description: c.description,
        disposition: c.disposition,
        processing_status: 'In Stock',
        weight: parseFloat(c.weight) || 0,
        estimated_scrap_value: c.disposition === 'Scrap Candidate' ? (parseFloat(c.estimatedValue) || 0) : 0,
        estimated_resale_value: c.disposition !== 'Scrap Candidate' ? (parseFloat(c.estimatedValue) || 0) : 0,
        parent_item_id: parentItem.id,
        source: 'derived',
        employee_id: employeeId,
        customer_id: parentItem.customer_id,
        location: parentItem.location,
        is_scrap_eligible: c.disposition === 'Scrap Candidate',
        is_resellable: c.disposition === 'Showroom Candidate',
        is_part_out_eligible: false,
        metals: c.category === 'Components' ? parentItem.metals : [],
        notes: `Derived from parent item ${parentItem.id.slice(0, 8)}`,
      }));

      const { error: insertErr } = await supabase.from('inventory_items').insert(inserts as any);
      if (insertErr) throw insertErr;

      // Update parent to Parted Out
      const { error: updateErr } = await supabase.from('inventory_items')
        .update({ processing_status: 'Parted Out', disposition: 'Part-Out Candidate', is_archived: true, archive_reason: 'Parted Out', archive_date: new Date().toISOString() } as any)
        .eq('id', parentItem.id);
      if (updateErr) throw updateErr;

      // Log status history
      await supabase.from('inventory_status_history').insert({
        item_id: parentItem.id,
        field_changed: 'processing_status',
        old_value: parentItem.processing_status,
        new_value: 'Parted Out',
        changed_by: employeeId,
        notes: `Parted out into ${children.length} component(s)`,
      } as any);

      toast.success(`Item parted out into ${children.length} component(s)`);
      onComplete();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Part-out failed');
    } finally {
      setSaving(false);
    }
  };

  if (!parentItem) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" /> Part Out Item
          </DialogTitle>
        </DialogHeader>

        {/* Parent info */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <div className="font-medium">{parentItem.description || `${parentItem.category} - ${parentItem.subcategory}`}</div>
          <div className="text-xs text-muted-foreground">
            ID: {parentItem.id.slice(0, 12)} · {parentItem.category} · {parentItem.weight}g
          </div>
        </div>

        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Derived Components</h4>
            <Button variant="outline" size="sm" onClick={addChild}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Component
            </Button>
          </div>

          {children.map((child) => (
            <div key={child.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{child.category}</Badge>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeChild(child.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px]">Category</Label>
                  <Select value={child.category} onValueChange={v => updateChild(child.id, 'category', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">Subcategory</Label>
                  <Select value={child.subcategory} onValueChange={v => updateChild(child.id, 'subcategory', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(SUBCATEGORIES[child.category] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">Disposition</Label>
                  <Select value={child.disposition} onValueChange={v => updateChild(child.id, 'disposition', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISPOSITIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px]">Description</Label>
                  <Input className="h-8 text-xs" value={child.description} onChange={e => updateChild(child.id, 'description', e.target.value)} placeholder="e.g. Center Diamond" />
                </div>
                <div>
                  <Label className="text-[10px]">Weight (g)</Label>
                  <Input className="h-8 text-xs" type="number" value={child.weight} onChange={e => updateChild(child.id, 'weight', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[10px]">Est. Value</Label>
                  <Input className="h-8 text-xs" type="number" value={child.estimatedValue} onChange={e => updateChild(child.id, 'estimatedValue', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handlePartOut} disabled={saving || children.length === 0}>
            {saving ? 'Processing...' : `Part Out → ${children.length} Component(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
