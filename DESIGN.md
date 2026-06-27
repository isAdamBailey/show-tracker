---
name: Live Music Tracker
description: Fast-lookup tool for upcoming shows and setlist history — built for music fans, not a ticketing company.
colors:
  stage-blackout: "#020617"
  backstage-shadow: "#0f172a"
  equipment-case: "#1e293b"
  amp-grill: "#334155"
  stage-fog: "#64748b"
  monitor-mix: "#94a3b8"
  crowd-glow: "#cbd5e1"
  house-lights: "#f1f5f9"
  pa-blue: "#38bdf8"
  pa-blue-dim: "#0284c7"
  deep-signal: "#082f49"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.pa-blue-dim}"
    textColor: "{colors.house-lights}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-disabled:
    backgroundColor: "{colors.equipment-case}"
    textColor: "{colors.stage-fog}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.backstage-shadow}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.stage-blackout}"
    textColor: "{colors.house-lights}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
---

# Design System: Live Music Tracker

## 1. Overview

**Creative North Star: "The Venue Board"**

The design system draws from the information environment of a real show: the whiteboard setlist backstage, the typed door list, the stack of tickets at the box office. Nothing decorative. Everything present because it has a job. The hierarchy is clear because the environment demands it — the name of the band, the date, the venue, the doors time. Information that earns its place.

The system is a work in progress toward this north star. The current palette (cold slate + sky-blue) reflects the dominant SaaS dark-mode convention and is itself an anti-reference: design sessions should push the palette toward something with more earned character — warmer near-blacks, an accent that reads electric rather than corporate. The north star is not the current state; it's the target.

Density is deliberate. Music fans scan for specifics: dates, venues, names. The system uses tight spacing and small type where it works, opening up only where the hierarchy demands breathing room. A list of upcoming shows is not a gallery — it's a schedule.

**Key Characteristics:**
- Information-first: no decoration that doesn't carry meaning
- Tactile and immediate: elements respond crisply; interactions feel direct
- Fan-built, not corporate: language and layout feel like they were made by someone who goes to shows
- Earned darkness: the dark theme references the venue environment, not a SaaS aesthetic
- WCAG AA contrast at minimum for all text

## 2. Colors

A near-black base with a single electric accent. The palette aims for the inside of a venue: dark surfaces, pools of light where information lives.

### Primary
- **PA Blue** (`#38bdf8`): The accent. Used for links, focus rings, and interactive state indicators. Currently sky-400 — functional but too close to the generic SaaS blue accent. Future direction: something more electric, less enterprise (deep amber, warm white, or a more saturated/shifted blue-green).

### Neutral
- **Stage Blackout** (`#020617`): The body background. Deep near-black, cold undertone. The stage in darkness.
- **Backstage Shadow** (`#0f172a`): Card surfaces and form containers. One step up from the base.
- **Equipment Case** (`#1e293b`): Borders on cards and containers. Structural, not decorative.
- **Amp Grill** (`#334155`): Interactive borders (inputs, selects). Indicates affordance.
- **Stage Fog** (`#64748b`): Disabled state text and placeholder text.
- **Monitor Mix** (`#94a3b8`): Muted secondary metadata — venue names, timestamps, helper text.
- **Crowd Glow** (`#cbd5e1`): Secondary body text, readable against dark surfaces.
- **House Lights** (`#f1f5f9`): Primary text. The brightest neutral, used for headings and label text.

### Named Rules
**The One Accent Rule.** PA Blue (`#38bdf8`) is the only accent color in normal flow. It appears on links, focus rings, and the header gradient only. The gradient on the primary CTA button (`sky-600 → blue-600`) is a deviation from this rule and should be resolved to a flat accent on future improvement passes.

**The Anti-Slate Rule.** The cold slate palette is documented here as the current state, not the target state. Every design session should evaluate whether a given element can move toward more earned character. The dominant failure mode is "looks like every other dark-mode tool" — if it does, that element needs attention.

## 3. Typography

**Display / Body Font:** System sans-serif stack (system-ui, -apple-system, Segoe UI)
**Mono Font:** None currently in use

**Character:** The system uses a single sans-serif family across all scales, differentiated by size, weight, and tracking. This is a functional choice, not a typographic one — the north star for a future improvement would be a custom font pairing (a compressed or condensed sans for display, a slightly more characterful body). The current system is legible and neutral; it lacks the "venue-board" character the north star calls for.

### Hierarchy
- **Display** (semibold 600, 1.875rem, leading-tight, -0.025em): Page titles — artist name, "Local Upcoming Music". Maximum one per page.
- **Headline** (bold 700, 1.5rem, tight tracking): Used in the global header for the app name.
- **Title** (medium 500, 1.25rem): Section subheadings — "Upcoming Events", "Show Info", "Historical Setlists".
- **Body** (regular 400, 0.875rem, 1.5 leading): Main content text. Venue names, dates, descriptions. Keep to 65-75ch max for prose.
- **Label** (regular 400, 0.75rem): Metadata — time, city, country. The smallest readable size.

### Named Rules
**The No-Uppercase Rule.** Avoid uppercase tracking (e.g., `tracking-[0.18em]` in the header "Discover Live Music" kicker). The current header uses it; future passes should remove it. The venue board doesn't shout in caps-with-tracking.

## 4. Elevation

This system is flat-first. Cards use transparent backgrounds (`bg-slate-900/60`) rather than opaque blocks with shadow, creating depth through opacity layering rather than physical shadow. Shadows are reserved for interactive surfaces that need affordance.

### Shadow Vocabulary
- **CTA Glow** (`shadow-md shadow-sky-900/40`): Applied to the primary button. A soft ambient halo that gives the CTA a small lift.
- **Form Container** (`shadow-lg shadow-sky-950/30`): Applied to the search form. Separates it from the header gradient without hard edges.

### Named Rules
**The Flat-by-Default Rule.** Card surfaces are flat. Shadows appear only on elements that require perceived lift: the primary CTA button, the global search form. Do not add shadow to content cards — that escalates decoration over signal.

## 5. Components

### Buttons
- **Primary CTA:** Rounded corners (8px), gradient `sky-600 → blue-600` with `sky-500 → blue-500` on hover. White text. Full-width on cards, inline-flex centered. `shadow-md shadow-sky-900/40`. This gradient is a current-state pattern; future passes should resolve to a flat accent color for more character.
- **Disabled / Unavailable:** `border-slate-700 bg-slate-800 text-slate-500`. No hover treatment. Communicates absence, not action.
- **Retry button (error states):** `bg-red-700 hover:bg-red-600 text-white`. Smaller, `rounded-md`, `px-3 py-2`.

### Cards / Containers
- **Standard card:** `rounded-lg border border-slate-800 bg-slate-900/60`. Padding `p-4` (list items) or `p-5` (detail panels). Semi-transparent background creates layering depth without shadow.
- **Search form:** `rounded-xl border border-slate-700/80 bg-slate-900/70 shadow-lg shadow-sky-950/30`. Slightly larger radius than content cards. The single elevated surface in the header.
- **No nested cards.** Never put a card inside a card.

### Inputs / Fields
- **Style:** `rounded-lg border border-slate-600 bg-slate-950 text-slate-100`. The input sits flush with the darkest background — it recedes until focused.
- **Focus:** `focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20`. A 2-step treatment: the border shifts to accent blue, and a faint ring adds a glow without being aggressive.
- **Placeholder:** `placeholder:text-slate-500`. Must meet 4.5:1 contrast — slate-500 on slate-950 is borderline; check before any palette changes.
- **Select dropdown:** Same style as input. `bg-slate-950` to prevent system-default styling.

### Setlist Accordion
The signature component. A list of historical show entries that expand to reveal the set. Each entry: `rounded-lg border border-slate-800 bg-slate-900/60`. The toggle button is full-width with a left-aligned date/venue and a right-aligned "Show songs / Hide songs" label. No icon — text-only toggle is intentional (the venue board is text). Expanded content separated by `border-t border-slate-800`.

### Navigation / Links
- **In-app links:** `text-sky-400 hover:text-sky-300`. No underline by default. Color shift on hover is the only affordance.
- **Logo/home link:** `text-white group-hover:text-sky-300`. Headline-weight word mark, no icon.

## 6. Do's and Don'ts

### Do:
- **Do** keep the background at Stage Blackout (`#020617`) or darker. The venue is never beige.
- **Do** use text-slate-100 (`#f1f5f9`) for all headings and primary content text. Verify 4.5:1 contrast before any palette changes.
- **Do** use `rounded-lg` (8px) consistently on all cards and interactive elements. Consistency is the system.
- **Do** use `focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20` on every focusable input element. Keyboard navigation is not optional.
- **Do** keep card surfaces flat (`bg-slate-900/60`, no shadow). Elevation is reserved for the CTA and search form only.
- **Do** use `@media (prefers-reduced-motion: reduce)` for every animation. The page entrance fade (`opacity 0→1, y -10→0`) must have a reduced-motion fallback.
- **Do** favor type-driven hierarchy over icons and decorative elements. The information IS the design.

### Don't:
- **Don't** use the current slate-950 + sky-blue palette as a target. It is the anti-reference ("generic SaaS dark UI"). Use this DESIGN.md as a snapshot of current state, not an endorsement. Every palette improvement session should push away from the cold slate + sky-blue family.
- **Don't** use `background-clip: text` with gradient backgrounds on any text element. Gradient text is decorative and never meaningful.
- **Don't** add `border-left` greater than 1px as a colored accent stripe on cards or callouts. Use background tints, icons, or full borders instead.
- **Don't** use uppercase tracking (e.g., `tracking-[0.18em] uppercase`) as a section kicker. The "Discover Live Music" label in the current header is an exception to clean up, not a pattern to repeat.
- **Don't** build identical card grids with only icon + heading + body. Vary density, hierarchy, and structure to match the content's actual shape.
- **Don't** replicate the Ticketmaster / StubHub pattern of competing CTAs and aggressive calls to action. One primary action per card, always.
- **Don't** import Spotify's algorithmic discovery language — "You might also like", "Recommended for you", "Based on your listening". This is a fan tool, not an algorithm.
- **Don't** add shadows to content cards. The Flat-by-Default Rule is not a suggestion.
- **Don't** let placeholder text fall below 4.5:1 contrast. `text-slate-500` on `slate-950` is marginal — verify with any palette change.
