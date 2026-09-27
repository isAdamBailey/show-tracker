---
name: Live Music Tracker
description: Fast-lookup tool for upcoming shows and setlist history — built for music fans, not a ticketing company.
colors:
  canvas: "#15120f"
  surface: "#1e1a15"
  surface-hi: "#2a241d"
  line: "#2c261f"
  line-strong: "#3b342b"
  skeleton: "#26211b"
  skeleton-soft: "#221d18"
  ink: "#f4efe7"
  ink-2: "#d2c9ba"
  ink-3: "#b8ad9d"
  muted: "#9b907f"
  placeholder: "#8a8072"
  faint: "#6f665a"
  accent: "#ff7b2e"
  accent-hover: "#ff9150"
  accent-text: "#ff8a4c"
  accent-soft: "rgba(255, 123, 46, 0.16)"
  accent-soft-ink: "#ff9a62"
  on-accent: "#140d07"
  error-line: "#5a2620"
  warn-bg: "#211a13"
  warn-line: "#3b2c1e"
  warn-ink: "#e8d6c2"
typography:
  display-xl:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: "-0.015em"
  display:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
  headliner:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1
  set-header:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1
  body-lg:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  tag: "4px"
  seg: "6px"
  lg: "8px"
  full: "999px"
spacing:
  gutter-mobile: "18px"
  gutter-desktop: "40px"
  row-desktop: "18px 16px"
  row-mobile: "14px 18px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-inverse:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
  popover:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "8px 0"
---

# Design System: Live Music Tracker

## 1. Overview

**Creative North Star: "The Venue Board"**

The design system draws from the information environment of a real show: the whiteboard setlist backstage, the typed door list, the stack of tickets at the box office. Nothing decorative. Everything present because it has a job. The hierarchy is clear because the environment demands it — the name of the band, the date, the venue, the doors time. Information that earns its place.

The Venue Board redesign (September 2026) replaced the cold slate + sky/amber palette with warm near-blacks and a single electric orange. The home feed is a date-led schedule, not a card grid; every row is one click target.

Density is deliberate. Music fans scan for specifics: dates, venues, names. The system uses tight spacing and small type where it works, opening up only where the hierarchy demands breathing room. A list of upcoming shows is not a gallery — it's a schedule.

**Key Characteristics:**
- Information-first: no decoration that doesn't carry meaning
- Tactile and immediate: elements respond crisply; interactions feel direct
- Fan-built, not corporate: language and layout feel like they were made by someone who goes to shows
- Earned darkness: warm, brown-black surfaces reference the venue, not a SaaS aesthetic
- WCAG AA contrast at minimum for all text

## 2. Colors

A warm near-black base with one electric orange accent. Every color is a Tailwind token in `tailwind.config.ts` (`bg-canvas`, `text-ink-2`, `border-line-strong`, `bg-accent-soft`, …). Never use raw hex or Tailwind's default slate/amber/sky palettes in components.

### Surfaces and lines
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#15120f` | Page background. The house with the lights down. |
| `surface` | `#1e1a15` | Inputs, row hover, popovers, segmented-control track. |
| `surface-hi` | `#2a241d` | Hover and keyboard highlight inside popovers. |
| `line` | `#2c261f` | Row dividers and section borders. |
| `line-strong` | `#3b342b` | Input, chip and tag borders — signals affordance. |
| `skeleton` / `skeleton-soft` | `#26211b` / `#221d18` | Loading blocks (primary / secondary). `skeleton-soft` is also the mobile search row divider. |

### Text
| Token | Hex | Use |
|---|---|---|
| `ink` | `#f4efe7` | Primary text; also the active tab background. |
| `ink-2` | `#d2c9ba` | Support acts, secondary text, inactive tabs and chips. |
| `ink-3` | `#b8ad9d` | Helper copy, genre tag text, back links. |
| `muted` | `#9b907f` | Metadata and labels: dates above day numbers, doors time, column headers. |
| `placeholder` | `#8a8072` | Input placeholder only. |
| `faint` | `#6f665a` | Song numbers only. Too low-contrast for anything a user must read. |

### Accent
| Token | Hex | Use |
|---|---|---|
| `accent` | `#ff7b2e` | Primary CTA fill, active genre chip, city underline, focus outline/border. |
| `accent-hover` | `#ff9150` | CTA and accent-link hover. |
| `accent-text` | `#ff8a4c` | Accent-colored text on canvas: links, "Setlists →", "Hide songs", Encore headers, the city name. |
| `accent-soft` + `accent-soft-ink` | `rgba(255,123,46,.16)` + `#ff9a62` | "Tonight" / "Tomorrow" urgency badge. |
| `on-accent` | `#140d07` | Text on an `accent` fill. |

### States
| Token | Hex | Use |
|---|---|---|
| `error-line` | `#5a2620` | Border of the "Couldn't load shows" box. |
| `warn-bg` / `warn-line` / `warn-ink` | `#211a13` / `#3b2c1e` / `#e8d6c2` | Partial-failure strip ("SeatGeek didn't respond…"). |

### Named Rules
**The One Accent Rule.** Orange is the only accent. It marks what you can act on or where you are (CTA, active chip, city picker, focus). No second accent color, no blue anywhere, no gradients.

**The One Filled Button Rule.** Each screen has at most one `accent`-filled button: the ticket CTA on the show page, "See this month" in the empty state. Secondary actions are outlined (`border-line-strong`) or inverse (`bg-ink text-canvas`, used for "Try again").

**Accent text vs. accent fill.** Use `accent-text` (not `accent`) for orange text on `canvas`; it's tuned for legibility at small sizes.

## 3. Typography

**Display / Heading Font:** Barlow Condensed (500/600/700, Google Fonts)
**Body / UI Font:** Space Grotesk (400/500/600, Google Fonts)

Use tabular numbers (`.tabular` or a `<time>` element) for every date, time, price and count.

### Scale
Tailwind `fontSize` steps in `tailwind.config.ts` (`text-13`, `text-15`, `text-30`, …). Body steps 12/14/16 are Tailwind's `text-xs`/`text-sm`/`text-base`.

- **Condensed:** 72 (show-page headliner, desktop) / 64 (home and artist h1, desktop) / 52 (headliners on mobile) / 40 (section h2 "Setlist history", day numbers) / 34 (state titles) / 30 (feed headliner, wordmark) / 24 (mobile headliner) / 22 ("More tour dates") / 20 (set headers).
- **Body:** 16 (support line on show page) / 15 (venue names, search input, songs) / 14 (support acts, helper copy, chips) / 13 (metadata, song numbers, notes) / 12 (column headers, badges, tags).

### Named Rules
**The Two-Family Rule.** Barlow Condensed is for headings, headliner names, day numbers and set headers. Space Grotesk carries everything else — buttons, inputs, labels, metadata.

**The No-Uppercase Rule.** No uppercase tracking as a kicker. Hierarchy comes from the weight and size of condensed type.

## 4. Elevation

Flat by default. Depth comes from the step between `canvas` → `surface` → `surface-hi`, not shadow.

### Shadow Vocabulary
- **Popover** (`shadow-popover`: `0 18px 40px rgba(0,0,0,.55)`): search suggestions and the city picker only.

### Named Rules
**The Flat-by-Default Rule.** Rows, lists and panels never get a shadow. Only floating popovers do.

**Stacking.** `v-motion` leaves a `transform` on the header and page wrappers, so each is its own stacking context. The header carries `relative z-20` so its popovers sit above page content, and anything `position: fixed` inside a page (mobile ticket CTA, full-screen mobile search) is teleported to `#teleports`.

## 5. Components

### Header
One row: wordmark (condensed 30px) + search box (`h-11`, `max-w-[620px]`, `bg-surface`, `border-line-strong`, focus-within `border-accent`), `border-b border-line`. Mobile stacks them. No tagline, no gradient.

### Search suggestions
Popover under the box: a "Searching every city · Ticketmaster + SeatGeek" line, then Artists / Genres (/ Venues once `/venue/[id]` exists), up to 3 each. Name in `ink` 15px, meta right-aligned in `muted` 13px. Highlight is `bg-surface-hi`. ↑/↓/Enter/Esc; `/` focuses. Mobile opens full screen with Cancel; rows ≥ 48px with `skeleton-soft` dividers.

### Feed row
One `NuxtLink` per show. Desktop grid `88px | 1fr | 240px | 120px | 96px` (Date / Lineup / Venue / Time / Tickets), `py-[18px] px-4`, `border-t border-line`, hover `bg-surface`. The date shows only on a day's first row. Mobile grid `48px | 1fr`, price beside the headliner, one muted meta line.

### Segmented control (date tabs)
Track `bg-surface border-line rounded-lg p-1`; active `bg-ink text-canvas font-semibold rounded-seg`; inactive `text-ink-2`. Counts at 13px.

### Chips
`rounded-full px-3.5 py-1.5 text-sm`. Active: `bg-accent border-accent text-on-accent font-semibold`. Inactive: `border-line-strong text-ink-2`, hover `border-muted`. Wrap on desktop, one scrolling line on mobile.

### Tags and badges
Genre tag: `rounded-tag border-line-strong text-xs text-ink-3`. Urgency badge: `rounded-tag bg-accent-soft text-accent-soft-ink text-xs font-semibold` — "Tonight" and "Tomorrow" only.

### Setlist accordion
The signature component. Each row is a `<button>` (grid `120px | 1fr | auto`): date, venue · city with tour below, "{n} songs" / "Hide songs". One open at a time; the most recent setlist that has songs opens by default. Body is indented to the venue column; each set has a condensed 20px header followed by a `line` rule ("Encore" headers in `accent-text`). Songs are numbered continuously across sets in `faint`; notes (cover of X, info, tape) are inline in `muted` 13px; tape entries are unnumbered and don't count.

### States
Keep headings and tabs in place; only the list area changes. Loading: 5 skeleton rows matching the row grid (`motion-safe:animate-pulse`). Empty: condensed 34px title, `ink-3` helper, actions only for things actually checked. Error: `border-error-line` box with an inverse "Try again". Partial: `warn-*` strip above the list with an accent "Retry".

## 6. Do's and Don'ts

### Do:
- **Do** use the Tailwind tokens (`canvas`, `ink-2`, `accent-text`, …) for every color.
- **Do** keep text at WCAG AA. Measured on `canvas` / `surface`: `ink` 16.3 / 15.1, `ink-2` 11.4 / 10.6, `ink-3` 8.4 / 7.8, `muted` 5.9 / 5.5, `accent-text` 8.0 / 7.4, `on-accent` on `accent` 7.5. Two handoff values fall short: `placeholder` on `surface` is 4.46:1 (marginally under 4.5, so never use it for real content), and `faint` is 3.3:1, acceptable only for the redundant song numbers.
- **Do** use tabular numbers for dates, times, prices and counts.
- **Do** make a whole row the click target instead of adding a per-row button.
- **Do** guard every animation for `prefers-reduced-motion` (`motion-safe:` for Tailwind, `.motion-guard` for `v-motion`).
- **Do** say plainly when data is partial or missing ("Price not listed", "SeatGeek didn't respond…") instead of hiding it.

### Don't:
- **Don't** use Tailwind's default slate, zinc, amber or sky palettes. That was the old system.
- **Don't** add a second accent color or gradients, including gradient text.
- **Don't** add a colored `border-left` stripe to rows or callouts.
- **Don't** use uppercase tracking as a section kicker.
- **Don't** build card grids for lists of shows; it's a schedule.
- **Don't** replicate Ticketmaster/StubHub's competing CTAs. One filled button per screen.
- **Don't** import Spotify's algorithmic language ("You might also like", "Recommended for you").
- **Don't** add shadows to anything that isn't a popover.
