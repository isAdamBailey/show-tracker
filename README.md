# Live Music Tracker

Nuxt 4 app for discovering live events and viewing historical setlists.

## Stack

- Nuxt 4 + Vue 3 (`<script setup>` + TypeScript)
- Pinia (session caching)
- Tailwind CSS (dark theme + blue accents)
- `@vueuse/motion` (layout transitions)
- ESLint + Prettier

## Core Data Rules

- Ticketmaster Discovery is the source for event discovery.
- setlist.fm is used only for historical setlists.
- Artist handoff uses the exact Ticketmaster field:
  - `_embedded.attractions[0].name`

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
```

Create a `.env` file:

```bash
TICKETMASTER_API_KEY=your_ticketmaster_key
SETLIST_FM_KEY=your_setlist_fm_key
```

Runtime config:

- `ticketmasterApiKey` -> `TICKETMASTER_API_KEY`
- `setlistFmKey` -> `SETLIST_FM_KEY`

## Scripts

- `npm run dev` - start dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run lint:fix` - auto-fix lint issues
- `npm run format` - format with Prettier
- `npm run format:check` - check formatting

## Routes

- `/` - local feed (Portland/Vancouver context)
- `/artist/[artistName]?city=[city]` - artist results with optional city keyword context
- `/genre/[name]?city=[city]` - genre results with optional city keyword context
- `/show/[eventId]?artistName=[artistName]&city=[city]` - selected show details + setlist history

## API Routes

- `GET /api/tm-discovery`
  - allowed query params: `geoPoint`, `dmaId`, `keyword`, `classificationName`
  - injects Ticketmaster API key server-side
- `GET /api/tm-classifications`
  - returns normalized Ticketmaster genre/subgenre names for search suggestions
- `GET /api/setlist-history`
  - allowed query params: `artistName`
  - injects setlist.fm API key server-side

## Search Behavior

- Header has two modes:
  - `Artist`
  - `Genre`
- Both modes include:
  - search term
  - city input (defaults to `Portland`)
- Genre search flow:
  - tries `classificationName` first (Portland DMA context)
  - falls back to `keyword` search when needed
  - with city provided, uses `keyword="<genre> <city>"`

## UX Behavior

- Reusable high-visibility CTA button on event cards:
  - `View Show + Setlist History`
- Artist page shows upcoming events only.
- Show page displays split-screen:
  - left: selected show details
  - right: historical setlist accordion
- Required states are implemented across pages:
  - loading
  - empty
  - error
  - partial-failure where multi-source data is used

## Project Structure

```text
app/
  app.vue
  assets/css/tailwind.css
  components/
    GlobalSearch.vue
    SetlistAccordion.vue
    ShowSetlistButton.vue
  pages/
    index.vue
    genre/[name].vue
    artist/[artistName].vue
    show/[eventId].vue
  stores/
    music-cache.ts
  types/
    music.ts
  utils/
    query-keys.ts
server/
  api/
    tm-discovery.ts
    tm-classifications.ts
    setlist-history.ts
```

