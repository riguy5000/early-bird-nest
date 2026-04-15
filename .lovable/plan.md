

## Visual Alignment Fixes

### Issues Found

1. **Background gradient** — Current: `linear-gradient(to right, #FFF3FF, #F5EBFF, #E8E6FF, #C8DCFF)` (4 stops). Figma shows: `0%: #FFF3FF → 56%: #ECEAFF → 100%: #C8DCFF` (3 stops). The direction and stop positions need correction.

2. **Title gradient missing on Analytics and Store Settings** — Dashboard, Inventory, Customers, and Payouts use `title-gradient`. Analytics uses plain `text-2xl font-bold` with Cormorant Garamond. Store Settings uses plain `text-xl font-semibold` with Cormorant Garamond. Both need the `title-gradient` class.

3. **Inventory Value Trend chart style mismatch** — The Figma screenshots show a **bar chart** with rounded-top teal/green bars and value labels on top (like the "Requests" chart in the screenshot). Currently it's an AreaChart with gradient fills.

4. **Drawer/Sheet styling** — Current drawers are flush against the right edge. The user wants them frosted, offset from the right corner (matching the design). This means adding margin/inset, rounded corners on all sides, and frosted glass background.

5. **Payouts detail** — Currently uses a centered `Dialog`. Should be a right-side `Sheet` drawer matching the frosted offset style.

---

### Plan

#### 1. Fix page-gradient (background)
**File: `src/index.css`**
- Change `.page-gradient` to: `linear-gradient(135deg, #FFF3FF 0%, #ECEAFF 56%, #C8DCFF 100%)` — matching the Figma 3-stop gradient exactly.

#### 2. Add title-gradient to Analytics and Store Settings
**File: `components/dashboard/AnalyticsModule.tsx`**
- Replace the Analytics header `h2` to use `title-gradient` class at 36px, same pattern as Dashboard/Inventory/Customers.

**File: `components/StoreSettingsModule.tsx`**
- Replace the Settings header `h1` to use `title-gradient` class at 36px.

#### 3. Restyle Dashboard chart as bar chart
**File: `components/dashboard/OwnerDashboard.tsx`**
- Replace the `AreaChart` with a `BarChart` using rounded-top teal bars.
- Add value labels on top of each bar.
- Match the screenshot style: single metric bars with rounded tops, value displayed inside/above each bar.

#### 4. Frosted offset drawers
**File: `components/ui/sheet.tsx`**
- For `side="right"`, change the default styling to:
  - Add `m-3` (12px inset from edges)
  - Add `rounded-[20px]` on all sides
  - Use `bg-white/80 backdrop-blur-2xl` frosted glass
  - Remove `border-l`, add `ring-1 ring-white/60 shadow-2xl`
  - Adjust `h-full` to `h-[calc(100%-24px)]` to account for margin

This will automatically apply to all drawers: Inventory detail, Customer detail, AI Assist, Customer intake, and Payouts.

#### 5. Convert Payouts detail from Dialog to Sheet
**File: `components/PayoutsModule.tsx`**
- Replace the `Dialog`/`DialogContent` with `Sheet`/`SheetContent` (right-side drawer).
- Keep the same content inside.

#### 6. Remove overrides on individual drawer components
**Files: `InventoryDetailDrawer.tsx`, `CustomerDetailDrawer.tsx`, `CustomerDrawer.tsx`**
- Remove per-component `bg-white/95 backdrop-blur-2xl border-l border-white/60` overrides since the base Sheet component will handle frosted styling globally.

---

### Technical Details
- 6 files modified, 0 new files
- No backend, schema, auth, or workflow changes
- All changes are CSS/visual only

