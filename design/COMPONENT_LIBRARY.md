# Component Library
## Bravo Jewellers CRM — Component Specifications

This document provides implementation specifications for all UI components extracted from the approved screens.

---

## Layout Components

### Page Container
Full-page wrapper with gradient background.

```tsx
<div className="min-h-screen relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
  {/* Background Gradient */}
  <div className="fixed inset-0 bg-gradient-to-r from-[#FFF3FF] via-[#F5EBFF] via-[#E8E6FF] to-[#C8DCFF] -z-10" />
  
  {/* Content */}
  <main className="max-w-[1600px] mx-auto px-8 py-8">
    {/* Page content */}
  </main>
</div>
```

**Properties:**
- Max width: `1600px`
- Horizontal padding: `32px` (px-8)
- Vertical padding: `32px` (py-8)
- Font family: `'DM Sans', sans-serif`
- Background: Fixed gradient layer

---

### Header
Sticky translucent header with backdrop blur.

```tsx
<header className="bg-white/60 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50 shadow-sm shadow-black/[0.02]">
  <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
    {/* Logo, Navigation, User Menu */}
  </div>
</header>
```

**Properties:**
- Background: `white/60` with `backdrop-blur-xl`
- Border bottom: `1px solid white/40`
- Shadow: `shadow-sm shadow-black/[0.02]`
- Position: `sticky top-0`
- Z-index: `50`
- Inner padding: `px-8 py-4`

---

## Card Components

### Standard Card
Primary content container.

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60">
  {/* Card content */}
</div>
```

**Variants:**

**Large Card (Modals, Onboarding):**
```tsx
className="bg-white/85 backdrop-blur-sm rounded-[20px] p-10 shadow-2xl shadow-black/[0.08] ring-1 ring-white/60"
```

**Compact Card:**
```tsx
className="bg-white/85 backdrop-blur-sm rounded-[16px] p-5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60"
```

**Secondary Surface:**
```tsx
className="bg-white/60 backdrop-blur-sm rounded-[14px] p-5 ring-1 ring-black/[0.04]"
```

**Hover State (for clickable cards):**
```tsx
className="... hover:shadow-xl hover:shadow-black/[0.08] transition-all"
```

**Properties:**
- Background: `white/85` with `backdrop-blur-sm`
- Border radius: `16px` (standard), `20px` (large)
- Padding: `p-5` (compact), `p-6` (standard), `p-8-p-10` (large)
- Shadow: `shadow-lg shadow-black/[0.04]`
- Ring: `ring-1 ring-white/60`

---

### Metric/KPI Card
Displays key performance indicators.

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] p-5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 hover:shadow-xl hover:shadow-black/[0.08] transition-all">
  <div className="flex items-start justify-between mb-4">
    <div className="text-[12px] text-[#76707F] font-medium">Label</div>
    <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF] flex items-center justify-center shadow-md ring-2 ring-white/80">
      {/* Icon */}
    </div>
  </div>
  <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">Value</div>
</div>
```

**Icon Container (11x11):**
- Size: `w-11 h-11` (44px)
- Border radius: `rounded-[12px]`
- Background: `bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF]`
- Shadow: `shadow-md`
- Ring: `ring-2 ring-white/80`

---

### Tip/Notice Box
Informational message container.

```tsx
<div className="bg-gradient-to-r from-[#E8F4FF] to-[#F0E8FF] rounded-[12px] p-4 flex items-start gap-3 shadow-sm shadow-black/[0.02]">
  <div className="w-5 h-5 rounded-full bg-[#4889FA] flex items-center justify-center flex-shrink-0 mt-0.5">
    <svg className="w-3 h-3 text-white" {...iconProps}>
      {/* Info icon */}
    </svg>
  </div>
  <div className="flex-1">
    <div className="text-[13px] font-medium text-[#2B2833] mb-0.5">Title</div>
    <div className="text-[12px] text-[#5A5463] leading-relaxed">Message</div>
  </div>
</div>
```

**Variants:**

**Success:**
```tsx
className="bg-gradient-to-r from-[#E8F5E9] to-[#F0FFF4] ..."
// Icon bg: bg-[#4ADB8A]
```

**Warning:**
```tsx
className="bg-gradient-to-r from-[#FFF9E6] to-[#FFFBF0] ..."
// Icon bg: bg-[#FFB84D]
```

**Properties:**
- Border radius: `12px`
- Padding: `p-4`
- Icon size: `w-5 h-5` circular
- Inner icon: `w-3 h-3`
- Title: `13px medium`
- Body: `12px regular` with `leading-relaxed`

---

## Button Components

### Primary Button (Dark)
Main call-to-action button.

```tsx
<button className="px-5 py-2.5 bg-[#2B2833] text-white rounded-[10px] text-[15px] font-semibold hover:bg-[#3B3846] transition-all shadow-lg shadow-black/10">
  Button Text
</button>
```

**With Icon:**
```tsx
<button className="... flex items-center gap-2">
  <svg className="w-4 h-4" {...iconProps} />
  Button Text
</button>
```

**Properties:**
- Background: `#2B2833`
- Hover: `#3B3846`
- Text: `white 15px semibold`
- Padding: `px-5 py-2.5` (20px x 10px)
- Border radius: `10px`
- Shadow: `shadow-lg shadow-black/10`

---

### Secondary Button (Light)
Secondary action button.

```tsx
<button className="px-5 py-2.5 bg-white/60 border border-black/[0.06] text-[#2B2833] rounded-[10px] text-[15px] font-medium hover:bg-white/80 transition-all shadow-sm shadow-black/[0.02]">
  Button Text
</button>
```

**Properties:**
- Background: `white/60`
- Border: `1px solid black/[0.06]`
- Hover: `white/80`
- Text: `#2B2833 15px medium`
- Padding: `px-5 py-2.5`
- Border radius: `10px`
- Shadow: `shadow-sm shadow-black/[0.02]`

---

### Accent Button (Teal)
Highlighted action button.

```tsx
<button className="px-5 py-3.5 bg-[#2ECCC4] text-white rounded-[12px] text-[15px] font-semibold hover:bg-[#28B8B0] transition-all shadow-lg shadow-[#2ECCC4]/20">
  Complete Action
</button>
```

**Properties:**
- Background: `#2ECCC4`
- Hover: `#28B8B0`
- Text: `white 15px semibold`
- Padding: `px-5 py-3.5` (20px x 14px)
- Border radius: `12px`
- Shadow: `shadow-lg shadow-[#2ECCC4]/20`

---

### Icon Button
Button with only an icon.

```tsx
<button className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
  <svg className="w-5 h-5 text-[#76707F]" {...iconProps} />
</button>
```

**Properties:**
- Size: `w-9 h-9` (36px square)
- Border radius: `8px`
- Hover background: `#F8F7FB`
- Icon: `w-5 h-5` with `#76707F` color

---

## Form Components

### Text Input
Standard text input field.

```tsx
<div>
  <label className="block text-[13px] font-medium text-[#76707F] mb-2">
    Label <span className="text-[#F87171]">*</span>
  </label>
  <input
    type="text"
    placeholder="Placeholder text"
    className="w-full px-4 py-2.5 bg-white border border-black/[0.06] rounded-[10px] text-[15px] text-[#2B2833] placeholder:text-[#A8A3AE] focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all shadow-sm shadow-black/[0.02]"
  />
</div>
```

**With Icon Prefix:**
```tsx
<div className="relative">
  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A3AE]" {...iconProps} />
  <input
    className="... pl-12 ..."
  />
</div>
```

**Properties:**
- Background: `white` or `white/60`
- Border: `1px solid black/[0.06]`
- Border radius: `10px`
- Padding: `px-4 py-2.5` (16px x 10px)
- Text: `15px #2B2833`
- Placeholder: `#A8A3AE`
- Icon: `w-5 h-5 #A8A3AE` at `left-4`
- Focus border: `#6B5EF9]/40`
- Focus ring: `4px solid #6B5EF9]/10`
- Shadow: `shadow-sm shadow-black/[0.02]`

---

### Select Dropdown
Dropdown selection field.

```tsx
<select className="w-full px-4 py-2.5 bg-white border border-black/[0.06] rounded-[10px] text-[15px] text-[#2B2833] focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all shadow-sm shadow-black/[0.02]">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

**Properties:** Same as text input.

---

### Textarea
Multi-line text input.

```tsx
<textarea
  rows={3}
  placeholder="Additional details..."
  className="w-full px-4 py-3 bg-white border border-black/[0.06] rounded-[10px] text-[14px] text-[#2B2833] placeholder:text-[#A8A3AE] focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all shadow-sm shadow-black/[0.02] resize-none"
/>
```

**Properties:**
- Same as input but with `resize-none`
- Padding: `px-4 py-3`

---

### Checkbox
Standard checkbox input.

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="w-4 h-4 rounded border-black/[0.12] text-[#6B5EF9] focus:ring-[#6B5EF9]/40 focus:ring-offset-0"
  />
  <span className="text-[14px] text-[#76707F]">Checkbox label</span>
</label>
```

**Properties:**
- Size: `w-4 h-4` (16px)
- Border radius: `rounded` (4px)
- Border: `black/[0.12]`
- Checked color: `#6B5EF9`
- Focus ring: `#6B5EF9]/40`

---

### Radio Button
Radio selection input.

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="radio"
    name="group"
    className="w-4 h-4 text-[#6B5EF9] focus:ring-[#6B5EF9]/40 focus:ring-offset-0"
  />
  <span className="text-[14px] text-[#2B2833]">Radio label</span>
</label>
```

**Properties:**
- Size: `w-4 h-4`
- Checked color: `#6B5EF9`
- Focus ring: `#6B5EF9]/40`

---

### Search Input
Search field with icon.

```tsx
<div className="relative">
  <input
    type="text"
    placeholder="Search..."
    className="w-64 pl-10 pr-4 py-2 bg-white/60 border border-white/80 rounded-[10px] text-[15px] text-[#2B2833] placeholder:text-[#A8A3AE] focus:outline-none focus:bg-white/80 focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all shadow-sm shadow-black/[0.02]"
  />
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A3AE]" {...iconProps}>
    {/* Search icon */}
  </svg>
</div>
```

**Properties:**
- Width: `256px` (w-64)
- Icon position: `left-3`
- Padding left: `pl-10`

---

## Navigation Components

### Tab Navigation
Horizontal tab bar with active indicator.

```tsx
<nav className="flex items-center gap-2">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      className={`px-4 py-2 rounded-[10px] text-[15px] font-medium transition-all ${
        active
          ? 'bg-white/80 text-[#2B2833] shadow-md shadow-black/[0.04] ring-1 ring-white/70'
          : 'text-[#76707F] hover:text-[#2B2833] hover:bg-white/40'
      }`}
    >
      {tab.label}
    </button>
  ))}
</nav>
```

**Properties:**
- Gap: `gap-2` (8px)
- Active bg: `white/80`
- Active text: `#2B2833`
- Active shadow: `shadow-md shadow-black/[0.04]`
- Active ring: `ring-1 ring-white/70`
- Inactive text: `#76707F`
- Hover bg: `white/40`

---

### Underline Tabs
Tabs with bottom border indicator.

```tsx
<div className="flex gap-2 border-b border-black/[0.04] pb-0">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      className={`px-4 py-2.5 text-[14px] font-medium transition-all relative ${
        active ? 'text-[#2B2833]' : 'text-[#A8A3AE] hover:text-[#76707F]'
      }`}
    >
      {tab.label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4889FA] via-[#6B5EF9] to-[#F95DF9]" />
      )}
    </button>
  ))}
</div>
```

**Properties:**
- Container: `border-b border-black/[0.04]`
- Active indicator: `h-0.5` gradient bar
- Active text: `#2B2833`
- Inactive text: `#A8A3AE`

---

## Table Components

### Table Container

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] overflow-hidden shadow-lg shadow-black/[0.04] ring-1 ring-white/60">
  <div className="px-6 py-4 border-b border-black/[0.04]">
    <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Table Title</h3>
  </div>
  
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

---

### Table Header

```tsx
<thead className="bg-gradient-to-r from-[#FAFAFA] to-[#F8F7FB]">
  <tr>
    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">
      Header
    </th>
  </tr>
</thead>
```

**Properties:**
- Background: `from-[#FAFAFA] to-[#F8F7FB]`
- Text: `11px semibold uppercase` with `tracking-wider`
- Color: `#76707F`
- Padding: `px-6 py-3`

---

### Table Body

```tsx
<tbody className="divide-y divide-black/[0.04]">
  <tr className="hover:bg-[#FAFAF9] transition-colors">
    <td className="px-6 py-4 text-[14px] text-[#2B2833] font-medium">
      Cell Content
    </td>
  </tr>
</tbody>
```

**Properties:**
- Row divider: `divide-black/[0.04]`
- Hover: `bg-[#FAFAF9]`
- Cell padding: `px-6 py-4`
- Text: `14px #2B2833`

---

## Icon Components

### Icon Container (Standard)
Premium gradient icon container.

```tsx
<div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF] flex items-center justify-center shadow-md ring-2 ring-white/80">
  <svg className="w-5 h-5 text-[#6B5EF9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    {/* Icon path */}
  </svg>
</div>
```

**Size Variants:**

**Small (9x9):**
```tsx
className="w-9 h-9 rounded-[11px] ..."
```

**Medium (10x10):**
```tsx
className="w-10 h-10 rounded-[10px] ..."
```

**Large (12x12):**
```tsx
className="w-12 h-12 rounded-[12px] ..."
```

**Properties:**
- Background: `from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF]`
- Shadow: `shadow-md`
- Ring: `ring-2 ring-white/80`
- Icon color: `#6B5EF9`
- Icon stroke: `2.5px`

---

### Gold Icon Container (Metal Exposure)

```tsx
<div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#FFF9E6] via-[#FFECB3] to-[#FFD966] flex items-center justify-center shadow-md ring-2 ring-white/80">
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    {/* Gold icon with fills and strokes */}
  </svg>
</div>
```

**Properties:**
- Background: Gold gradient
- Icon includes fill layers with opacity for 3D effect
- Stroke color: `#D4A029`, `#B8860B`
- Fill colors: Various gold tones with opacity

---

### Circular Icon Badge (Tip Boxes)

```tsx
<div className="w-5 h-5 rounded-full bg-[#4889FA] flex items-center justify-center flex-shrink-0 mt-0.5">
  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    {/* Icon */}
  </svg>
</div>
```

**Properties:**
- Size: `w-5 h-5` (20px)
- Shape: `rounded-full`
- Background: Solid color (`#4889FA`, `#4ADB8A`, `#FFB84D`)
- Inner icon: `w-3 h-3` white with `strokeWidth={3}`

---

## Avatar Components

### User Avatar (Initials)

```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF] flex items-center justify-center text-[#6B5EF9] text-[14px] font-bold shadow-md ring-2 ring-white/80">
  AS
</div>
```

**Properties:**
- Size: `w-10 h-10` (40px)
- Shape: `rounded-full`
- Background: Icon gradient
- Text: `14px bold #6B5EF9`
- Shadow: `shadow-md`
- Ring: `ring-2 ring-white/80`

---

## Drawer Components

### Side Drawer (Right)

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-end bg-black/[0.08] backdrop-blur-sm" onClick={onClose}>
  
  {/* Drawer */}
  <div className="w-[440px] h-[calc(100vh-32px)] mr-4 bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/[0.15] flex flex-col rounded-[20px] ring-1 ring-white/60" onClick={(e) => e.stopPropagation()}>
    
    {/* Header */}
    <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
      <h3 className="text-[22px] font-semibold text-[#2B2833] tracking-tight">Title</h3>
      <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#F8F7FB] transition-colors">
        <svg className="w-5 h-5 text-[#76707F]" {...iconProps}>
          {/* Close icon */}
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* Drawer content */}
    </div>

    {/* Footer */}
    <div className="p-6 border-t border-black/[0.06]">
      {/* Footer actions */}
    </div>
  </div>
</div>
```

**Properties:**
- **Backdrop:** `bg-black/[0.08] backdrop-blur-sm`
- **Drawer width:** `440px`
- **Drawer height:** `calc(100vh - 32px)`
- **Margin right:** `16px` (mr-4)
- **Background:** `white/80` with `backdrop-blur-xl`
- **Border radius:** `20px`
- **Shadow:** `shadow-2xl shadow-black/[0.15]`
- **Ring:** `ring-1 ring-white/60`

---

### Full-Height Right Panel (Take-In)

```tsx
<div className="w-[420px] bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/[0.12] flex flex-col relative z-20 -my-8 mr-0 rounded-l-[20px] ring-1 ring-white/60" style={{ minHeight: 'calc(100vh - 80px)' }}>
  {/* Panel content */}
</div>
```

**Properties:**
- Width: `420px`
- Background: `white/80` with `backdrop-blur-xl`
- Border radius: `rounded-l-[20px]` (left side only)
- Shadow: `shadow-2xl shadow-black/[0.12]`
- Min height: `calc(100vh - 80px)`
- Negative margins: `-my-8` to extend beyond container

---

## Badge Components

### Status Badge

```tsx
<span className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#E8F5E9] text-[#4ADB8A]">
  Completed
</span>
```

**Variants:**

**Success:**
```tsx
className="... bg-[#E8F5E9] text-[#4ADB8A]"
```

**Warning:**
```tsx
className="... bg-[#FFF9E6] text-[#FFB84D]"
```

**Error:**
```tsx
className="... bg-[#FFEBEE] text-[#F87171]"
```

**Properties:**
- Padding: `px-3 py-1.5` (12px x 6px)
- Border radius: `rounded-full`
- Text: `13px medium`

---

## Progress Components

### Progress Bar

```tsx
<div>
  <div className="flex items-center justify-between mb-2">
    <span className="text-[13px] text-[#76707F]">Step 1 of 3</span>
    <span className="text-[13px] font-medium text-[#6B5EF9]">33% complete</span>
  </div>
  <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
    <div className="h-full w-1/3 bg-gradient-to-r from-[#4889FA] via-[#6B5EF9] to-[#F95DF9] rounded-full transition-all duration-500" />
  </div>
</div>
```

**Properties:**
- Track height: `8px` (h-2)
- Track background: `black/[0.04]`
- Track radius: `rounded-full`
- Progress bar: Title gradient
- Transition: `duration-500`

---

## Special Components

### Page Title

```tsx
<h1 className="text-[36px] font-semibold mb-1 tracking-tight bg-gradient-to-r from-[#4889FA] via-[#6B5EF9] to-[#F95DF9] bg-clip-text text-transparent">
  Page Title
</h1>
<p className="text-[15px] text-[#76707F]">Subtitle</p>
```

**Properties:**
- Size: `36px semibold`
- Tracking: `tight`
- Gradient: Title gradient with `bg-clip-text`
- Subtitle: `15px #76707F`

---

### Section Divider

```tsx
<div className="border-t border-black/[0.04] pt-8">
  {/* New section */}
</div>
```

**Properties:**
- Border: `1px solid black/[0.04]`
- Padding top: `32px` (pt-8)

---

### Empty State

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] p-16 shadow-lg shadow-black/[0.04] ring-1 ring-white/60 text-center">
  <div className="text-[#A8A3AE] text-[15px]">No items yet</div>
</div>
```

**Properties:**
- Large padding: `p-16` (64px)
- Text: `15px #A8A3AE`
- Center aligned

---

## Utility Classes

### Hover States

```css
hover:bg-[#FAFAF9]        /* Table rows */
hover:bg-white/80          /* Buttons, inputs */
hover:bg-[#F8F7FB]        /* Icon buttons */
hover:shadow-xl           /* Cards */
hover:text-[#2B2833]      /* Links */
```

### Group Hover (for child elements)

```tsx
<div className="group">
  <button className="opacity-0 group-hover:opacity-100">
    {/* Appears on parent hover */}
  </button>
</div>
```

### Focus States

```css
focus:outline-none
focus:border-[#6B5EF9]/40
focus:ring-4
focus:ring-[#6B5EF9]/10
```

### Transitions

```css
transition-all            /* Most elements */
transition-colors         /* Text color changes */
transition-transform      /* Icon scale */
```

---

## Implementation Notes

1. **Backdrop Blur:** Requires Tailwind CSS v3+ with default backdrop-filter support.

2. **Custom Colors:** Use square bracket notation for exact hex values: `bg-[#6B5EF9]`

3. **Opacity in RGB:** Use slash notation: `bg-white/85` = `rgba(255, 255, 255, 0.85)`

4. **Font Loading:** Import 'DM Sans' in `/src/styles/fonts.css` via Google Fonts.

5. **Icon Stroke Width:** For premium 3D-like icons, use `strokeWidth={2.5}` combined with fill layers at various opacities.

6. **Gradients:** Multi-stop gradients use two `via-` classes: `bg-gradient-to-r from-[A] via-[B] via-[C] to-[D]`

7. **Responsive:** All measurements are fixed (not responsive). Mobile adaptations would require additional breakpoints.

8. **Z-index:** Maintain hierarchy: background (-10), content (0), sticky (50), drawers (20), modals (50).

9. **Accessibility:** All interactive elements include keyboard focus states and sufficient color contrast.

10. **Performance:** `backdrop-blur` can impact performance on lower-end devices. Consider reduced-motion preferences for production.
