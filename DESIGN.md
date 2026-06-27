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
  spotlight: "#f59e0b"
  spotlight-bright: "#fbbf24"
  spotlight-hover: "#fcd34d"
  amber-depth: "#451a03"
typography:
  display:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
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
    backgroundColor: "{colors.spotlight}"
    textColor: "#09090b"
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
- **Spotlight** (`#f59e0b` / amber-500): The accent. Used for CTA buttons, links, focus rings, and hover states. Amber reads as concert spotlight — intentional and warm, the opposite of corporate sky-blue. Text on Spotlight buttons uses near-black (`#09090b`) for ~9.4:1 contrast.
- **Spotlight Bright** (`#fbbf24` / amber-400): Hover state for links and button hover target.
- **Spotlight Hover** (`#fcd34d` / amber-300): Hover text state for links (`hover:text-amber-300`).

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
**The One Accent Rule.** Spotlight amber (`#f59e0b`) is the only accent in normal flow. It appears on CTA buttons, links, and focus rings. No blue accents anywhere. No gradient on the CTA — flat amber, dark text, full stop.

**The Anti-Slate Rule.** The cold slate neutral palette is acceptable as infrastructure, but the amber accent is what gives it character. Don't reintroduce blue accents. Don't add a second accent color without strategic reason.

## 3. Typography

**Display / Heading Font:** Barlow Condensed (wght 500–700, Google Fonts)
**Body / UI Font:** Space Grotesk (wght 400–600, Google Fonts)

**Character:** A condensed grotesque paired with a quirky geometric sans on the proportion axis — narrow, muscular headings against a wider, more human-feeling body. Barlow Condensed references concert posters and venue boards directly; Space Grotesk has enough personality (distinctive R, ink traps, subtle geometric quirks) to push back against the corporate system-ui void, while remaining clean enough for UI labels and card metadata.

### Hierarchy
- **Display** (Barlow Condensed bold 700, 1.875rem md:3rem, leading-none, -0.025em): Page h1s — artist name, genre name, "Local Upcoming Music", app name. Maximum one per page.
- **Headline** (Barlow Condensed semibold 600, 1.25rem, leading-tight): Section h2s — "Upcoming Events", "Show Info", "Historical Setlists", "Upcoming Tour Dates".
- **Title** (Space Grotesk semibold 600, 1rem): Card h3 — event/show names in the discovery feed.
- **Body** (Space Grotesk regular 400, 0.875rem, 1.5 leading): Card dates, descriptions. Slightly more leading than system-ui compensates for perceived weight loss on dark backgrounds.
- **Label** (Space Grotesk regular 400, 0.75rem): Venue, city, country metadata. Smallest size in the system.

### Named Rules
**The Two-Family Rule.** Barlow Condensed is for headings (h1, h2) only — never on buttons, inputs, card body text, or UI labels. Space Grotesk carries everything else. The contrast axis is proportion (condensed vs. normal), not style.

**The No-Uppercase Rule.** Avoid uppercase tracking as a section kicker. The venue board uses the weight of condensed type to create hierarchy, not all-caps decoration.

## 4. Elevation

This system is flat-first. Cards use transparent backgrounds (`bg-slate-900/60`) rather than opaque blocks with shadow, creating depth through opacity layering rather than physical shadow. Shadows are reserved for interactive surfaces that need affordance.

### Shadow Vocabulary
- **Form Container** (`shadow-lg shadow-zinc-950/60`): Applied to the search form. Separates it from the header gradient without hard edges.

### Named Rules
**The Flat-by-Default Rule.** Card surfaces are flat. Shadows appear only on elements that require perceived lift: the primary CTA button, the global search form. Do not add shadow to content cards — that escalates decoration over signal.

## 5. Components

### Buttons
- **Primary CTA:** Rounded corners (8px), flat `bg-amber-500` with `hover:bg-amber-400`. Dark (`zinc-950`) text for ~9.4:1 contrast. Full-width on cards, inline-flex centered. No shadow — the amber color provides sufficient affordance.
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
- **Don't** reintroduce sky-blue or corporate blue as an accent. The accent is amber (`#f59e0b`). One voice.
- **Don't** use `background-clip: text` with gradient backgrounds on any text element. Gradient text is decorative and never meaningful.
- **Don't** add `border-left` greater than 1px as a colored accent stripe on cards or callouts. Use background tints, icons, or full borders instead.
- **Don't** use uppercase tracking (e.g., `tracking-[0.18em] uppercase`) as a section kicker. The "Discover Live Music" label in the current header is an exception to clean up, not a pattern to repeat.
- **Don't** build identical card grids with only icon + heading + body. Vary density, hierarchy, and structure to match the content's actual shape.
- **Don't** replicate the Ticketmaster / StubHub pattern of competing CTAs and aggressive calls to action. One primary action per card, always.
- **Don't** import Spotify's algorithmic discovery language — "You might also like", "Recommended for you", "Based on your listening". This is a fan tool, not an algorithm.
- **Don't** add shadows to content cards. The Flat-by-Default Rule is not a suggestion.
- **Don't** let placeholder text fall below 4.5:1 contrast. `text-slate-500` on `slate-950` is marginal — verify with any palette change.
