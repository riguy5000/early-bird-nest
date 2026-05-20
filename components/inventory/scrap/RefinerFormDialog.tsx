import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { RefinerRecord } from './scrapTypes';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Partial<RefinerRecord>;
  onSave: (input: Partial<RefinerRecord> & { name: string }) => Promise<string | null>;
}

export function RefinerFormDialog({ open, onClose, initial, onSave }: Props) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    contact_person: initial?.contact_person || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    address: initial?.address || '',
    notes: initial?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const id = await onSave({ ...form, id: initial?.id });
    setSaving(false);
    if (id) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{initial?.id ? 'Edit refiner' : 'Add new refiner'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Field label="Refiner name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Field label="Contact person" value={form.contact_person} onChange={v => setForm(f => ({ ...f, contact_person: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          </div>
          <Field label="Full address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} multiline />
          <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} multiline />
        </div>
        <DialogFooter className="mt-3">
          <button onClick={onClose} className="px-3 py-2 rounded-[8px] text-[13px] text-[#2B2833] bg-white border border-black/[0.08] hover:bg-black/[0.02]">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-3 py-2 rounded-[8px] text-[13px] bg-[#2B2833] text-white hover:opacity-90 disabled:opacity-40">
            {saving ? 'Saving…' : 'Save refiner'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea
          value={value} onChange={e => onChange(e.target.value)} rows={2}
          className="mt-1 w-full rounded-[8px] border border-black/[0.08] bg-white px-3 py-2 text-[13px]"
        />
      ) : (
        <input
          value={value} onChange={e => onChange(e.target.value)}
          className="mt-1 h-9 w-full rounded-[8px] border border-black/[0.08] bg-white px-3 text-[13px]"
        />
      )}
    </div>
  );
}
