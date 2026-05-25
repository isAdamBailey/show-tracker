# Live Music Tracker

Nuxt 4 app for discovering live music events and viewing artist setlist history.

## Stack

- Nuxt 4 + Vue 3 (`<script setup>` + TypeScript)
- Pinia (session caching and location state)
- Tailwind CSS (dark theme)
- `@vueuse/motion` (page/layout transitions)
- ESLint + Prettier

## Data Flow Rules

- Ticketmaster Discovery API is the source for:
  - local event discovery
  - genre discovery
  - artist/event search
- setlist.fm is used only for historical setlist data.
- Artist linkage must use the exact Ticketmaster field:
  - `_embedded.attractions[0].name`

## Requirements

- Node.js 20+ recommended
- npm

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```bash
TICKETMASTER_API_KEY=your_ticketmaster_key
SETLIST_FM_KEY=your_setlist_fm_key
```

Nuxt runtime config keys:

- `ticketmasterApiKey` -> `TICKETMASTER_API_KEY`
- `setlistFmKey` -> `SETLIST_FM_KEY`

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format files with Prettier
- `npm run format:check` - Check Prettier formatting

## Project Structure

```text
app/
  app.vue
  assets/css/tailwind.css
  components/
    GlobalSearch.vue
    SetlistAccordion.vue
  pages/
    index.vue
    genre/[name].vue
    artist/[artistName].vue
  stores/
    music-cache.ts
  types/
    music.ts
  utils/
    query-keys.ts
server/
  api/
    tm-discovery.ts
    setlist-history.ts
```

## API Routes

- `GET /api/tm-discovery`
  - Allowed query params: `geoPoint`, `dmaId`, `keyword`, `classificationName`
  - Injects Ticketmaster key server-side
- `GET /api/setlist-history`
  - Allowed query params: `artistName`
  - Injects setlist.fm key server-side

## Current Features

- Global artist/genre search in app layout
- Local event discovery:
  - geolocation requested on mount
  - lat/lng converted to geohash (`geoPoint`)
  - fallback to `dmaId=37` if denied/unavailable
- Genre discovery by route param
- Artist page with parallel fetch for:
  - upcoming events (`/api/tm-discovery?keyword=...`)
  - setlist history (`/api/setlist-history?artistName=...`)
- Loading, empty, error, and partial-failure states
- Session-level caching in Pinia for local/genre/artist/setlist data

## Notes

- Source spec currently lives at `docs/poduct-spec.md`.
