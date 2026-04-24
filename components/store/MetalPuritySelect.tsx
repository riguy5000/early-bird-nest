import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Metal-specific purity options. Values are stored as numbers:
 *  - Gold: karat (9..24)
 *  - Silver/Platinum/Palladium: fineness (e.g., 925, 950, 999)
 * The pricing utility (src/lib/pricing.ts) interprets ≤24 as karat and >24 as fineness.
 */
export const PURITY_OPTIONS_BY_METAL: Record<string, { value: number; label: string }[]> = {
  Gold: [
    { value: 8, label: '8K / .333' },
    { value: 9, label: '9K / .375' },
    { value: 10, label: '10K / .417' },
    { value: 14, label: '14K / .585' },
    { value: 18, label: '18K / .750' },
    { value: 21, label: '21K / .875' },
    { value: 22, label: '22K / .916' },
    { value: 24, label: '24K / .999' },
  ],
  Silver: [
    { value: 800, label: '.800' },
    { value: 830, label: '.830' },
    { value: 900, label: '.900' },
    { value: 925, label: '.925 Sterling' },
    { value: 950, label: '.950' },
    { value: 975, label: '.975' },
    { value: 999, label: '.999 Fine' },
  ],
  Platinum: [
    { value: 850, label: '.850 Pt' },
    { value: 900, label: '.900 Pt' },
    { value: 950, label: '.950 Pt' },
    { value: 999, label: '.999 Pt' },
  ],
  Palladium: [
    { value: 500, label: '.500 Pd' },
    { value: 950, label: '.950 Pd' },
    { value: 999, label: '.999 Pd' },
  ],
};

export const DEFAULT_PURITY_FOR_METAL: Record<string, number> = {
  Gold: 14,
  Silver: 925,
  Platinum: 950,
  Palladium: 950,
};

export function getPurityOptionsForMetal(metal: string) {
  return PURITY_OPTIONS_BY_METAL[metal] || PURITY_OPTIONS_BY_METAL.Gold;
}

export function getDefaultPurityForMetal(metal: string) {
  return DEFAULT_PURITY_FOR_METAL[metal] ?? 14;
}

/**
 * Full, metal-correct purity label (e.g. "14K", "925 Sterling", "950 Platinum").
 * Use in detail views, inventory tables, drawers.
 */
export function formatPurityLabel(metal: string, value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '—';
  const opts = PURITY_OPTIONS_BY_METAL[metal];
  const match = opts?.find(o => o.value === num);
  if (match) return match.label;
  // Fallback when value isn't a known preset
  if (metal === 'Gold') return `${num}K`;
  if (metal === 'Platinum') return `${num} Platinum`;
  if (metal === 'Palladium') return `${num} Palladium`;
  if (metal === 'Silver') return `${num}`;
  return String(num);
}

/**
 * Compact purity label suited for tight rows (e.g. "14K", "925", "950 Pt").
 * Strips the long " Sterling" / " Fine" suffixes for Silver to keep it tight.
 */
export function formatPurityCompact(metal: string, value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '—';
  if (metal === 'Gold') return `${num}K`;
  if (metal === 'Silver') return `${num}`;
  if (metal === 'Platinum') return `${num} Pt`;
  if (metal === 'Palladium') return `${num} Pd`;
  return String(num);
}

interface MetalPuritySelectProps {
  metal: string;
  value: number | undefined;
  onChange: (purity: number) => void;
  className?: string;
  triggerClassName?: string;
}

/**
 * Dropdown that adapts its options to the selected metal.
 * Silver/Platinum/Palladium will NOT show gold karats.
 */
export function MetalPuritySelect({ metal, value, onChange, triggerClassName }: MetalPuritySelectProps) {
  const options = getPurityOptionsForMetal(metal);
  const current = value != null ? String(value) : undefined;

  // If current value is not in the options for this metal (e.g., metal just changed),
  // display nothing selected — the parent should reset the value when metal changes.
  const isValid = options.some(o => o.value === Number(current));
  const compact = isValid ? formatPurityCompact(metal, value) : '';

  return (
    <Select value={isValid ? current : undefined} onValueChange={(v) => onChange(parseInt(v, 10))}>
      <SelectTrigger className={triggerClassName || 'w-[88px] h-10 text-[13px] bg-white border border-black/[0.06] rounded-[10px]'}>
        <SelectValue placeholder="—">{compact || '—'}</SelectValue>
      </SelectTrigger>
      <SelectContent className="rounded-[12px] bg-white border-black/[0.06] shadow-xl">
        {options.map(opt => (
          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
