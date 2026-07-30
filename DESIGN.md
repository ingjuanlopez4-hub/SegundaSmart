---
name: SegundaSmart
description: Registro operativo de piezas únicas para inventario, catálogo y venta.
colors:
  archive-blue: "#1646a0"
  archive-blue-dark: "#0d327a"
  archive-blue-soft: "#dce8ff"
  cold-paper: "#f4f7fb"
  white-sheet: "#ffffff"
  graphite: "#171b24"
  muted-slate: "#596476"
  ledger-line: "#cbd5e3"
  intake-coral: "#ff6b4a"
  intake-coral-dark: "#b9321f"
  sold-plum: "#6c3b64"
  danger-red: "#a52620"
  success-green: "#176447"
typography:
  display:
    fontFamily: "Archivo Black, Arial Black, sans-serif"
    fontSize: "clamp(2.6rem, 8vw, 5.5rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo Black, Arial Black, sans-serif"
    fontSize: "clamp(1.65rem, 4vw, 2.7rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Chivo, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Azeret Mono, monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: "0.075em"
rounded:
  field: "0.3rem"
  control: "0.35rem"
spacing:
  field-gap: "0.4rem"
  compact: "0.75rem"
  control-x: "1rem"
  section: "1.25rem"
  roomy: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.archive-blue}"
    textColor: "{colors.white-sheet}"
    rounded: "{rounded.control}"
    padding: "0.72rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.archive-blue-dark}"
    textColor: "{colors.white-sheet}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.archive-blue}"
    rounded: "{rounded.control}"
    padding: "0.72rem 1rem"
  field:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.field}"
    padding: "0.75rem 0.85rem"
  status-available:
    backgroundColor: "{colors.archive-blue-soft}"
    textColor: "{colors.archive-blue-dark}"
    typography: "{typography.label}"
    padding: "0.18rem 0.42rem"
  intake-action:
    backgroundColor: "{colors.intake-coral}"
    textColor: "{colors.graphite}"
    padding: "1.4rem"
---

# Design System: SegundaSmart

## Overview

**Creative North Star: "Registro de procedencia"**

SegundaSmart treats every product as an irrepeatable accession record. Archive blue, cold paper, graphite, and coral turn inventory work into a clear intake desk: numbered cataloging bands establish order, monospace metadata identifies records, and compact status stamps make availability unequivocal.

The system is operational rather than dashboard-like. The owner first sees the question that matters, a dominant path to register the next piece, and a restrained accounting strip; surrounding navigation keeps the business and public catalog in context. Generic SaaS card dashboards are explicitly rejected in favor of bordered records, ledgers, and intake tables.

**Key Characteristics:**
- Archive-like, high-contrast working surfaces.
- One dominant coral intake action against an archive-blue field.
- Accession IDs, accounting figures, and labels set in monospace.
- Square record structures with only gently rounded controls.
- Mobile-first continuity from bottom navigation to desktop rail.

## Colors

The palette separates the archive, its cold paper records, and the coral moment of intake; semantic colors remain restrained and textual.

### Primary
- **Archive Blue:** Owns the rail, intake bands, hero field, primary controls, and active state.
- **Archive Blue Dark:** Deepens hover states and supplies legible text on pale-blue stamps.
- **Archive Blue Soft:** Marks quiet selected, empty, image-placeholder, and available-status surfaces.

### Secondary
- **Intake Coral:** Reserved for adding a piece, the brand index, and entry labels that must interrupt the archive field.
- **Intake Coral Dark:** Supplies the global visible-focus outline rather than decorative fill.

### Tertiary
- **Sold Plum:** Identifies sold records without competing with the intake action.
- **Danger Red:** Marks destructive or failed states.
- **Success Green:** Marks successful completion in notices.

### Neutral
- **Cold Paper:** The application canvas and sticky translucent action backdrop.
- **White Sheet:** Record, form, navigation, and catalog surfaces.
- **Graphite:** Primary text and the ink used on coral.
- **Muted Slate:** Supporting copy, business context, and record IDs.
- **Ledger Line:** Divides accounting cells, cards, fields, and navigation.

### Named Rules

**The Coral Intake Rule.** Coral signals entry into the archive; do not distribute it across routine metrics or secondary actions.

**The Status Is Written Rule.** Availability and sale state always include a text stamp; color never carries status alone.

## Typography

**Display Font:** Archivo Black (with Arial Black fallback)
**Body Font:** Chivo (with Arial fallback)
**Label/Mono Font:** Azeret Mono (with monospace fallback)

**Character:** Archivo Black gives operational questions and section names the authority of archive headings. Chivo remains plainspoken and readable, while Azeret Mono makes IDs, prices, counts, and labels feel recorded rather than decorated.

### Hierarchy
- **Display** (400, fluid from 2.6rem to 5.5rem, 0.98): Page questions and names; the dashboard question may expand to 6rem.
- **Headline** (400, fluid from 1.65rem to 2.7rem, 0.98): Section and empty-state headings.
- **Title** (400, 1.15rem, 1.1): Product names inside compact records.
- **Body** (400, 1rem, 1.55): Instructions and descriptions, generally constrained to about 60-62 characters.
- **Label** (700, 0.72rem, 0.075em, uppercase): Kickers, record metadata, ledger captions, navigation markers, and intake annotations.

### Named Rules

**The Recorded Data Rule.** Use Azeret Mono for accession data and accounting signals, not for prose or primary actions.

## Layout

The system is mobile first. Content uses a centered 1160px maximum with 1rem side gutters on narrow screens and 1.5rem gutters in the desktop app. Pages stack at a 1.25rem rhythm and reserve 6.5rem at the bottom for fixed navigation.

Below 560px, product records pair a 112-118px image column with a flexible record body and let actions span the full width. At 560px, records become a two-column grid, forms become two-column tables, and paired actions share a row. At 800px, the bottom navigation and sticky header give way to a 238px archive rail; cataloging sections become a 220px intake band beside their fields, and form actions remain sticky near the viewport edge. At 1120px, the rail grows to 270px, products use three columns, and ledgers use four cells.

The dashboard first viewport is one continuous workbench: operational question and context on archive blue, dominant intake action on coral, then a directly attached accounting strip. It is not a collection of independent metric cards.

## Elevation & Depth

The application is flat by default. Borders and tonal fields establish structure; the only ambient elevation is the authentication sheet, while the mobile bottom navigation uses a shallow upward shadow to separate a fixed control from scrolling content. Sticky headers and actions use a nearly opaque cold-paper surface rather than stronger elevation.

### Shadow Vocabulary
- **Authentication Sheet:** A broad, cool ambient shadow gives the sign-in sheet temporary document depth.
- **Mobile Navigation Lift:** A low-opacity upward shadow separates the fixed bottom bar from inventory records.

### Named Rules

**The Flat Archive Rule.** Records, ledgers, panels, and form sections remain flat and bordered at rest; do not turn them into floating cards.

## Shapes

Records, ledger cells, intake heroes, side rails, and cataloging tables are square. Fields and buttons use only gently curved corners, while status stamps remain rectangular. The signature exceptions are clipped coral entry shapes: the `SS` brand index has a pointed right edge, and the mobile add tab has a centered notch that rises above the navigation line.

Dashed borders are reserved for the photograph intake target. Solid one-pixel lines organize all other sheets and records.

## Components

### Buttons
- **Shape:** Compact, gently curved controls with a 46px minimum touch height.
- **Primary:** Archive-blue fill, white text, archive-blue border, bold Chivo, and compact horizontal padding.
- **Hover / Focus:** Hover deepens to dark archive blue; active moves down 1px; keyboard focus uses a 3px dark-coral outline offset by 3px.
- **Secondary:** Transparent sheet with archive-blue text and border; hover fills with soft archive blue.
- **Danger / Disabled:** Danger uses the semantic red fill. Disabled controls reduce opacity and show a waiting cursor while their label changes to the pending action.

### Chips
- **Style:** Status stamps use pale archive blue with dark-blue uppercase mono text; sold stamps shift to a pale plum field and plum text.
- **State:** Copy is always explicit: `Disponible` or `Vendida`.

### Cards / Containers
- **Corner Style:** Square accession records.
- **Background:** White sheets on cold paper; image wells use soft archive blue.
- **Shadow Strategy:** None at rest; separation comes from the ledger line.
- **Border:** One-pixel ledger line around each record.
- **Internal Padding:** 1rem in record bodies and panels.
- **Behavior:** Mobile records are horizontal; wider records stack a 4:3 image over metadata. Private records add QR and sale actions, and sold records omit the sale action.

### Inputs / Fields
- **Style:** White field, 50px minimum height, muted blue-gray stroke, and a gentle field radius. Textareas begin at 150px and resize vertically.
- **Focus:** Archive-blue border plus a 3px soft-blue halo; the invisible photo input exposes a dark-coral outer focus outline through its container.
- **Error / Disabled:** Errors and successes appear as bordered tinted notices with `alert` or `status` semantics. Pending controls remain disabled and state what is happening.

### Navigation

Mobile navigation is a four-column fixed bottom bar with 54px targets and a 66px coral add tab. Current links use archive blue. At 800px it becomes a full-height archive-blue rail: two-letter mono markers precede labels, the active row becomes a white sheet, and the coral add row remains visually dominant. Business identity and catalog/logout actions stay visible in both modes.

### Intake Table

The product form behaves like museum cataloging rather than a generic settings form. Three bordered fieldsets are numbered `1-3`; each archive-blue legend names the record stage and explains it. On desktop the legend becomes a fixed-width vertical band, while on mobile it becomes a horizontal header. Photograph and identity come first, value second, and public description third. Suggestion output remains editable, reports whether it came from AI or the local fallback, and never blocks manual completion.

### Accounting Strip

The ledger is a single bordered strip subdivided by one-pixel rules. Uppercase mono captions sit above large mono values; two columns are used on smaller screens and four on wide screens. It reports business state without becoming a dashboard of raised metric cards.

## Do's and Don'ts

### Do:
- **Do** treat each product as one accession record with photograph, written status, price, and `PZ-` identifier.
- **Do** keep the operational question, dominant intake action, and accounting strip together in the first dashboard viewport.
- **Do** preserve mobile task context through the fixed bottom navigation and the desktop archive rail.
- **Do** use numbered archive-blue bands to sequence multi-part cataloging forms.
- **Do** keep suggestions editable and expose loading, error, empty, and success states in direct Spanish.

### Don't:
- **Don't** replace records and ledgers with generic rounded SaaS cards or isolated metric tiles.
- **Don't** use coral as a general-purpose accent; it belongs to intake and visible focus.
- **Don't** communicate availability, sale, error, or success through color alone.
- **Don't** add elevation to routine records, form sections, or accounting cells.
- **Don't** hide the business name, public catalog path, or primary add action when navigation changes across breakpoints.
