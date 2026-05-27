# Live Music Tracker

Nuxt 4 app for discovering live events and viewing historical setlists.

[![Laravel Forge Site Deployment Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fforge.laravel.com%2Fsite-badges%2F2cf2e96a-40e8-4298-ac3e-b839b945170b%3Flabel%3D1&style=flat-square)](https://forge.laravel.com/adam-f6w/adambaileyio/3211818)

## Stack

- Nuxt 4 + Vue 3 (`<script setup>` + TypeScript)
- Pinia (session caching)
- Tailwind CSS (dark theme + blue accents)
- `@vueuse/motion` (layout transitions)
- ESLint + Prettier

## Core Data Rules

- Ticketmaster Discovery is the primary source for event discovery (local feed, genre classification, keyword search).
- SeatGeek supplements artist and genre event listings when `SEATGEEK_CLIENT_ID` is configured.
- setlist.fm is used only for historical setlists.
- Artist handoff uses the event's primary attraction name:
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
SEATGEEK_CLIENT_ID=your_seatgeek_client_id
```

Register a free SeatGeek client ID at [seatgeek.com/account/develop](https://seatgeek.com/account/develop).

Runtime config:

- `ticketmasterApiKey` -> `TICKETMASTER_API_KEY`
- `setlistFmKey` -> `SETLIST_FM_KEY`
- `seatgeekClientId` -> `SEATGEEK_CLIENT_ID`

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
- `GET /api/sg-artist-events`
  - allowed query params: `artistName`, `city` (optional city filter)
  - injects SeatGeek client ID server-side; returns empty results when not configured
- `GET /api/sg-genre-events`
  - allowed query params: `genre`, `city` (optional city filter)
  - injects SeatGeek client ID server-side; returns empty results when not configured
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
  - merges Ticketmaster results with SeatGeek genre/performer listings
- Artist/show pages merge Ticketmaster keyword results with SeatGeek artist events

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
    events.ts
    query-keys.ts
server/
  api/
    sg-artist-events.ts
    sg-genre-events.ts
    tm-discovery.ts
    tm-classifications.ts
    setlist-history.ts
```

