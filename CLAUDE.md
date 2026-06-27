# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run preview      # preview production build
npm run lint         # ESLint
npm run lint:fix     # auto-fix lint issues
npm run format       # Prettier format
npm run format:check # check formatting
```

No test suite is configured.

## Environment

Create a `.env` file with:

```
TICKETMASTER_API_KEY=
SETLIST_FM_KEY=
SEATGEEK_CLIENT_ID=
```

Runtime config keys: `ticketmasterApiKey`, `setlistFmKey`, `seatgeekClientId`.

## Architecture

Nuxt 4 app (Nuxt-style `app/` directory). Vue 3 `<script setup>` + TypeScript throughout. Tailwind CSS dark theme (slate-950 base, sky blue accents). `@vueuse/motion` for page transitions.

### Data sources and roles

- **Ticketmaster Discovery API** — primary source for all event discovery (local feed, genre, keyword search). All server-side calls go through `/api/tm-discovery`.
- **SeatGeek API** — supplements artist and genre listings. Gracefully returns empty results when `SEATGEEK_CLIENT_ID` is not set.
- **setlist.fm** — historical setlists only, never for event discovery.

### Event normalization

SeatGeek events are normalized into the `TicketmasterEvent` shape (`app/types/music.ts`) by `server/utils/seatgeek-events.ts`. SeatGeek IDs are prefixed `sg-` to avoid collisions. The `source` field (`'ticketmaster' | 'seatgeek'`) indicates origin.

### Multi-source merging

`app/utils/events.ts` exports `mergeShowEvents` which deduplicates and merges Ticketmaster + SeatGeek event arrays. Dedup key is `date|venue|artist` (case-insensitive). TM results take priority (listed first). Pages call `fetchMergedArtistEvents` or `fetchMergedGenreEvents` which use `Promise.allSettled` so one source failing doesn't break the page.

### Artist handoff

The primary artist name for any event is always `event._embedded.attractions[0].name`. This is the canonical key used for routing to artist pages and fetching setlist history.

### Pinia session cache (`app/stores/music-cache.ts`)

In-memory cache (lives for the browser session). Four caches: local discovery, genre discovery, artist upcoming, setlist history. Cache keys are built by helpers in `app/utils/query-keys.ts`. Pages check the cache before fetching and write to it after.

### Routes

- `/` — local feed (Portland/Vancouver DMA context)
- `/artist/[artistName]?city=` — upcoming events for an artist
- `/genre/[name]?city=` — events by genre
- `/show/[eventId]?artistName=&city=` — show detail + setlist accordion (split-screen layout)

### Server API routes

All routes live under `server/api/`. They inject API keys server-side and forward results to the client. `sg-artist-events.ts` and `sg-genre-events.ts` return `{ events: [] }` when SeatGeek is not configured rather than erroring.
