---
name: Academic Focus
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#41485e'
  on-tertiary: '#ffffff'
  tertiary-container: '#586076'
  on-tertiary-container: '#d4dbf5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system targets students, educators, and academic administrators seeking a friction-free productivity environment. The interface evokes quiet clarity, cognitive ease, and purposeful momentum. 

Visual decisions follow an elevated modern minimalist philosophy:
- Restraint over ornamentation: zero gratuitous gradients, heavy drop shadows, or glassmorphic blur filters.
- Whitespace as an active structural element to isolate key cognitive tasks such as assignment tracking, grade evaluation, and timetable reviews.
- Strict functional contrast where color serves solely as an intentional signal—directing focus, signaling status, or establishing hierarchy.

## Colors
The palette balances a clean off-white canvas with sharp structural neutral tones and a vibrant, intellectual indigo accent.

### Palette Architecture
- **Primary Indigo (`#4F46E5`):** Reserved for primary interactive controls, active navigation anchors, progress indicators, and confirmed states.
- **Surface Canvas (`#F8FAFC`):** The structural background layer providing soft contrast against elevated cards.
- **Surface Card / Elevated (`#FFFFFF`):** High-clarity white surfaces used for cards, table rows, and dialogue panels.
- **Dark Slate Core (`#0F172A`):** The primary body and headline token, offering accessible WCAG AAA contrast without harsh black tones.
- **Slate Secondary (`#64748B`):** Supporting metadata, label headers, input placeholders, and tertiary captions.
- **Border Slate (`#E2E8F0`):** Single-pixel perimeter strokes delineating structural bounds cleanly.

### Functional Status System
Semantic states bypass decorative usage and exist strictly for immediate comprehension:
- **Success (`#10B981`):** Submissions completed, passing grades, on-track attendance.
- **Warning (`#F59E0B`):** Due dates approaching within 24 hours, pending approvals, grade thresholds needing review.
- **Critical / Destructive (`#EF4444`):** Overdue assignments, alerts, failed verifications.

## Typography
The system uses `Inter` exclusively to maintain systematic legibility, clean vertical metric alignment, and effortless scaling across high-density tabular environments.

### Hierarchy & Treatment
- **Display & Headlines:** Set in Semi-Bold (600) and Bold (700) with slight negative tracking (`-0.01em` to `-0.02em`) to maintain tightness at scale.
- **Body & Data:** Standardized at 14px (`body-md`) for primary table and list rows to optimize information density without sacrificing readability.
- **Data Labels & Headers:** Set in Medium (500) with uppercase transformations applied only to secondary table column headers (`caption`), paired with soft tracking for immediate visual differentiation.

## Layout & Spacing
A fluid 12-column grid anchors the desktop canvas with standard 24px (`1.5rem`) gutters and a max-width content container set to 1440px.

### Responsive Breakpoints
- **Desktop (1024px+):** 12 columns, fixed 256px sidebar, 32px canvas margins, 24px column gutters.
- **Tablet (768px - 1023px):** 8 columns, collapsible navigation drawer, 24px canvas margins, 16px column gutters.
- **Mobile (< 768px):** 4 columns, persistent top header with bottom navigation sheet, 16px outer margins, single-column stack for data cards.

### Spacing Cadence
- Gaps between logical modules (e.g., student summary header to active course table) adhere to `space-xl` (32px).
- Internal element spacing within cards follows `space-lg` (24px) for card padding, collapsing to `space-md` (16px) on mobile viewports.
- Grouped inline items (e.g., badges, status dots, icon pairings) strictly leverage `space-xs` (4px) or `space-sm` (8px).

## Elevation & Depth
Depth is realized primarily through surface separation and low-contrast borders rather than deep volumetric layering.

### Surface Hierarchy
1. **Base Layer:** Canvas background (`#F8FAFC`).
2. **Surface Layer:** White containers (`#FFFFFF`) with 1px border stroke (`#E2E8F0`).
3. **Elevated Panels (Dropdowns, Popovers, Modals):** White containers framed by `#E2E8F0` with a subtle diffused shadow.

### Shadow Specifications
- **Resting Elements (`shadow-sm`):** `0 1px 2px 0 rgba(15, 23, 42, 0.05)`. Used on standard cards, buttons, and segmented control containers.
- **Hover/Interactive State:** `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Modals & Overlays:** `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
- No shadows may utilize saturated primary colors for casting glows; all shadow hues are derived strictly from slate neutrals.

## Shapes
A clean 12px (`0.75rem` / `rounded-xl`) radius forms the signature shape geometry across all cards, modals, and input fields.

### Application Rules
- **Cards, Panels, & Tables:** Bound by 12px outer radius. Contained tables must clip inner edge rows seamlessly.
- **Interactive Controls (Buttons, Inputs, Selectors):** Match the 8px to 12px curvature for consistent visual weight.
- **Tags, Badges, & Chips:** Utilize pill radius (9999px) to distinctly contrast functional meta-tags from structural rectilinear containers.

## Components

### Buttons
- **Primary:** Solid `#4F46E5` fill, `#FFFFFF` text, `font-medium`, 12px radius, `shadow-sm`. Hover: `#4338CA` with 150ms ease-in-out transition. Focus-visible: 2px solid `#4F46E5` outline with a 2px offset.
- **Secondary:** White `#FFFFFF` surface, 1px solid `#E2E8F0` border, `#0F172A` text. Hover: `#F8FAFC` surface with `#CBD5E1` border.
- **Ghost:** Transparent background, `#64748B` text. Hover: `#F1F5F9` background, `#0F172A` text.

### Form Inputs & Select Fields
- Height: 40px standard.
- Surface: `#FFFFFF`, 1px solid `#E2E8F0` border, 12px radius.
- Padding: 12px horizontal.
- Typography: 14px `#0F172A`, placeholder in `#94A3B8`.
- Focus State: Border transitions to `#4F46E5` with a subtle 3px ring (`rgba(79, 70, 229, 0.12)`), 200ms transition.

### Chips & Status Badges
- Pill-shaped (`rounded-full`), 24px height, horizontal padding of 10px, 12px text size (`label-sm`).
- **Success Chip:** `#ECFDF5` background, `#065F46` text, 1px solid `#A7F3D0`.
- **Warning Chip:** `#FFFBEB` background, `#92400E` text, 1px solid `#FDE68A`.
- **Critical Chip:** `#FEF2F2` background, `#991B1B` text, 1px solid `#FECACA`.
- **Neutral Chip:** `#F1F5F9` background, `#334155` text, 1px solid `#E2E8F0`.

### Data Tables
- Frame: Wrapped in a single card container with 12px radius and 1px `#E2E8F0` border.
- Header: `#F8FAFC` background, 40px height, text in 12px uppercase `#64748B`, font-weight 600, bottom-bordered with `#E2E8F0`.
- Rows: `#FFFFFF` background, 52px height, separated by single-pixel horizontal divider (`#E2E8F0`). Row hover transitions to `#F8FAFC` over 150ms.
- Cells: Vertical text alignment centered, primary data in `#0F172A`, supporting subtext in `#64748B`.

### Cards
- Surface: `#FFFFFF`, 12px radius, 1px solid `#E2E8F0`, `shadow-sm`.
- Padding: 20px or 24px internal padding (`space-lg`).
- Header: Separated by clear hierarchy or optional sub-divider rule, featuring 16px semibold title with trailing actions or status indicators.

### Checkboxes & Radios
- Size: 16px x 16px.
- Unchecked: `#FFFFFF` fill, 1px solid `#CBD5E1`.
- Checked: `#4F46E5` fill with pure white Lucide checkmark icon. Radius is 4px for checkboxes, circular for radios.

### Iconography
- Strict Lucide-style 1.5px outline stroke.
- Sized strictly to 16px, 18px, or 20px within functional controls; neutral `#64748B` tone by default, inheriting `#4F46E5` on active navigation states.