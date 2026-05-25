import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2 } from 'lucide-react';
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
      <DialogContent className="max-w-[520px] p-0 gap-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#2B2833] flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-white" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-[#2B2833] tracking-tight">
                {initial?.id ? 'Edit refiner' : 'Add new refiner'}
              </DialogTitle>
              <p className="text-[12px] text-[#76707F] mt-0.5">Contact info used on scrap send-out documents</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 bg-white">
          <Field label="Refiner name" required value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. United PMR" />
          <Field label="Contact person" value={form.contact_person} onChange={v => setForm(f => ({ ...f, contact_person: v }))} placeholder="Full name" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 123-4567" />
            <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="contact@refiner.com" />
          </div>
          <Field label="Full address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} multiline placeholder="Street, city, state, ZIP" />
          <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} multiline placeholder="Anything internal staff should know" />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-[#2B2833] bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="h-9 px-4 rounded-lg text-[13px] font-medium bg-[#2B2833] text-white hover:bg-[#1f1d26] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : initial?.id ? 'Save changes' : 'Add refiner'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, value, onChange, multiline, required, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500 normal-case">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-[#2B2833] placeholder:text-slate-400 focus:outline-none focus:border-[#2B2833]/30 focus:ring-2 focus:ring-[#2B2833]/5 transition resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-[#2B2833] placeholder:text-slate-400 focus:outline-none focus:border-[#2B2833]/30 focus:ring-2 focus:ring-[#2B2833]/5 transition"
        />
      )}
    </div>
  );
}
