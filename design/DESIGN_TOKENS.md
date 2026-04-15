# Design Tokens
## Bravo Jewellers CRM — Premium 2026 Visual System

This document defines the exact design tokens extracted from the approved screens.

---

## Color Palette

### Primary Colors
```css
--text-primary: #2B2833      /* Headings, primary text */
--text-secondary: #76707F    /* Body text, labels */
--text-tertiary: #A8A3AE     /* Placeholders, hints */
--text-muted: #5A5463        /* Tip box secondary text */
```

### Accent Colors
```css
--accent-purple: #6B5EF9     /* Primary brand accent */
--accent-purple-hover: #5848D9
--accent-blue: #4889FA       /* Charts, icons */
--accent-teal: #2ECCC4       /* Success, charts */
--accent-orange: #FF9F43     /* Charts, warnings */
--accent-green: #4ADB8A      /* Success states */
--accent-red: #F87171        /* Errors, required fields */
```

### Gold Gradients (Metal Exposure)
```css
--gold-14k-start: #FFF9E6
--gold-14k-mid: #FFECB3
--gold-14k-end: #FFD966
--gold-10k-mid: #FFD966
--gold-10k-end: #FFC733
--gold-icon-dark: #D4A029
--gold-icon-stroke: #B8860B
--gold-icon-light: #F4D03F
```

### Surface Colors
```css
--surface-white-85: rgba(255, 255, 255, 0.85)  /* Main cards */
--surface-white-80: rgba(255, 255, 255, 0.80)  /* Drawers */
--surface-white-70: rgba(255, 255, 255, 0.70)  /* Alternate cards */
--surface-white-60: rgba(255, 255, 255, 0.60)  /* Inputs, filters */
--surface-white-50: rgba(255, 255, 255, 0.50)  /* List items */
--surface-white-40: rgba(255, 255, 255, 0.40)  /* Hover states */
```

### Border Colors
```css
--border-light: rgba(0, 0, 0, 0.04)
--border-medium: rgba(0, 0, 0, 0.06)
--border-focus: rgba(107, 94, 249, 0.40)  /* 40% purple */
--border-white: rgba(255, 255, 255, 0.40)
--border-white-strong: rgba(255, 255, 255, 0.60)
--border-white-ring: rgba(255, 255, 255, 0.70)
--border-white-highlight: rgba(255, 255, 255, 0.80)
```

### Shadow Colors
```css
--shadow-card: rgba(0, 0, 0, 0.04)
--shadow-drawer: rgba(0, 0, 0, 0.08)
--shadow-button: rgba(0, 0, 0, 0.10)
--shadow-header: rgba(0, 0, 0, 0.02)
--shadow-elevated: rgba(0, 0, 0, 0.12)
--shadow-focus: rgba(107, 94, 249, 0.10)  /* Purple focus ring */
```

---

## Gradients

### Background Gradient (Page Level)
```css
background: linear-gradient(
  to right,
  #FFF3FF,      /* Start: soft pink-white */
  #F5EBFF,      /* Via 1: lavender-white */
  #E8E6FF,      /* Via 2: light purple */
  #C8DCFF       /* End: soft blue */
);
```

**Tailwind:** `bg-gradient-to-r from-[#FFF3FF] via-[#F5EBFF] via-[#E8E6FF] to-[#C8DCFF]`

### Title Gradient
```css
background: linear-gradient(
  to right,
  #4889FA,      /* Blue */
  #6B5EF9,      /* Purple */
  #F95DF9       /* Pink */
);
background-clip: text;
-webkit-background-clip: text;
color: transparent;
```

**Tailwind:** `bg-gradient-to-r from-[#4889FA] via-[#6B5EF9] to-[#F95DF9] bg-clip-text text-transparent`

### Icon Container Gradient
```css
background: linear-gradient(
  to bottom right,
  #FFF3FF,      /* Soft pink-white */
  #ECEAFF,      /* Light lavender */
  #C8DCFF       /* Soft blue */
);
```

**Tailwind:** `bg-gradient-to-br from-[#FFF3FF] via-[#ECEAFF] to-[#C8DCFF]`

### Card Background Gradient (Subtle)
```css
background: linear-gradient(
  to bottom right,
  #FAFAFA,      /* Off-white */
  #F8F7FB       /* Lavender tint */
);
```

**Tailwind:** `bg-gradient-to-br from-[#FAFAFA] to-[#F8F7FB]`

### Tip/Notice Box Gradients
```css
/* Info/Tip boxes */
background: linear-gradient(
  to right,
  #E8F4FF,      /* Light blue */
  #F0E8FF       /* Light purple */
);

/* Success boxes */
background: linear-gradient(
  to right,
  #E8F5E9,      /* Light green */
  #F0FFF4       /* Lighter green */
);

/* Warning boxes */
background: linear-gradient(
  to right,
  #FFF9E6,      /* Light yellow */
  #FFFBF0       /* Lighter yellow */
);
```

**Tailwind:** 
- Info: `bg-gradient-to-r from-[#E8F4FF] to-[#F0E8FF]`
- Success: `bg-gradient-to-r from-[#E8F5E9] to-[#F0FFF4]`
- Warning: `bg-gradient-to-r from-[#FFF9E6] to-[#FFFBF0]`

### Green P/L Gradient
```css
background: linear-gradient(
  to right,
  #2ECC71,      /* Green */
  #4ADB8A,      /* Light green */
  #6BECA3       /* Lighter green */
);
background-clip: text;
color: transparent;
```

**Tailwind:** `bg-gradient-to-r from-[#2ECC71] via-[#4ADB8A] to-[#6BECA3] bg-clip-text text-transparent`

---

## Typography

### Font Family
```css
font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
```

### Type Scale

| Use Case | Size | Weight | Tailwind |
|----------|------|--------|----------|
| Page Title | 36px | 600 (Semibold) | `text-[36px] font-semibold` |
| Section Title | 24px | 600 (Semibold) | `text-[24px] font-semibold` |
| Card Title | 18-20px | 600 (Semibold) | `text-[18px] font-semibold` |
| Item Title | 17px | 600 (Semibold) | `text-[17px] font-semibold` |
| Large Metric | 28-32px | 600 (Semibold) | `text-[28px] font-semibold` |
| Body Large | 15px | 400-500 (Regular/Medium) | `text-[15px]` |
| Body | 14px | 400-500 (Regular/Medium) | `text-[14px]` |
| Body Small | 13px | 400-500 (Regular/Medium) | `text-[13px]` |
| Caption | 12px | 400-500 (Regular/Medium) | `text-[12px]` |
| Label | 11-12px | 600 (Semibold) | `text-[11px] font-semibold` |
| Tiny | 11px | 400 (Regular) | `text-[11px]` |

### Letter Spacing
```css
--tracking-tight: -0.025em     /* Page titles */
--tracking-wide: 0.05em        /* Labels (uppercase) */
--tracking-wider: 0.1em        /* Section labels (uppercase) */
```

**Tailwind:**
- Tight: `tracking-tight`
- Wide: `tracking-wide`
- Wider: `tracking-wider`

### Line Height
Use default line heights. For multiline text in tips/notices: `leading-relaxed`

---

## Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| xs | 8px | `gap-2` / `p-2` | Tight spacing |
| sm | 12px | `gap-3` / `p-3` | Compact spacing |
| md | 16px | `gap-4` / `p-4` | Standard spacing |
| lg | 20px | `gap-5` / `p-5` | Card padding |
| xl | 24px | `gap-6` / `p-6` | Section spacing |
| 2xl | 32px | `gap-8` / `p-8` | Page container padding |
| 3xl | 40px | `gap-10` / `p-10` | Modal/drawer padding |

### Container Max Width
```css
--container-max-width: 1600px;
```

**Tailwind:** `max-w-[1600px]`

### Container Padding
```css
--container-padding-x: 32px;   /* 8 in Tailwind scale */
--container-padding-y: 32px;
```

**Tailwind:** `px-8 py-8`

---

## Border Radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| Large Cards | 20px | `rounded-[20px]` |
| Cards | 16px | `rounded-[16px]` |
| Medium Cards | 14px | `rounded-[14px]` |
| Small Cards | 12px | `rounded-[12px]` |
| Icon Containers (11x11) | 12px | `rounded-[12px]` |
| Icon Containers (10x10) | 11px | `rounded-[11px]` |
| Icon Containers (9x9) | 10px | `rounded-[10px]` |
| Buttons | 10-12px | `rounded-[10px]` / `rounded-[12px]` |
| Form Fields | 10-12px | `rounded-[10px]` / `rounded-[12px]` |
| Pills/Badges | 999px | `rounded-full` |
| Avatars | 999px | `rounded-full` |

---

## Shadows

### Card Shadows
```css
/* Standard card */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04),
            0 4px 6px -2px rgba(0, 0, 0, 0.04);
```
**Tailwind:** `shadow-lg shadow-black/[0.04]`

```css
/* Elevated card (hover) */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08),
            0 10px 10px -5px rgba(0, 0, 0, 0.08);
```
**Tailwind:** `shadow-xl shadow-black/[0.08]`

### Drawer/Modal Shadows
```css
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
```
**Tailwind:** `shadow-2xl shadow-black/[0.08]`

```css
/* Drawer with extra elevation */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);
```
**Tailwind:** `shadow-2xl shadow-black/[0.12]`

### Button Shadows
```css
/* Primary dark buttons */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.10),
            0 4px 6px -2px rgba(0, 0, 0, 0.10);
```
**Tailwind:** `shadow-lg shadow-black/10`

```css
/* Accent color buttons */
box-shadow: 0 10px 15px -3px rgba(46, 204, 196, 0.20);
```
**Tailwind:** `shadow-lg shadow-[#2ECCC4]/20`

### Header/Light Shadows
```css
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
```
**Tailwind:** `shadow-sm shadow-black/[0.02]`

### Inner Shadow (for layered icons)
```css
box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
```
**Tailwind:** `shadow-inner`

---

## Borders & Rings

### Border Widths
```css
--border-default: 1px
--border-ring: 2px
```

**Tailwind:**
- `border` (1px)
- `border-2` (2px)
- `ring-1` (1px ring)
- `ring-2` (2px ring)

### Border Colors (by context)
```css
/* Default borders */
border-color: rgba(0, 0, 0, 0.04);   /* Very subtle */
border-color: rgba(0, 0, 0, 0.06);   /* Standard */

/* White borders/rings */
border-color: rgba(255, 255, 255, 0.40);   /* Header */
border-color: rgba(255, 255, 255, 0.60);   /* Cards */
border-color: rgba(255, 255, 255, 0.70);   /* Active tabs */
border-color: rgba(255, 255, 255, 0.80);   /* Icon highlights */

/* Focus states */
border-color: rgba(107, 94, 249, 0.40);
ring-color: rgba(107, 94, 249, 0.10);
ring-width: 4px;
```

**Tailwind:**
- Border: `border-black/[0.04]` or `border-black/[0.06]`
- Ring: `ring-1 ring-white/60` or `ring-2 ring-white/80`
- Focus: `focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10`

---

## Backdrop Filters

### Glass/Frosted Effect
```css
backdrop-filter: blur(12px) saturate(180%);
```

**Tailwind:**
- Small blur: `backdrop-blur-sm` (4px)
- Medium blur: `backdrop-blur-md` (12px)
- Large blur: `backdrop-blur-xl` (24px)

### Usage by Element
- **Header:** `backdrop-blur-xl`
- **Cards:** `backdrop-blur-sm`
- **Drawers:** `backdrop-blur-xl`
- **Drawer backdrop overlay:** `backdrop-blur-sm` or `backdrop-blur-md`

---

## Opacity Scale

| Use | Value | Tailwind |
|-----|-------|----------|
| Full opaque | 1.0 | (default) |
| Primary surface | 0.85 | `bg-white/85` |
| Drawer surface | 0.80 | `bg-white/80` |
| Secondary surface | 0.70 | `bg-white/70` |
| Input surface | 0.60 | `bg-white/60` |
| List item | 0.50 | `bg-white/50` |
| Hover overlay | 0.40 | `bg-white/40` |
| Icon fill | 0.15-0.40 | `fill opacity="0.3"` |
| Backdrop overlay | 0.05-0.08 | `bg-black/[0.05]` |

---

## Icon Sizes

| Context | Container | Icon | Tailwind Container | Tailwind Icon |
|---------|-----------|------|-------------------|---------------|
| Tiny indicator | - | 12px (3) | - | `w-3 h-3` |
| Small icon | - | 16px (4) | - | `w-4 h-4` |
| Standard | - | 20px (5) | - | `w-5 h-5` |
| Large | - | 24px (6) | - | `w-6 h-6` |
| Logo | 36px (9) | 20px (5) | `w-9 h-9` | `w-5 h-5` |
| KPI metric | 44px (11) | 20px (5) | `w-11 h-11` | `w-5 h-5` |
| Action button | 44px (11) | 24px (6) | `w-11 h-11` | `w-6 h-6` |
| Item card | 48px (12) | 24px (6) | `w-12 h-12` | `w-6 h-6` |
| Customer avatar | 40px (10) | - | `w-10 h-10` | - |

### Icon Stroke Width
```css
--icon-stroke-default: 2px
--icon-stroke-bold: 2.5px
--icon-stroke-bolder: 3px
```

**SVG:** `strokeWidth={2}` / `strokeWidth={2.5}` / `strokeWidth={3}`

---

## Transitions

### Duration
```css
--transition-fast: 150ms
--transition-base: 200ms
--transition-slow: 300ms
--transition-drawer: 500ms
```

### Easing
```css
--ease-out: cubic-bezier(0, 0, 0.2, 1)      /* Default */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

**Tailwind:** `transition-all` (applies all properties with default timing)

### Common Transitions
```css
transition: all 150ms cubic-bezier(0, 0, 0.2, 1);
```

**Tailwind:** `transition-all`

---

## Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default content |
| Background | -10 | Page gradient background |
| Dropdown | 10 | Dropdown menus |
| Sticky | 50 | Sticky header |
| Drawer | 20 | Side panels |
| Modal | 50 | Full-screen overlays |

**Tailwind:** `-z-10`, `z-10`, `z-20`, `z-50`

---

## Component-Specific Tokens

### Header
```css
--header-bg: rgba(255, 255, 255, 0.60)
--header-blur: blur(24px)
--header-border: rgba(255, 255, 255, 0.40)
--header-shadow: rgba(0, 0, 0, 0.02)
--header-height: auto (py-4 = 40px total approx)
```

### Navigation Tabs
```css
/* Active tab */
--tab-active-bg: rgba(255, 255, 255, 0.80)
--tab-active-text: #2B2833
--tab-active-shadow: rgba(0, 0, 0, 0.04)
--tab-active-ring: rgba(255, 255, 255, 0.70)

/* Inactive tab */
--tab-inactive-text: #76707F
--tab-hover-bg: rgba(255, 255, 255, 0.40)
```

### Buttons
```css
/* Primary dark button */
--btn-primary-bg: #2B2833
--btn-primary-text: #FFFFFF
--btn-primary-hover: #3B3846
--btn-primary-shadow: rgba(0, 0, 0, 0.10)
--btn-primary-radius: 10-12px
--btn-primary-padding: px-5 py-2.5 (20px x 10px)

/* Secondary button */
--btn-secondary-bg: rgba(255, 255, 255, 0.60)
--btn-secondary-text: #2B2833
--btn-secondary-border: rgba(0, 0, 0, 0.06)
--btn-secondary-hover: rgba(255, 255, 255, 0.80)

/* Accent button (teal) */
--btn-accent-bg: #2ECCC4
--btn-accent-text: #FFFFFF
--btn-accent-hover: #28B8B0
--btn-accent-shadow: rgba(46, 204, 196, 0.20)
```

### Form Fields
```css
--input-bg: #FFFFFF or rgba(255, 255, 255, 0.60)
--input-border: rgba(0, 0, 0, 0.06)
--input-radius: 10-12px
--input-padding: px-4 py-2.5 or px-4 py-3
--input-text: #2B2833
--input-placeholder: #A8A3AE
--input-icon-color: #A8A3AE
--input-focus-border: rgba(107, 94, 249, 0.40)
--input-focus-ring: rgba(107, 94, 249, 0.10)
--input-focus-ring-width: 4px
```

### Status Badges
```css
/* Success */
--badge-success-bg: #E8F5E9
--badge-success-text: #4ADB8A

/* Warning */
--badge-warning-bg: #FFF9E6
--badge-warning-text: #FFB84D

/* Error */
--badge-error-bg: #FFEBEE
--badge-error-text: #F87171

/* Badge styling */
--badge-radius: 9999px (full)
--badge-padding: px-3 py-1.5
--badge-font-size: 13px
--badge-font-weight: 500 (medium)
```

---

## Notes

1. All `rgba()` values can be expressed in Tailwind using the `/[value]` syntax:
   - `rgba(0, 0, 0, 0.04)` → `black/[0.04]`
   - `rgba(255, 255, 255, 0.85)` → `white/85`

2. Exact hex values in square brackets are used for precision:
   - `#6B5EF9` → `[#6B5EF9]`

3. The `backdrop-blur` property requires the `backdrop-filter` plugin in Tailwind (enabled by default in v3+).

4. All measurements are extracted from the approved screens as implemented.

5. Font smoothing is handled automatically by the browser for 'DM Sans'.
