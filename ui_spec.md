# ui_spec.md — PayRush Design System & UI Specification

> This document is the single source of truth for all visual and UX decisions in PayRush. Every component, screen, and interaction should be built against this spec. When in doubt, refer here before inventing.

---

## Design Philosophy

**Clean. Fast. Confident.**

PayRush UI should feel like a tool built by someone who respects the user's time. No decorative noise. No feature chest-thumping. Just clean surfaces, clear hierarchy, and interactions that feel instant.

- **Minimalist, not empty** — whitespace is intentional. Every element earns its place.
- **Mobile-first, desktop-enhanced** — primary use case is a freelancer on a phone. Desktop is a power-user upgrade.
- **Professional without being corporate** — approachable enough for a sole trader, polished enough to send to a law firm.
- **Light mode as primary** — designed for bright-light mobile use. Dark mode is a future enhancement.

---

## Colour System

### Brand Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Navy | `#0C447C` | Sidebar background, nav active states |
| Action | Blue | `#185FA5` | Buttons, links, hero card, active indicators |
| Accent Light | Blue 100 | `#B5D4F4` | Chart bars (inactive), light fills |
| Accent Pale | Blue 50 | `#E6F1FB` | Avatar backgrounds, info badges, hover states |

### Neutral Palette

| Role | Hex | Usage |
|------|-----|-------|
| Page background | `#F0F2F5` | Main content area background |
| Card background | `#FFFFFF` | All cards, panels, modals |
| Sidebar | `#0C447C` | Desktop left nav |
| Mid panel | `#1A1F2E` | Reserved — not used in current spec |
| Border default | `rgba(0,0,0,0.08)` | Card borders, dividers (0.5px) |
| Border emphasis | `rgba(0,0,0,0.15)` | Focused inputs, hover emphasis |

### Text

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#111827` | Headings, amounts, names |
| Secondary | `#6B7280` | Labels, subtitles, metadata |
| Tertiary | `#9CA3AF` | Placeholders, disabled states |
| On-dark | `#FFFFFF` | Text on navy/blue backgrounds |
| On-dark muted | `rgba(255,255,255,0.65)` | Subtitles on hero card |

### Semantic Colours

| State | Background | Text | Usage |
|-------|-----------|------|-------|
| Paid / Success | `#EAF3DE` | `#3B6D11` | Invoice status badge |
| Pending / Warning | `#FAEEDA` | `#854F0B` | Invoice status badge |
| Overdue / Danger | `#FCEBEB` | `#A32D2D` | Invoice status badge |
| Draft / Neutral | `#F1EFE8` | `#5F5E5A` | Invoice status badge |
| Sent / Info | `#E6F1FB` | `#185FA5` | Invoice status badge |

---

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
Use Inter via Google Fonts. Weight 400 (regular) and 500 (medium) only. Never 600 or 700 — they are too heavy for this aesthetic.

### Type Scale

| Token | Size | Weight | Line height | Usage |
|-------|------|--------|-------------|-------|
| `hero` | 30px | 500 | 1.2 | Dashboard collected amount |
| `h1` | 22px | 500 | 1.3 | Page titles |
| `h2` | 18px | 500 | 1.35 | Section titles, card headings |
| `h3` | 16px | 500 | 1.4 | Sub-section headings |
| `body` | 14px | 400 | 1.6 | Default body text, form labels |
| `small` | 13px | 400 | 1.5 | Invoice line items, table rows |
| `caption` | 11px | 500 | 1.4 | Section labels (ALLCAPS + tracking) |
| `micro` | 10px | 400 | 1.4 | Timestamps, secondary metadata |

Section labels (e.g. "PAYMENT DETAILS", "BILLED TO") use `caption` size at `letter-spacing: 0.05em` in uppercase. This is the only permitted use of uppercase text.

---

## Spacing System

Base unit: `4px`

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon-to-text gaps, tight inline spacing |
| `sm` | 8px | Component internal padding |
| `md` | 12px | Card internal gaps, list item padding |
| `lg` | 16px | Section padding, card padding |
| `xl` | 20px | Page padding (mobile) |
| `2xl` | 24px | Section vertical rhythm |
| `3xl` | 32px | Page-level vertical spacing |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Badges, small elements, table cells |
| `md` | 8px | Inputs, select dropdowns, buttons |
| `lg` | 12px | CTAs, FABs, action buttons |
| `xl` | 16px | Cards (mobile), hero elements |
| `2xl` | 20px | Modal containers |
| `full` | 9999px | Pills, status badges |

---

## Shadows

PayRush uses **no decorative shadows**. Cards are defined by their border (`0.5px solid rgba(0,0,0,0.08)`), not elevation.

The one exception: focus rings on interactive elements.
```css
box-shadow: 0 0 0 3px rgba(24, 95, 165, 0.25);
```

---

## Component Specifications

### Buttons

**Primary button** — used for the single most important action on a screen.
```
Background: #185FA5
Text: #FFFFFF, 14px, weight 500
Padding: 12px 20px
Border radius: 10px
Height: 44px (mobile), 40px (desktop)
Hover: background darken to #0C447C
Active: scale(0.98)
Disabled: opacity 0.45, no pointer
```

**Secondary button** — supporting actions.
```
Background: transparent
Border: 0.5px solid rgba(0,0,0,0.15)
Text: #111827, 14px, weight 500
Same sizing as primary
Hover: background #F0F2F5
```

**Ghost / text button** — inline actions, links.
```
Background: transparent
Border: none
Text: #185FA5, 14px, weight 400
No padding change on hover — underline only
```

**Destructive button** — delete, cancel.
```
Background: #FCEBEB
Text: #A32D2D, 14px, weight 500
Border: 0.5px solid rgba(163,45,45,0.2)
Hover: background #F7C1C1
```

**Icon button** — circular/square icon-only buttons.
```
Size: 32px × 32px
Background: #FFFFFF
Border: 0.5px solid rgba(0,0,0,0.08)
Border radius: 50% (circular) or 8px (square)
Icon size: 16px
Hover: background #F0F2F5
```

### Form Inputs

All form elements share a consistent base:
```
Height: 40px
Background: #FFFFFF
Border: 0.5px solid rgba(0,0,0,0.12)
Border radius: 8px
Padding: 0 12px
Font size: 14px
Color: #111827
Placeholder color: #9CA3AF
Focus border: 1px solid #185FA5
Focus shadow: 0 0 0 3px rgba(24,95,165,0.15)
```

Textarea uses same base with `min-height: 80px` and `padding: 10px 12px`.

Field labels sit above inputs, never inside (no floating labels).
```
Font size: 11px
Weight: 500
Color: #6B7280
Letter spacing: 0.04em
Uppercase: yes
Margin bottom: 5px
```

Error state:
```
Border: 1px solid #A32D2D
Error message: 12px, color #A32D2D, margin-top 4px
```

### Cards

**Standard card** — the base container for grouped content.
```
Background: #FFFFFF
Border: 0.5px solid rgba(0,0,0,0.08)
Border radius: 16px (mobile), 12px (desktop)
Padding: 18px (mobile), 20px (desktop)
```

**Metric card** — dashboard stat numbers.
```
Background: #F0F2F5
Border: none
Border radius: 10px
Padding: 14px
Label: 11px, #6B7280, uppercase, tracked
Value: 22px, 500, #111827
```

**Hero card** — dashboard collected amount.
```
Background: #185FA5
Border radius: 16px
Padding: 20px
Text: white
Sub-stats: background rgba(255,255,255,0.12), border-radius 8px
```

### Status Badges

```
Font size: 10px
Weight: 500
Padding: 3px 8px
Border radius: 9999px (full pill)
```

See semantic colours table for per-status colours.

**Quote-specific statuses (Phase 6.5):**

| State | Background | Text | Usage |
|-------|-----------|------|-------|
| Accepted / Quote positive | `#EAF3DE` | `#3B6D11` | Quote status badge |
| Declined / Quote negative | `#F1EFE8` | `#5F5E5A` | Quote status badge |

### Navigation

**Mobile bottom nav**
```
Background: #F0F2F5
Border radius: 12px
Padding: 8px 0
4 items: Home, Invoices, Clients, Settings
Item: icon (18px) + label (10px), centered column
Active: color #185FA5
Inactive: color #6B7280
```

**Desktop sidebar**
```
Width: 220px
Background: #0C447C
Padding: 0 (items have own horizontal padding)
Logo area: 20px padding, border-bottom rgba(255,255,255,0.12)
Nav item height: 40px
Nav item padding: 9px 18px
Nav item font: 13px, weight 400
Active item: background rgba(255,255,255,0.10), text #FFFFFF
Inactive item: text rgba(255,255,255,0.6)
Icon size: 16px, Tabler outline
Bottom-pinned items: Settings
```

---

## Screen Specifications

### Mobile Dashboard (Home)

Layout (top to bottom):
1. Status bar
2. Greeting — "Good morning, [Name]" (secondary text + name in primary)
3. **Hero card** — "Collected this month" + amount + % change + 3 stat pills (Invoices sent / Awaiting / Overdue)
4. **7-day bar chart** — labelled Mon–Sun, active day highlighted in `#185FA5`, others in `#B5D4F4`
5. **Recent invoices** — "Recent invoices" label + "See all" link + 3 invoice rows
6. **"New invoice" CTA** — full-width primary button
7. **Bottom nav**

Invoice row anatomy:
```
[Avatar initials circle] [Client name + invoice number + date] [Amount + status badge]
```

### Mobile Invoice View

Background: `#F0F2F5` (page level, not white)

Cards (top to bottom):
1. **Invoice card** — business logo/initials + name + invoice number + status badge at top right. Below: amount hero, due date, line items table, total row.
2. **Payment details card** — Bank, Account name, Account number, Reference (all as label/value rows)

Actions (bottom, below cards):
1. Primary: "Download PDF" (full-width primary button)
2. Secondary row: "Share via WhatsApp" (WhatsApp green icon) | "Telegram" (Telegram blue icon) | "Send email" (mail icon) — these three as equal-width outlined buttons

**Quotes (Phase 6.5):** When `document_type` is `'quote'`: header label
shows "QUOTATION", payment details card is hidden, status actions show
"Mark as accepted" / "Mark as declined" instead of "Mark as paid", and a
"Convert to invoice" button is shown (hidden if status is `declined` or
`cancelled`).

### Mobile Invoice Creation

Full-screen form, clean white background. Top bar with back arrow + "New invoice" title.

Fields in order:
1. Client selector (search/select existing or type new)
2. Line items section — each row: description | qty | price | delete icon. "+ Add line item" ghost button below.
3. Subtotal + Total (right-aligned, below items)
4. Currency selector + Due date (2-column row)
5. Notes (optional, collapsible)
6. "Send invoice" — full-width primary button (sticky at bottom on mobile)

### Invoice/Quote Toggle (Creation Form)

A pill-shaped two-option toggle displayed at the top of the invoice
creation form, below the breadcrumb.

```
Container: border 0.5px solid rgba(0,0,0,0.12), border-radius 9999px,
  background #F0F2F5, display inline-flex, padding 3px. Width: content.

Active option: background #185FA5, color #FFFFFF, border-radius 9999px,
  padding 6px 20px, font 13px/500, transition background 150ms ease.

Inactive option: background transparent, color #6B7280,
  padding 6px 20px, font 13px/400, cursor pointer.
```

Options: "Invoice" (default active) | "Quote"

Conditional behaviour when Quote is active:
- Form title: "New Quote"
- Number preview prefix: `QT-`
- Due date label: "Valid until" (not required)
- Submit button: "Save quote"
- Preview panel header: "QUOTATION"

### Desktop Invoice Creation (Split Panel)

Three-column layout:
```
[Sidebar 220px] [Form panel 340px] [Preview panel — flex 1]
```

Form panel:
- White background
- Breadcrumb: "Invoices > New"
- Same fields as mobile form, more compact (40px inputs)
- Border-right: 0.5px

Preview panel:
- Background: `#F0F2F5`
- Tab toggle at top: "Invoice PDF" | "Email preview"
- White card showing live-updating invoice layout
- Payment details shown as a `#F0F2F5` inset block at the bottom of the invoice card

### Desktop Dashboard

Layout:
```
[Sidebar 220px] [Main content — flex 1]
```

Main content top bar: page title left + "New invoice" primary button right.

Content:
1. 3-col metric card row: Total collected (month) / Invoices sent / Awaiting payment
2. 7-day chart card (full width)
3. Recent invoices table: # | Client | Amount | Status | Date | Actions

### Public Invoice View (Shareable Link)

Unauthenticated, minimal chrome. No sidebar.

Layout: centred single column, max-width 560px, white card on `#F0F2F5` background.

Card contents:
- Business logo + name (top)
- Invoice number + status badge
- Amount + due date
- Line items
- Total
- Payment details section
- Download PDF / Share buttons

Footer: "Powered by PayRush" (soft, unobtrusive)

**Quotes (Phase 6.5):** When `document_type` is `'quote'`: document label
shows "Quotation", payment details section is hidden, a validity note
appears at the bottom: "This quotation is valid for 30 days from the
issue date.", and the download button reads "Download quotation".

---

## Interaction Patterns

### Loading States

- **Skeleton screens** — not spinners. Match the shape of the content being loaded.
- Skeleton colour: `#F0F2F5` animated with a subtle pulse (CSS animation, no JS library).
- Never show a blank screen — always show skeleton on first load.

### Empty States

Follow ANZ Plus pattern: centred illustration (simple, not cartoonish) + headline + sub-text + CTA.

Example (no invoices):
```
[Simple invoice icon, 48px, color #B5D4F4]
"No invoices yet"
"Create your first invoice and get paid faster."
[New invoice — primary button]
```

### Toast Notifications

- Position: bottom-centre on mobile, top-right on desktop
- Duration: 3 seconds (success), 5 seconds (error, stays until dismissed)
- Success: green left border, white background
- Error: red left border, white background
- No stacking — replace previous if new one fires

### Form Validation

- Validate on blur (not on change — too aggressive)
- Show error message inline below the field
- On submit, scroll to first error and focus it
- Never disable the submit button — validate on submit instead

---

## Iconography

Library: **Tabler Icons** (outline only, `@tabler/icons-react`)

Key icons used in PayRush:

| Action | Icon |
|--------|------|
| New invoice | `IconPlus` |
| Send / share | `IconSend`, `IconShare` |
| WhatsApp | `IconBrandWhatsapp` |
| Telegram | `IconBrandTelegram` |
| Email | `IconMail` |
| Download PDF | `IconDownload` |
| Edit | `IconPencil` |
| Delete | `IconTrash` |
| Client | `IconUser`, `IconUsers` |
| Invoice | `IconFileInvoice` |
| Paid | `IconCircleCheck` |
| Home | `IconHome` |
| Settings | `IconSettings` |
| Analytics | `IconChartBar` |
| Back | `IconArrowLeft` |
| More options | `IconDotsVertical` |

Icon sizes: 16px inline/nav, 20px standalone actions, 24px empty states.

---

## Responsive Breakpoints

| Name | Min width | Layout |
|------|-----------|--------|
| Mobile | 0px | Single column, bottom nav |
| Tablet | 768px | Two-column where appropriate, still no sidebar |
| Desktop | 1024px | Full sidebar + split panels |

Mobile is the primary build target. Desktop is an enhancement layer.

---

## Accessibility

- All interactive elements must have visible focus states
- Touch targets minimum 44×44px on mobile
- Colour contrast: all text must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Icon-only buttons must have `aria-label`
- Images must have `alt` text
- Forms must have associated labels (not just placeholders)
- Status badges must not rely on colour alone — include text label

---

## Animation

Keep it minimal. No decorative animations.

Permitted:
- Skeleton pulse: `opacity 1s ease-in-out infinite alternate`
- Button active: `transform: scale(0.98)`, transition 100ms
- Toast slide-in: `translateY(8px) → translateY(0)`, 150ms ease-out
- Modal/sheet enter: `translateY(20px) → translateY(0)`, 200ms ease-out

Not permitted: spinning loaders, bounce effects, parallax, hover lift effects on cards.

---

## PDF Invoice Spec

The generated PDF should match the preview panel exactly.

Layout:
- Page size: A4
- Margins: 40px all sides
- Font: Inter (embedded via jsPDF)

Sections (top to bottom):
1. Header row: business logo left + invoice number/date right
2. "Billed to" block: client name + address
3. Line items table: Description | Qty | Unit price | Amount (right-aligned headers)
4. Total block (right-aligned): Subtotal, Total in bold
5. Payment details box: light grey background, bank/mobile money details
6. Footer: "Thank you for your business." + business website

Colour accent in PDF: user's primary colour from branding settings (default `#185FA5`). Used on table header row background and total row label.

**Quotes (Phase 6.5):** When `document_type` is `'quote'`: PDF header reads
"QUOTATION" (template-specific: e.g. "MODERN QUOTATION", "CLASSIC
QUOTATION" etc.), payment details block is omitted, and a validity note
is added after the totals section.

---

*Last updated: June 2026*
