import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Camera, Loader2 } from 'lucide-react';
import {
  PURITY_OPTIONS_BY_METAL,
  getDefaultPurityForMetal,
} from '../store/MetalPuritySelect';

/**
 * Shared spec form used by manual inventory entry. Mirrors the per-category
 * field structure of the Take-In intake (TakeInBalanced) so the data shape on
 * disk is identical.
 *
 * `value` is the working item draft. The component drives ALL changes through
 * `onChange(patch)` so the parent owns the canonical state.
 */
export interface ItemDraft {
  category: string;
  subcategory: string;       // mapped to itemType in Take-In
  brand: string;
  condition: string;
  size: string;
  description: string;       // free-form short description
  notes: string;
  photos: string[];
  metals: { id: string; type: string; karat: number; weight: number }[];
  stones: any[];
  specs: Record<string, any>; // category-specific spec bag (Stones/Bullion/Silverware/LooseItems/Jewelry hallmark, etc.)
  watchInfo: Record<string, any>;
}

interface ItemSpecsFormProps {
  value: ItemDraft;
  onChange: (patch: Partial<ItemDraft>) => void;
  onPhotoUpload: (files: FileList | null) => void;
  uploadingPhoto: boolean;
}

export const ITEM_CATEGORIES = ['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware', 'LooseItems'] as const;

export const ITEM_TYPES_BY_CATEGORY: Record<string, string[]> = {
  Jewelry: ['Ring', 'Earrings', 'Necklace', 'Bracelet', 'Pendant', 'Chain', 'Brooch', 'Charm', 'Other'],
  Watch: ['Wristwatch', 'Pocket Watch', 'Smart Watch', 'Luxury Watch', 'Other'],
  Bullion: ['Gold Coin', 'Silver Coin', 'Gold Bar', 'Silver Bar', 'Round', 'Bullion Coin', 'Other'],
  Stones: ['Diamond', 'Sapphire', 'Ruby', 'Emerald', 'Loose Stone', 'Melee Parcel', 'Other'],
  Silverware: ['Spoon', 'Fork', 'Knife', 'Serving Piece', 'Flatware Set', 'Other'],
  LooseItems: ['Mixed Lot', 'Scrap Lot', 'Estate Lot', 'Other'],
};

const BULLION_PURITIES = ['.999 Fine', '.9999 Fine', '.9995 Fine', '24K', '22K', '21K', '18K', '14K', '90% Silver', '40% Silver'];
const BULLION_UNITS = ['oz', 'g', 'dwt', 'kg', 'face value'];
const SILVER_TYPES = ['Sterling (.925)', 'Coin Silver (.900)', '.800', '.835', '.950', 'Plated', 'Unmarked'];

const getSpec = (specs: Record<string, any>, key: string, fallback: any = '') =>
  specs && Object.prototype.hasOwnProperty.call(specs, key) ? specs[key] : fallback;

export function ItemSpecsForm({ value, onChange, onPhotoUpload, uploadingPhoto }: ItemSpecsFormProps) {
  const updateSpec = (key: string, val: any) =>
    onChange({ specs: { ...(value.specs || {}), [key]: val } });

  const updateWatch = (key: string, val: any) =>
    onChange({ watchInfo: { ...(value.watchInfo || {}), [key]: val } });

  // Reset itemType (subcategory) and category-specific spec scaffolding when category changes
  useEffect(() => {
    // No-op; parent handles category change via patch
  }, [value.category]);

  const subtypes = ITEM_TYPES_BY_CATEGORY[value.category] || [];

  const addMetal = () => {
    const next = {
      id: `metal-${Date.now()}`,
      type: 'Gold',
      karat: getDefaultPurityForMetal('Gold'),
      weight: 0,
    };
    onChange({ metals: [...(value.metals || []), next] });
  };

  const updateMetal = (id: string, patch: Partial<ItemDraft['metals'][number]>) => {
    onChange({
      metals: (value.metals || []).map((m) => {
        if (m.id !== id) return m;
        const merged = { ...m, ...patch } as typeof m;
        // If metal type changed, reset karat to a valid default for new metal
        if (patch.type && patch.type !== m.type) {
          merged.karat = getDefaultPurityForMetal(patch.type);
        }
        return merged;
      }),
    });
  };

  const removeMetal = (id: string) =>
    onChange({ metals: (value.metals || []).filter((m) => m.id !== id) });

  const addStone = () => {
    const next = {
      id: `stone-${Date.now()}`,
      stoneType: 'Diamond',
      quantity: 1,
      shape: '',
      sizeMm: '',
      caratWeight: '',
      origin: 'Unknown',
      color: '',
      clarity: '',
      certNumber: '',
      includedInOffer: true,
    };
    onChange({ stones: [...(value.stones || []), next] });
  };

  const updateStone = (idx: number, patch: any) => {
    const next = [...(value.stones || [])];
    next[idx] = { ...next[idx], ...patch };
    onChange({ stones: next });
  };

  const removeStone = (idx: number) =>
    onChange({ stones: (value.stones || []).filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6">
      {/* CATEGORY + SUBTYPE */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <Select
              value={value.category}
              onValueChange={(v) => {
                // Reset subcategory + specs when category changes
                onChange({ category: v, subcategory: '', specs: {}, watchInfo: {} });
              }}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subtype</label>
            <Select value={value.subcategory} onValueChange={(v) => onChange({ subcategory: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select subtype..." /></SelectTrigger>
              <SelectContent>
                {subtypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* WATCH-specific specs */}
      {value.category === 'Watch' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Watch Details</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Brand</label>
              <Input value={value.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="e.g., Rolex" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
              <Input value={getSpec(value.watchInfo, 'watchModel')} onChange={(e) => updateWatch('watchModel', e.target.value)} placeholder="e.g., Submariner" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reference #</label>
              <Input value={getSpec(value.watchInfo, 'watchReference')} onChange={(e) => updateWatch('watchReference', e.target.value)} placeholder="e.g., 116610LN" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Serial #</label>
              <Input value={getSpec(value.watchInfo, 'watchSerial')} onChange={(e) => updateWatch('watchSerial', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Condition</label>
              <Select value={value.condition} onValueChange={(v) => onChange({ condition: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['New', 'Excellent', 'Good', 'Fair', 'Poor'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dial Color</label>
              <Input value={getSpec(value.watchInfo, 'watchDialColor')} onChange={(e) => updateWatch('watchDialColor', e.target.value)} placeholder="e.g., Black" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Case Size</label>
              <Input value={getSpec(value.watchInfo, 'watchCaseSize')} onChange={(e) => updateWatch('watchCaseSize', e.target.value)} placeholder="40mm" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Working</label>
              <Select value={getSpec(value.watchInfo, 'watchWorking', '')} onValueChange={(v) => updateWatch('watchWorking', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['Working', 'Not Working', 'Untested'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Movement</label>
              <Select value={getSpec(value.watchInfo, 'watchMovement', '')} onValueChange={(v) => updateWatch('watchMovement', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="With Movement">With Movement</SelectItem>
                  <SelectItem value="Without Movement">Without Movement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Band</label>
              <Select value={getSpec(value.watchInfo, 'watchBand', '')} onValueChange={(v) => updateWatch('watchBand', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['Original Band', 'Aftermarket Band', 'No Band'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={getSpec(value.watchInfo, 'watchBox') === 'Yes'} onChange={(e) => updateWatch('watchBox', e.target.checked ? 'Yes' : 'No')} />
              Box
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={getSpec(value.watchInfo, 'watchPapers') === 'Yes'} onChange={(e) => updateWatch('watchPapers', e.target.checked ? 'Yes' : 'No')} />
              Papers
            </label>
          </div>
        </div>
      )}

      {/* GENERAL (non-Watch) */}
      {value.category !== 'Watch' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">General</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Brand / Maker</label>
              <Input value={value.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="e.g., Tiffany & Co." className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Condition</label>
              <Select value={value.condition} onValueChange={(v) => onChange({ condition: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['New', 'Excellent', 'Good', 'Fair', 'Poor'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Size</label>
              <Input
                value={value.size}
                onChange={(e) => onChange({ size: e.target.value })}
                placeholder={
                  value.category === 'Jewelry'
                    ? value.subcategory === 'Ring'
                      ? 'e.g., 7'
                      : ['Necklace', 'Chain', 'Bracelet', 'Anklet'].includes(value.subcategory)
                        ? 'e.g., 18in'
                        : 'e.g., 12mm, Small'
                    : 'e.g., 7, 18in'
                }
                className="h-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* JEWELRY: Hallmark / Testing / Description */}
      {value.category === 'Jewelry' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hallmark / Testing / Description</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hallmark / Stamp</label>
              <Input value={getSpec(value.specs, 'hallmark')} onChange={(e) => updateSpec('hallmark', e.target.value)} placeholder="e.g., 14K, 750" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Test Method</label>
              <Select value={getSpec(value.specs, 'testMethod', '')} onValueChange={(v) => updateSpec('testMethod', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['Loop', 'Acid', 'XRF', 'Melt'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Style / Description</label>
              <Input value={getSpec(value.specs, 'style')} onChange={(e) => updateSpec('style', e.target.value)} className="h-9" />
            </div>
          </div>
        </div>
      )}

      {/* BULLION / COINS specifics */}
      {value.category === 'Bullion' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bullion / Coin Details</div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Purity</label>
              <Select value={getSpec(value.specs, 'purity', '')} onValueChange={(v) => updateSpec('purity', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {BULLION_PURITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Unit</label>
              <Select value={getSpec(value.specs, 'unit', 'oz')} onValueChange={(v) => updateSpec('unit', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BULLION_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity</label>
              <Input type="number" min="1" value={getSpec(value.specs, 'quantity', 1)} onChange={(e) => updateSpec('quantity', parseInt(e.target.value) || 1)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mint / Refinery</label>
              <Input value={getSpec(value.specs, 'mint')} onChange={(e) => updateSpec('mint', e.target.value)} placeholder="e.g., PAMP, US Mint" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product Name</label>
              <Input value={getSpec(value.specs, 'productName')} onChange={(e) => updateSpec('productName', e.target.value)} placeholder="e.g., Gold Eagle 1oz" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Serial #</label>
              <Input value={getSpec(value.specs, 'serial')} onChange={(e) => updateSpec('serial', e.target.value)} placeholder="If bar" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Year</label>
              <Input value={getSpec(value.specs, 'year')} onChange={(e) => updateSpec('year', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Grade</label>
              <Input value={getSpec(value.specs, 'grade')} onChange={(e) => updateSpec('grade', e.target.value)} placeholder="MS65" className="h-9" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'assayCard', false)} onChange={(e) => updateSpec('assayCard', e.target.checked)} />
              Assay card
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'slabbed', false)} onChange={(e) => updateSpec('slabbed', e.target.checked)} />
              Slabbed
            </label>
          </div>
        </div>
      )}

      {/* STONES (loose stones category) */}
      {value.category === 'Stones' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stone Details</div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stone Type</label>
              <Input value={getSpec(value.specs, 'stoneType')} onChange={(e) => updateSpec('stoneType', e.target.value)} placeholder="e.g., Diamond" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Carat Weight</label>
              <Input value={getSpec(value.specs, 'caratWeight')} onChange={(e) => updateSpec('caratWeight', e.target.value)} placeholder="0.75" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
              <Input value={getSpec(value.specs, 'color')} onChange={(e) => updateSpec('color', e.target.value)} placeholder="G" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Clarity</label>
              <Input value={getSpec(value.specs, 'clarity')} onChange={(e) => updateSpec('clarity', e.target.value)} placeholder="VS1" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cut</label>
              <Input value={getSpec(value.specs, 'cut')} onChange={(e) => updateSpec('cut', e.target.value)} placeholder="Ideal" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Polish</label>
              <Input value={getSpec(value.specs, 'polish')} onChange={(e) => updateSpec('polish', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Symmetry</label>
              <Input value={getSpec(value.specs, 'symmetry')} onChange={(e) => updateSpec('symmetry', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fluorescence</label>
              <Input value={getSpec(value.specs, 'fluorescence')} onChange={(e) => updateSpec('fluorescence', e.target.value)} placeholder="None / Faint" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Measurements</label>
              <Input value={getSpec(value.specs, 'measurements')} onChange={(e) => updateSpec('measurements', e.target.value)} placeholder="mm × mm × mm" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Lab</label>
              <Select value={getSpec(value.specs, 'lab', '')} onValueChange={(v) => updateSpec('lab', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['GIA', 'IGI', 'AGS', 'EGL', 'GCAL', 'HRD', 'Other', 'None'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Report #</label>
              <Input value={getSpec(value.specs, 'reportNumber')} onChange={(e) => updateSpec('reportNumber', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Origin</label>
              <Select value={getSpec(value.specs, 'origin', 'Unknown')} onValueChange={(v) => updateSpec('origin', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Natural', 'Lab', 'Unknown'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Treatment</label>
              <Input value={getSpec(value.specs, 'treatment')} onChange={(e) => updateSpec('treatment', e.target.value)} placeholder="None / Heat" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity</label>
              <Input type="number" min="1" value={getSpec(value.specs, 'quantity', 1)} onChange={(e) => updateSpec('quantity', parseInt(e.target.value) || 1)} className="h-9" />
            </div>
          </div>
        </div>
      )}

      {/* SILVERWARE specifics */}
      {value.category === 'Silverware' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Silverware Details</div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Silver Type</label>
              <Select value={getSpec(value.specs, 'silverType', 'Sterling (.925)')} onValueChange={(v) => updateSpec('silverType', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SILVER_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Maker</label>
              <Input value={getSpec(value.specs, 'maker')} onChange={(e) => updateSpec('maker', e.target.value)} placeholder="e.g., Gorham" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pattern</label>
              <Input value={getSpec(value.specs, 'pattern')} onChange={(e) => updateSpec('pattern', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Piece Count</label>
              <Input type="number" min="1" value={getSpec(value.specs, 'pieceCount', 1)} onChange={(e) => updateSpec('pieceCount', parseInt(e.target.value) || 1)} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hallmarks</label>
              <Input value={getSpec(value.specs, 'hallmarks')} onChange={(e) => updateSpec('hallmarks', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gross Weight (g)</label>
              <Input type="number" step="0.01" value={getSpec(value.specs, 'grossWeight', '')} onChange={(e) => updateSpec('grossWeight', parseFloat(e.target.value) || 0)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Net Silver Weight (g)</label>
              <Input type="number" step="0.01" value={getSpec(value.specs, 'netWeight', '')} onChange={(e) => updateSpec('netWeight', parseFloat(e.target.value) || 0)} className="h-9" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'weighted', false)} onChange={(e) => updateSpec('weighted', e.target.checked)} />
              Weighted
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'hollowHandle', false)} onChange={(e) => updateSpec('hollowHandle', e.target.checked)} />
              Hollow handle
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'monogram', false)} onChange={(e) => updateSpec('monogram', e.target.checked)} />
              Monogram
            </label>
          </div>
        </div>
      )}

      {/* LOOSE ITEMS */}
      {value.category === 'LooseItems' && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lot Details</div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity of Pieces</label>
              <Input type="number" min="1" value={getSpec(value.specs, 'pieceCount', 1)} onChange={(e) => updateSpec('pieceCount', parseInt(e.target.value) || 1)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tested By</label>
              <Select value={getSpec(value.specs, 'testMethod', '')} onValueChange={(v) => updateSpec('testMethod', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  {['Loop', 'Acid', 'XRF', 'Melt'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hallmarks</label>
              <Input value={getSpec(value.specs, 'hallmarks')} onChange={(e) => updateSpec('hallmarks', e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <Input value={getSpec(value.specs, 'description')} onChange={(e) => updateSpec('description', e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'mixedMetals', false)} onChange={(e) => updateSpec('mixedMetals', e.target.checked)} />
              Mixed metals
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!getSpec(value.specs, 'hasStones', false)} onChange={(e) => updateSpec('hasStones', e.target.checked)} />
              Stones present
            </label>
          </div>
        </div>
      )}

      {/* STONES (Jewelry) — multiple rows */}
      {value.category === 'Jewelry' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stones</div>
            <button type="button" onClick={addStone} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add Stone
            </button>
          </div>
          {(value.stones || []).length === 0 ? (
            <div className="border border-dashed rounded-md p-4 text-center text-xs text-muted-foreground">
              No stones added. Click "Add Stone" if this item has stones.
            </div>
          ) : (
            <div className="space-y-2">
              {value.stones.map((stone: any, si: number) => (
                <div key={stone.id || si} className="rounded-md border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stone {si + 1}</span>
                    <button type="button" onClick={() => removeStone(si)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <Minus className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Type</label>
                      <Select value={stone.stoneType || 'Diamond'} onValueChange={(v) => updateStone(si, { stoneType: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Diamond', 'Sapphire', 'Ruby', 'Emerald', 'Moissanite', 'CZ', 'Pearl', 'Opal', 'Other'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Qty</label>
                      <Input type="number" min="1" value={stone.quantity ?? 1} onChange={(e) => updateStone(si, { quantity: parseInt(e.target.value) || 1 })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Shape</label>
                      <Input value={stone.shape || ''} onChange={(e) => updateStone(si, { shape: e.target.value })} placeholder="Round" className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Size (mm)</label>
                      <Input value={stone.sizeMm || ''} onChange={(e) => updateStone(si, { sizeMm: e.target.value })} placeholder="6.5×4.5" className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Carat Wt</label>
                      <Input value={stone.caratWeight || ''} onChange={(e) => updateStone(si, { caratWeight: e.target.value })} placeholder="0.75" className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Origin</label>
                      <Select value={stone.origin || 'Unknown'} onValueChange={(v) => updateStone(si, { origin: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Natural', 'Lab', 'Unknown'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Color</label>
                      <Input value={stone.color || ''} onChange={(e) => updateStone(si, { color: e.target.value })} placeholder="G" className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Clarity</label>
                      <Input value={stone.clarity || ''} onChange={(e) => updateStone(si, { clarity: e.target.value })} placeholder="VS1" className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[2fr_1fr] gap-2 mt-2 items-end">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Lab / Cert #</label>
                      <Input value={stone.certNumber || ''} onChange={(e) => updateStone(si, { certNumber: e.target.value })} placeholder="GIA 1234567890" className="h-8 text-xs" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground pb-1.5">
                      <input type="checkbox" checked={stone.includedInOffer !== false} onChange={(e) => updateStone(si, { includedInOffer: e.target.checked })} />
                      Included in offer
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* METALS — for any category that has metal content */}
      {value.category !== 'Stones' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Metals</div>
            <button type="button" onClick={addMetal} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add Metal
            </button>
          </div>
          {(value.metals || []).length === 0 ? (
            <div className="border border-dashed rounded-md p-4 text-center text-xs text-muted-foreground">
              No metals added. Click "Add Metal" to add a metal component.
            </div>
          ) : (
            <div className="space-y-2">
              {value.metals.map((metal) => {
                const purityOpts = PURITY_OPTIONS_BY_METAL[metal.type] || PURITY_OPTIONS_BY_METAL.Gold;
                return (
                  <div key={metal.id} className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-2 items-end rounded-md border bg-card p-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Metal</label>
                      <Select value={metal.type} onValueChange={(v) => updateMetal(metal.id, { type: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Gold', 'Silver', 'Platinum', 'Palladium'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Karat / Purity</label>
                      <Select value={String(metal.karat)} onValueChange={(v) => updateMetal(metal.id, { karat: parseInt(v, 10) })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {purityOpts.map((opt) => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Weight (g)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={metal.weight || ''}
                        onChange={(e) => updateMetal(metal.id, { weight: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMetal(metal.id)} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* NOTES & PHOTOS */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes & Photos</div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
          <Textarea
            value={value.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Additional details…"
            rows={3}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Photos</label>
          <input
            id="add-inventory-photo-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onPhotoUpload(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2 items-start">
            {(value.photos || []).map((url, pi) => (
              <div key={pi} className="relative group">
                <img src={url} alt={`Item photo ${pi + 1}`} className="w-20 h-20 rounded-md object-cover border" />
                <button
                  type="button"
                  className="absolute -top-1 -right-1 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onChange({ photos: value.photos.filter((_, j) => j !== pi) })}
                >
                  ×
                </button>
              </div>
            ))}
            <label
              htmlFor="add-inventory-photo-input"
              className="border-2 border-dashed border-primary/30 rounded-md w-20 h-20 flex flex-col items-center justify-center bg-primary/[0.04] hover:bg-primary/[0.08] hover:border-primary/50 cursor-pointer transition-colors"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <>
                  <Camera className="h-5 w-5 text-primary mb-1" />
                  <span className="text-[10px] font-medium text-primary">Add Photo</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
