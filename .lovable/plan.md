
# UI/UX Contrast and Visibility Overhaul

The current design suffers from extremely low contrast -- nearly everything uses transparent backgrounds (`muted/20`, `muted/40`), borderless inputs (`border-0`), and ghost buttons that disappear against the white background. This plan increases contrast and readability while keeping a modern, clean aesthetic.

## Design Direction

Moving from "invisible" to "confident" -- controls should be clearly identifiable, interactive elements should stand out, and hierarchy should be obvious at a glance. Think Linear or Stripe dashboard: clean but with actual visible structure.

## Changes by File

### 1. `components/store/TakeInPage.tsx` -- Header and Controls Bar
- Category chips: Replace `bg-muted/50` inactive state with `bg-slate-100` (solid light gray), and active state with solid `bg-blue-600 text-white` instead of barely-visible `bg-primary/10`
- Item count stepper: Use `bg-slate-100` with `border border-slate-200` instead of `bg-muted/40`
- AI Assist button: Give it a visible border and slightly stronger background (`bg-slate-100 border border-slate-200`) so it reads as a real button
- Metal ticker strip: Keep as-is (already clean)

### 2. `components/store/TakeInBalanced.tsx` -- Main Content Area
- **Empty state buttons**: Change from `variant="outline"` with faint borders to solid `bg-slate-100 hover:bg-slate-200` with visible text
- **Category cards**: Replace `border-border/40` with `border-slate-200` (solid, visible border). Category header background from `bg-muted/30` to `bg-slate-50`
- **Item number badges**: From `bg-muted/60` to `bg-slate-200` for better visibility
- **Type quick-pick chips**: From `bg-muted/40` to `bg-slate-100 border border-slate-200` so they look clickable
- **Inputs (metal, karat, weight, payout %)**: Remove `border-0 bg-muted/20` pattern. Replace with `bg-white border border-slate-200` -- proper visible form fields
- **Select triggers**: Same treatment -- `bg-white border border-slate-200` instead of borderless
- **"Details" toggle and "Save" switch label**: Increase text from `text-[11px] text-muted-foreground` to `text-xs text-slate-600`
- **Right sidebar**: 
  - Total payout: Make the number bolder (`font-semibold` instead of `font-light`)
  - "Scan Customer ID" button: Solid border, not dashed -- `border border-slate-300 bg-white hover:bg-slate-50`
  - Action buttons at bottom: "Complete Purchase" stays solid primary. "Save as Quote" and "Print Receipt" get `bg-slate-100 hover:bg-slate-200 text-slate-700` instead of ghost
  - Summary stats rows: slightly bolder labels

### 3. `components/store/SummaryFooter.tsx` -- Bottom Bar
- KPI pills: Replace `bg-muted/40` with `bg-slate-100` for Market and Avg %. Payout pill: `bg-blue-50 border border-blue-200` instead of barely-visible `bg-primary/5 border-primary/10`. Profit pill: `bg-green-50 border border-green-200`
- "Save Quote" button: From ghost to `bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200`
- "Complete Purchase": Keep solid primary but ensure it has good padding and is clearly the dominant CTA
- "Customer Info" button: From ghost to `bg-slate-100 text-slate-700`
- Payment select: From `bg-muted/30 border-0` to `bg-white border border-slate-200`
- Keyboard shortcut badges: From `bg-muted/40` to `bg-slate-200` for better readability

### 4. `components/store/CustomerDrawer.tsx` -- Right Drawer
- Form inputs: Replace all `bg-muted/20 border-0` with `bg-white border border-slate-200` so fields are clearly visible
- "Scan Customer ID" button: Solid border `border-slate-300` instead of dashed `border-primary/20`
- Scan step cards: From `bg-muted/20` to `bg-slate-50 border border-slate-200`
- Compliance notice box: From `bg-muted/30` to `bg-slate-50 border border-slate-200`
- Section headers: Slightly darker text

### 5. `components/store/AIAssistBanner.tsx` -- AI Banner
- Background: From `bg-primary/[0.03]` to `bg-blue-50 border border-blue-200` so it's actually noticeable
- "Try AI Capture" button: From `bg-primary/5` to `bg-blue-100 hover:bg-blue-200 text-blue-700`

### 6. `src/index.css` -- Design Tokens (minor)
- No token changes needed -- the issue is all in component-level utility classes using too-transparent opacity values

## Summary of the Pattern Change
| Before (too light) | After (visible) |
|---|---|
| `bg-muted/20 border-0` | `bg-white border border-slate-200` |
| `bg-muted/40` | `bg-slate-100` |
| `variant="ghost"` action buttons | `bg-slate-100 border border-slate-200` |
| `text-muted-foreground` on labels | `text-slate-600` |
| `border-border/40` on cards | `border-slate-200` |
| `bg-primary/10 text-primary` active chip | `bg-blue-600 text-white` active chip |

All functionality remains identical -- only Tailwind classes change.
