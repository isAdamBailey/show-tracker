---
target: app/pages/index.vue
total_score: 22
p0_count: 0
p1_count: 3
p2_count: 2
timestamp: 2026-06-27T00-38-26Z
slug: app-pages-index-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading state exists as text; no skeleton, no spinner |
| 2 | Match System / Real World | 2 | ISO dates ("2026-06-28 • 20:00:00") are technical, not fan language; wrong empty state copy |
| 3 | User Control and Freedom | 2 | No filter, no sort, no way to narrow the local feed |
| 4 | Consistency and Standards | 3 | Good amber/card consistency, but dual h1 breaks heading hierarchy |
| 5 | Error Prevention | 2 | Auto-loading page with empty state copy that tells users to do something that won't help |
| 6 | Recognition Rather Than Recall | 3 | Events visible and scannable; CTA label is clear enough |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no filtering, no fan-power features; one rigid path |
| 8 | Aesthetic and Minimalist Design | 2 | Identical card grid; "upcoming" redundancy across h1/h2; `text-slate-200` date vs `text-slate-100` title is imperceptibly subtle |
| 9 | Error Recovery | 3 | Retry button, plain-language error message; non-specific cause |
| 10 | Help and Documentation | 1 | No contextual help, no explanation of what setlist history is, no DMA context for new users |
| **Total** | | **22/40** | **Acceptable — significant improvements needed before users are happy** |

---

## Anti-Patterns Verdict

**Start here.** Does this look AI-generated?

**LLM assessment:** Partially. The Barlow Condensed / Space Grotesk pairing and the amber accent carry most of the personality. Strip them and what's left is textbook AI scaffold: uniform 2-col card grid, identical card structure on every item, raw API strings (ISO dates) used as display values, a loading state that's just centered text in a card, and a heading structure that duplicates "upcoming" across adjacent h1 and h2. The typography is doing heavy lifting that the layout doesn't deserve yet.

**Deterministic scan:** `detect.mjs` returned zero findings. The file is clean of tracked anti-patterns (no gradient text, no uppercase eyebrows, no side-stripe borders). This matches what the code shows — the banned patterns have been cleared in earlier passes.

**Visual overlays:** No browser automation available; overlay injection was not attempted. No overlay findings to report.

---

## Overall Impression

The foundation is set: amber accent, right font pairing, cards with real hierarchy. But the page is doing three things that undermine the "Venue Board" north star — it shows raw ISO dates instead of human-readable dates, it has a duplicate h1 that creates visual stutter immediately below the header, and the empty state copy is wrong for a page that auto-loads events. Fix those three and the page punches significantly above its current weight.

---

## What's Working

**1. Typography hierarchy is clean and intentional.** Barlow Condensed on h1/h2, Space Grotesk on card titles/metadata — the proportion contrast reads immediately on dark backgrounds. The `leading-none` on h1 + `tracking-tight` gives the condensed face room to work.

**2. Amber CTA button is visually decisive.** Full-width amber on the card bottom, `text-zinc-950` for near-black contrast (~9.4:1), flat with only a lightening hover. It's the single obvious action per card, no competing CTAs. This is exactly right.

**3. Error/loading/empty states are structurally consistent.** Same card shell (`rounded-lg border border-slate-800 bg-slate-900/60`) used for all non-data states. Users won't see a jarring layout shift when state changes.

---

## Priority Issues

**[P1] Dual `<h1>` creates broken heading hierarchy and visual collision**
- **Why it matters:** `app.vue` already renders an `<h1>` for "Live Music Tracker". `index.vue` renders another `<h1>` for "Local Upcoming Music". This is a semantic hierarchy failure — one `<h1>` per page. Screen readers announce both as top-level landmarks. Visually, two large Barlow Condensed display headings appear within 48px of each other with only a border separating them, creating visual stutter rather than hierarchy.
- **Fix:** Demote `index.vue`'s heading to `<h2>` (consistent with all other pages where the page-level section heading is already `<h2>`). Update the class from `text-3xl font-bold` to the headline style (`text-xl font-semibold leading-tight`) matching how "Upcoming Events" h2 reads below it — or remove it entirely and let the app header + the "Upcoming Events" section heading do the work.
- **Suggested command:** `/impeccable clarify` — heading structure and copy are intertwined here

**[P1] Wrong empty state copy**
- **Why it matters:** The empty state reads "Enter an artist and optional city above to find shows." This page auto-loads Portland/Vancouver metro events — it never requires user input. If events come back empty (TM returned nothing), this message is factually wrong and confusing. The search bar above searches by artist/genre, not by city/DMA, so the instruction doesn't even match the available controls.
- **Fix:** `"No upcoming events found for Portland/Vancouver right now. Try again later."` If the empty case is genuinely unreachable in production (TM always returns some events for DMA 37), add a code comment and deprioritize, but the copy is wrong either way.
- **Suggested command:** `/impeccable clarify`

**[P1] Raw ISO date strings break fan-first framing**
- **Why it matters:** `event.dates?.start?.localDate` returns `"2026-07-04"` and `localTime` returns `"19:00:00"`. A venue board would say "Fri Jul 4" and "7:00 PM", not ISO format. The raw strings read as API output, not published show information. This is the single biggest "developer left it as-is" tell on the page.
- **Fix:** Add a `formatShowDate(isoDate: string): string` and `formatShowTime(isoTime: string): string` utility in `app/utils/` — or lean on `Intl.DateTimeFormat`. Example: `new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })` → "Fri Jul 4". For time: `isoTime.slice(0,5)` → "19:00" → convert to 12h. **Also:** add a `<time>` element wrapper with `datetime={isoDate}` for semantics (the CSS already styles `time` with tabular-nums).
- **Suggested command:** `/impeccable clarify` (copy + formatting), or a direct code fix

**[P2] Identical card grid with no temporal signal or density variation**
- **Why it matters:** All N cards render at identical visual weight regardless of whether the show is this Saturday or 8 months away. A fan scanning the feed gets no signal about urgency. The DESIGN.md anti-reference says "Don't build identical card grids with only icon + heading + body" — these cards are one level above that but still uniform.
- **Fix:** Even a minimal urgency badge — "Tonight", "This Weekend", "This Month" — above the date on near-term shows gives fans a quick scan anchor. Consider a `data-urgency` computed attribute: if date is ≤2 days, show an amber-tinted urgency label. Alternatively, order by date (already likely) and insert a visual date-group separator ("This Weekend / Next Week / Coming Up").
- **Suggested command:** `/impeccable layout`

**[P2] `text-slate-500` on 12px venue text likely fails WCAG AA**
- **Why it matters:** `text-slate-500` (#64748b) on `bg-slate-900/60` (approximately #0f172a at 60% opacity over #020617 ≈ effective #0d1424) — the computed contrast is approximately 3.1:1. WCAG AA requires 4.5:1 for normal text under 18px (non-bold). At 12px non-bold, this fails. This is the venue name and city — critical information.
- **Fix:** Bump venue metadata to `text-slate-400` (#94a3b8), which clears 4.5:1 on this background. This also creates a more legible 3-stop hierarchy: slate-100 (title) → slate-300/400 (date) → slate-400 (venue).
- **Suggested command:** `/impeccable audit`

---

## Persona Red Flags

**Casey (Distracted Mobile User)** — checking shows on the commute home, one-handed, intermittently:
- Raw ISO dates ("2026-07-04 • 19:00:00") require mental parsing under distraction. Casey reads "2026-07-04" and has to calculate that this is a Saturday in early July. A venue board would say "Sat Jul 4".
- The full-width CTA button is correctly thumb-accessible — no red flag here.
- No temporal urgency means Casey can't quickly spot "anything this weekend?" and has to read date strings for all 20 cards. High cognitive load on slow content scan.
- If page loads slowly (3G), the "Loading local events..." text card gives no layout preview, so Casey can't begin mentally preparing for the content structure.

**Jordan (Confused First-Timer)** — never used a music tracker before:
- Arrives at the page and sees two big Barlow Condensed headings back-to-back ("Live Music Tracker" then "Local Upcoming Music") — no clear sense of which is the app name and which is the page description.
- The CTA label "View Show + Setlist History" requires knowing what a setlist is. Jordan may not know. No tooltip or explanation.
- If events are empty, Jordan reads "Enter an artist and optional city above to find shows" — tries typing in the search bar — gets redirected to an artist page — is confused why nothing changed on the local feed.
- No onboarding: why Portland/Vancouver? Why are these the events shown? There's no explanation of the DMA auto-selection.

**The Regular Gig-Goer (project-specific):** A Portland/Vancouver music fan who checks the tracker weekly to see what's new in town. Moves fast, knows the scene:
- Wants to scan in 10 seconds: "anything good this weekend?" — blocked by ISO dates and uniform card weight.
- Would benefit from a "new this week" or "just announced" signal — none present.
- CTA label "View Show + Setlist History" takes 28 characters to say what "Setlists →" could say in 10. The gig-goer is scanning, not reading.

---

## Minor Observations

- **"Upcoming" appears twice in 3 lines:** h1 "Local Upcoming Music" → section h2 "Upcoming Events". Consider renaming the h1/h2 to avoid the echo: h1 → "Local Shows" or drop the page h1 entirely; h2 → "Upcoming Events" stands on its own.
- **`text-slate-200` for dates vs `text-slate-100` for titles** — The 100→200 step on a dark card is nearly imperceptible (~0.5 stops). Using `text-slate-300` for dates would create clearer secondary hierarchy.
- **`gap-6` between sections vs `gap-3` inside the grid** — The outer `flex-col gap-6` is right. But `gap-3` between cards (12px) vs `p-4` card padding (16px) means the gap-between-cards is tighter than the space-inside-cards. Consider `gap-4` for the grid.
- **No genre link on event cards** — The header and show page show genre info, but event cards on the home feed don't link to genres. If an event has a classification, a small genre tag could link to `/genre/[name]` — useful navigation shortcut.
- **`text-slate-300` loading text vs `text-slate-100` everything else** — The loading message reads at a lower weight than the error state message, inconsistently.

---

## Questions to Consider

- "What does a fan want to know in 2 seconds? Is it the event name or the date?" — Right now the event name is bigger. Is that right for a local discovery feed where the question is "when/where" not "who"?
- "Why does the page need an h1 at all? The app header already announces the product. Does 'Local Upcoming Music' add information, or just repeat it?"
- "What would this page look like with date-group separators ('This Weekend', 'Next Week') instead of an undifferentiated card grid?"
