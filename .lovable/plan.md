

## Goal
Make every right-side drawer/panel across the app match the approved frosted, floating, rounded design (the one already used by `AppDrawer` and `CustomerDetailDrawer`).

## What's inconsistent today
The approved look (frosted glass, 16px inset from edges, `rounded-[20px]`, soft shadow, light backdrop) is only applied in two custom components. Every other side panel uses the default Radix `Sheet`, which renders edge-to-edge, full-height, square corners, opaque background, and a heavy `bg-black/80` overlay.

Drawers currently using the unstyled `Sheet`:
- `components/inventory/InventoryDetailDrawer.tsx` — Inventory detail
- `components/store/CustomerDrawer.tsx` — Take-In customer drawer
- `components/store/AICaptureModal.tsx` — AI Assist capture panel
- `components/PayoutsModule.tsx` — Payout details
- `components/RootAdminConsole.tsx` — Store details (Root Admin)

## Fix strategy — single source of truth
Instead of patching five files individually, restyle the shared `components/ui/sheet.tsx` so the `side="right"` variant renders the approved spec. Every existing drawer inherits it automatically.

### Changes to `components/ui/sheet.tsx`
1. **SheetOverlay**: replace `bg-black/80` with the approved soft backdrop: `bg-black/[0.08] backdrop-blur-[2px]`.
2. **sheetVariants → side: "right"**: replace the full-height edge-anchored styles with:
   - `top-4 right-4 bottom-4` (16px inset from all edges)
   - `h-auto` (no longer `h-full`)
   - `w-full sm:max-w-[440px]`
   - `rounded-[20px]`
   - Frosted surface: `bg-white/85 backdrop-blur-xl backdrop-saturate-150`
   - Ring: `border border-white/60`
   - Shadow: `shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)]`
   - Slide-in: keep `slide-in-from-right` animation
3. Keep `top`, `bottom`, `left` variants unchanged (they're only used by mobile sidebar).
4. Move the built-in close `X` button slightly so it lands inside the rounded panel (`right-5 top-5`, `rounded-[10px]`, hover `bg-[#F8F7FB]`) to match the AppDrawer close affordance.

### Verification list (after change)
- Take-In → open Customer drawer → matches reference
- Inventory → click any row → detail drawer matches reference
- Take-In → AI Assist → capture modal matches reference
- Payouts → click row → details panel matches reference
- Root Admin → store details panel matches reference
- Customers → existing CustomerDetailDrawer already correct (uses bespoke styling) — verify it still looks identical alongside the others

## Out of scope
- Bottom mobile drawer (`src/components/ui/drawer.tsx`, vaul) — not a side panel.
- Toasts / dialog modals — different component family.
- Mobile responsive sidebar Sheet — keeps default styling because it's a navigation surface, not a content drawer.

## Risk
Low. The Sheet API doesn't change; only the visual classes for `side="right"` and the overlay change. Any consumer passing `className` for width still works (Tailwind merge) — they'll just inherit the rounded floating shell.

