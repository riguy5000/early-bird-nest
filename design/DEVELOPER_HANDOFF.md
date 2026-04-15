# Developer Handoff
## Bravo Jewellers CRM — Implementation Guide

This document provides a complete handoff for implementing the Bravo Jewellers CRM visual system.

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

**Required packages:**
- React 18+
- Tailwind CSS v3+
- TypeScript

### 2. Configure Tailwind

The project uses Tailwind CSS v4 with custom configuration in `/src/styles/theme.css`.

**Key features enabled:**
- Backdrop filters (default in v3+)
- Custom color values via square brackets
- Opacity modifiers via slash notation

### 3. Import Fonts

Add to `/src/styles/fonts.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
```

Apply globally:

```tsx
<div style={{ fontFamily: "'DM Sans', sans-serif" }}>
  {/* Your app */}
</div>
```

### 4. Add Background Gradient

Every page should have this structure:

```tsx
<div className="min-h-screen relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
  {/* Fixed gradient background */}
  <div className="fixed inset-0 bg-gradient-to-r from-[#FFF3FF] via-[#F5EBFF] via-[#E8E6FF] to-[#C8DCFF] -z-10" />
  
  {/* Your content */}
</div>
```

---

## Design System Files

### Core Documentation

1. **DESIGN_TOKENS.md** — Complete token reference
   - All color hex values
   - Gradients (background, title, icons, tips)
   - Typography scale
   - Spacing scale
   - Border radii
   - Shadows
   - Transitions
   - Component-specific tokens

2. **COMPONENT_LIBRARY.md** — Component specifications
   - Layout components
   - Card components
   - Button components
   - Form components
   - Table components
   - Icon components
   - Drawer components
   - All other UI elements

3. **This file (DEVELOPER_HANDOFF.md)** — Implementation guide

---

## Color System

### Primary Text Colors

```tsx
// Headings, primary content
className="text-[#2B2833]"

// Body text, labels
className="text-[#76707F]"

// Placeholders, hints
className="text-[#A8A3AE]"

// Muted text (in tip boxes)
className="text-[#5A5463]"
```

### Accent Colors

```tsx
// Purple (primary brand)
className="text-[#6B5EF9]"
className="bg-[#6B5EF9]"

// Blue (charts, icons)
className="text-[#4889FA]"

// Teal (success, charts)
className="text-[#2ECCC4]"

// Orange (charts, warnings)
className="text-[#FF9F43]"

// Green (success states)
className="text-[#4ADB8A]"

// Red (errors)
className="text-[#F87171]"
```

### Surface Colors

```tsx
// Main cards
className="bg-white/85 backdrop-blur-sm"

// Drawers
className="bg-white/80 backdrop-blur-xl"

// Form inputs
className="bg-white/60"

// List items
className="bg-white/50"
```

---

## Typography System

### Usage Guide

```tsx
// Page titles
<h1 className="text-[36px] font-semibold tracking-tight bg-gradient-to-r from-[#4889FA] via-[#6B5EF9] to-[#F95DF9] bg-clip-text text-transparent">
  Dashboard
</h1>

// Subtitles
<p className="text-[15px] text-[#76707F]">Owner Summary</p>

// Section titles
<h2 className="text-[24px] font-semibold text-[#2B2833]">Section</h2>

// Card titles
<h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">Card Title</h3>

// Body text
<p className="text-[14px] text-[#76707F]">Body text</p>

// Small text
<span className="text-[13px] text-[#A8A3AE]">Small text</span>

// Labels (uppercase)
<label className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Label</label>

// Large metrics
<div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">$1,234</div>
```

---

## Common Patterns

### 1. Standard Card

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] p-6 shadow-lg shadow-black/[0.04] ring-1 ring-white/60">
  <h3 className="text-[18px] font-semibold text-[#2B2833] mb-4">Card Title</h3>
  {/* Card content */}
</div>
```

### 2. KPI Metric Card

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] p-5 shadow-lg shadow-black/[0.04] ring-1 ring-white/60">
  <div className="flex items-start justify-between mb-4">
    <div className="text-[12px] text-[#76707F] font-medium">Items in Stock</div>
    <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF] flex items-center justify-center shadow-md ring-2 ring-white/80">
      <svg className="w-5 h-5 text-[#6B5EF9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {/* Icon */}
      </svg>
    </div>
  </div>
  <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">19</div>
</div>
```

### 3. Tip/Notice Box

```tsx
<div className="bg-gradient-to-r from-[#E8F4FF] to-[#F0E8FF] rounded-[12px] p-4 flex items-start gap-3 shadow-sm shadow-black/[0.02]">
  <div className="w-5 h-5 rounded-full bg-[#4889FA] flex items-center justify-center flex-shrink-0 mt-0.5">
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
  <div className="flex-1">
    <div className="text-[13px] font-medium text-[#2B2833] mb-0.5">Quick Tip</div>
    <div className="text-[12px] text-[#5A5463] leading-relaxed">Your tip message here.</div>
  </div>
</div>
```

### 4. Primary Button

```tsx
<button className="px-5 py-2.5 bg-[#2B2833] text-white rounded-[10px] text-[15px] font-semibold hover:bg-[#3B3846] transition-all shadow-lg shadow-black/10">
  Button Text
</button>
```

### 5. Text Input

```tsx
<div>
  <label className="block text-[13px] font-medium text-[#76707F] mb-2">
    Label <span className="text-[#F87171]">*</span>
  </label>
  <input
    type="text"
    placeholder="Placeholder"
    className="w-full px-4 py-2.5 bg-white border border-black/[0.06] rounded-[10px] text-[15px] text-[#2B2833] placeholder:text-[#A8A3AE] focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all shadow-sm shadow-black/[0.02]"
  />
</div>
```

### 6. Table

```tsx
<div className="bg-white/85 backdrop-blur-sm rounded-[16px] overflow-hidden shadow-lg shadow-black/[0.04] ring-1 ring-white/60">
  <div className="px-6 py-4 border-b border-black/[0.04]">
    <h3 className="text-[18px] font-semibold text-[#2B2833]">Table Title</h3>
  </div>
  
  <table className="w-full">
    <thead className="bg-gradient-to-r from-[#FAFAFA] to-[#F8F7FB]">
      <tr>
        <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">
          Header
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-black/[0.04]">
      <tr className="hover:bg-[#FAFAF9] transition-colors">
        <td className="px-6 py-4 text-[14px] text-[#2B2833]">Cell</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 7. Right Drawer

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-end bg-black/[0.08] backdrop-blur-sm" onClick={onClose}>
  
  {/* Drawer */}
  <div 
    className="w-[440px] h-[calc(100vh-32px)] mr-4 bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/[0.15] flex flex-col rounded-[20px] ring-1 ring-white/60"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header */}
    <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
      <h3 className="text-[22px] font-semibold text-[#2B2833]">Drawer Title</h3>
      <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#F8F7FB] transition-colors">
        <svg className="w-5 h-5 text-[#76707F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* Drawer content */}
    </div>

    {/* Footer */}
    <div className="p-6 border-t border-black/[0.06]">
      <button className="w-full py-3 bg-[#2B2833] text-white rounded-[10px]">Action</button>
    </div>
  </div>
</div>
```

---

## Icon System

### Standard Icon Container

Use this pattern for all metric cards, quick actions, and list items:

```tsx
<div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF] flex items-center justify-center shadow-md ring-2 ring-white/80">
  <svg className="w-5 h-5 text-[#6B5EF9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    {/* Icon path */}
  </svg>
</div>
```

**Size variants:**
- Small: `w-9 h-9 rounded-[11px]`
- Medium: `w-10 h-10 rounded-[10px]`
- Standard: `w-11 h-11 rounded-[12px]`
- Large: `w-12 h-12 rounded-[12px]`

### Premium 3D Icon Style

For a more dimensional look, combine stroke paths with filled shapes at various opacities:

```tsx
<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
  {/* Base shape with opacity fill */}
  <path d="..." fill="#9B8FBD" opacity="0.3" />
  
  {/* Main stroke outline */}
  <path d="..." stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  
  {/* Accent fill layers */}
  <path d="..." fill="#6B5EF9" opacity="0.15" />
  
  {/* Highlight elements */}
  <circle cx="12" cy="12" r="1.5" fill="#6B5EF9" />
</svg>
```

**Colors to use:**
- Stroke: `#6B5EF9` (purple)
- Light fill: `#9B8FBD` (lighter purple)
- Opacity range: `0.15` to `0.4`

### Gold Icons (for metal exposure)

```tsx
<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
  <path d="..." fill="#D4A029" opacity="0.4" stroke="#B8860B" strokeWidth="1.5" />
  <path d="..." stroke="#D4A029" strokeWidth="2" strokeLinecap="round" />
  <circle cx="12" cy="7" r="1.5" fill="#F4D03F" />
</svg>
```

---

## Gradient Reference

### Page Background
```tsx
className="bg-gradient-to-r from-[#FFF3FF] via-[#F5EBFF] via-[#E8E6FF] to-[#C8DCFF]"
```

### Page Title
```tsx
className="bg-gradient-to-r from-[#4889FA] via-[#6B5EF9] to-[#F95DF9] bg-clip-text text-transparent"
```

### Icon Container
```tsx
className="bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF]"
```

### Card Header (subtle)
```tsx
className="bg-gradient-to-r from-[#FAFAFA] to-[#F8F7FB]"
```

### Tip Box (info)
```tsx
className="bg-gradient-to-r from-[#E8F4FF] to-[#F0E8FF]"
```

### Tip Box (success)
```tsx
className="bg-gradient-to-r from-[#E8F5E9] to-[#F0FFF4]"
```

### Tip Box (warning)
```tsx
className="bg-gradient-to-r from-[#FFF9E6] to-[#FFFBF0]"
```

### Gold 14K
```tsx
className="bg-gradient-to-br from-[#FFF9E6] via-[#FFECB3] to-[#FFD966]"
```

### Green P/L Text
```tsx
className="bg-gradient-to-r from-[#2ECC71] via-[#4ADB8A] to-[#6BECA3] bg-clip-text text-transparent"
```

---

## Spacing Guidelines

### Container Padding
```tsx
// Main page container
className="px-8 py-8"  // 32px all around

// Card padding
className="p-5"        // 20px (compact)
className="p-6"        // 24px (standard)
className="p-8"        // 32px (large)
className="p-10"       // 40px (modal/drawer)
```

### Element Spacing
```tsx
// Section spacing
className="space-y-6"  // 24px vertical gap

// Card grid spacing
className="gap-4"      // 16px gap
className="gap-6"      // 24px gap

// Form field spacing
className="space-y-5"  // 20px between fields

// Button group spacing
className="gap-3"      // 12px between buttons
```

---

## Responsive Breakpoints

**Note:** The current implementation uses fixed pixel values and is not responsive. For mobile/tablet support, you would need to add:

```tsx
// Example responsive pattern
className="px-4 md:px-8 lg:px-8"              // Container padding
className="text-[24px] md:text-[36px]"        // Title size
className="grid grid-cols-1 md:grid-cols-3"   // Grid columns
```

**Tailwind breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## Accessibility Checklist

### Required for Production

- [ ] All interactive elements have visible focus states
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Form labels are associated with inputs
- [ ] Icon buttons have `aria-label` attributes
- [ ] Modal/drawer overlays trap focus
- [ ] Keyboard navigation works for all interactions
- [ ] Screen readers can access all content
- [ ] `alt` text provided for all images
- [ ] Error messages are clearly associated with fields
- [ ] Status badges use `role="status"` where appropriate

### Focus States

All interactive elements already include focus states:

```tsx
className="focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10"
```

For custom focus styles, maintain the purple theme and 4px ring width.

---

## Performance Considerations

### Backdrop Blur

`backdrop-blur` is GPU-intensive. For better performance:

1. **Use sparingly:** Only on headers, cards, and drawers
2. **Reduce on low-end devices:**
   ```tsx
   className="backdrop-blur-sm motion-reduce:backdrop-blur-none"
   ```

3. **Avoid on animated elements**

### Gradients

Multi-stop gradients render well but avoid:
- Animating gradient positions
- Using more than 4 color stops
- Applying to large areas that repaint frequently

### Shadows

Current shadow system is optimized with low opacity values. Avoid:
- Multiple nested shadows
- High opacity shadow values (>0.2)
- Very large blur radii (>50px)

---

## Common Mistakes to Avoid

### ❌ Don't Do This

```tsx
// Using generic Tailwind colors instead of exact hex
className="bg-purple-500"  // Wrong

// Skipping backdrop blur on cards
className="bg-white rounded-[16px]"  // Wrong

// Using wrong border radius
className="rounded-lg"  // Wrong (generic)

// Missing ring on icon containers
className="bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF]"  // Incomplete

// Wrong icon stroke width
strokeWidth={2}  // Should be 2.5 for premium look

// Flat icon without fill layers
<path stroke="#6B5EF9" />  // Missing depth
```

### ✅ Do This

```tsx
// Use exact hex values
className="bg-[#6B5EF9]"  // Correct

// Include backdrop blur
className="bg-white/85 backdrop-blur-sm rounded-[16px]"  // Correct

// Use exact pixel radius
className="rounded-[16px]"  // Correct

// Complete icon container
className="bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF] shadow-md ring-2 ring-white/80"  // Complete

// Premium icon stroke
strokeWidth={2.5}  // Correct

// 3D icon with fills
<path fill="#9B8FBD" opacity="0.3" />
<path stroke="#6B5EF9" strokeWidth="2" />  // Correct
```

---

## File Structure

```
/src
├── /styles
│   ├── fonts.css          # Font imports
│   └── theme.css          # Tailwind custom tokens
├── /app
│   ├── /components
│   │   ├── /screens       # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TakeIn.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Payouts.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   └── /auth          # Auth screens
│   │       ├── Login.tsx
│   │       ├── OnboardingStep1.tsx
│   │       ├── OnboardingStep2.tsx
│   │       └── OnboardingStep3.tsx
│   └── App.tsx            # Main app shell
└── /imports               # Assets
```

---

## Testing Checklist

Before shipping, verify:

- [ ] All gradients render correctly in Chrome, Firefox, Safari
- [ ] Backdrop blur works (or has fallback)
- [ ] Focus states are visible
- [ ] Hover states work on all interactive elements
- [ ] Tables are scrollable on overflow
- [ ] Drawers close on backdrop click
- [ ] Drawers close on ESC key
- [ ] Forms validate correctly
- [ ] All icons render at correct size
- [ ] Text is readable at all sizes
- [ ] No layout shift on page load
- [ ] Colors match design tokens exactly

---

## Browser Support

**Tested and supported:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Known issues:**
- Backdrop blur not supported in IE11
- Some gradient rendering differences in older Safari versions
- Focus ring rendering varies between browsers (this is normal)

**Fallbacks:**
```css
/* Add to your global CSS if needed */
@supports not (backdrop-filter: blur(12px)) {
  .backdrop-blur-sm {
    background-color: rgba(255, 255, 255, 0.95);
  }
}
```

---

## Support & Questions

For questions about implementation:

1. Check **DESIGN_TOKENS.md** for exact values
2. Check **COMPONENT_LIBRARY.md** for component specs
3. Review approved screen implementations in `/src/app/components/screens/`

For design clarification:
- All decisions should reference the approved screens
- Do not deviate from the established visual language
- When in doubt, use existing patterns

---

## Change Log

### Version 1.0 (Current)
- Initial design system extraction
- All approved screens documented
- Component library created
- Developer handoff completed

---

## Next Steps

1. **Review** all three documentation files
2. **Test** implementation in your environment
3. **Apply** the design system to new screens
4. **Maintain** consistency across all pages

Remember: The approved screens are the source of truth. Match them exactly.
