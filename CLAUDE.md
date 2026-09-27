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

Nuxt 4 app (Nuxt-style `app/` directory). Vue 3 `<script setup>` + TypeScript throughout. Tailwind CSS dark theme using the "Venue Board" tokens in `tailwind.config.ts` (warm near-black `canvas`, orange `accent`); see DESIGN.md. `@vueuse/motion` for page transitions.

### Data sources and roles

- **Ticketmaster Discovery API** — primary source for all event discovery (local feed, genre, keyword search). All server-side calls go through `/api/tm-discovery`.
- **SeatGeek API** — supplements the local feed and artist and genre listings, and adds prefix matching to search suggestions. Gracefully returns empty results when `SEATGEEK_CLIENT_ID` is not set.
- **setlist.fm** — historical setlists only, never for event discovery.

### Event normalization

SeatGeek events are normalized into the `TicketmasterEvent` shape (`app/types/music.ts`) by `server/utils/seatgeek-events.ts`. SeatGeek IDs are prefixed `sg-` to avoid collisions. The `source` field (`'ticketmaster' | 'seatgeek'`) indicates origin.

### Multi-source merging

`app/utils/events.ts` exports `mergeShowEvents` which deduplicates and merges Ticketmaster + SeatGeek event arrays. Dedup key is `localDate|headliner` (case- and diacritic-insensitive, so "Mötley Crüe" matches "Motley Crue"). TM results take priority. Sorting uses local date + time, never `dateTime` (TM's is UTC, SeatGeek's is local). `fetchMergedLocalEvents`, `fetchMergedArtistEvents` and `fetchMergedGenreEvents` use `Promise.allSettled` and return a `MergedEventsResult` with per-source status (`ok` / `failed` / `unconfigured`) so pages can show partial-failure and error states.

Artist and genre search are always nationwide. Only the home feed is location-scoped (`geoPoint` + 50-mile radius, one 30-day fetch filtered client-side into Tonight / Week / Month tabs).

### Artist handoff

The primary artist name for any event is always `event._embedded.attractions[0].name` (SeatGeek's `primary` performer is moved first during normalization). This is the canonical key used for routing to artist pages and fetching setlist history. Events with no attractions fall back to `event.name` (`getHeadliner`).

### Pinia session cache (`app/stores/music-cache.ts`)

In-memory cache (lives for the browser session). Caches: local discovery, genre discovery, artist upcoming (all `MergedEventsResult`), setlist history, and search suggestions. `findCachedEvent` lets the show page render from an already-loaded feed. Cache keys are built by helpers in `app/utils/query-keys.ts`. Pages check the cache before fetching and write to it after.

### Routes

- `/?tab=&genre=` — local feed near the user's detected or manually chosen city (`useUserLocation`; manual choice persisted in `localStorage` as `lmt:city`)
- `/artist/[artistName]` — nationwide upcoming events + setlist history for an artist
- `/genre/[name]` — nationwide events by genre
- `/show/[eventId]?artistName=` — show detail + setlist accordion (split-screen layout)

### Server API routes

All routes live under `server/api/`. They inject API keys server-side and forward results to the client. The SeatGeek routes (`sg-artist-events`, `sg-genre-events`, `sg-local-events`) return `{ events: [], configured: false }` when SeatGeek is not configured rather than erroring. `suggest.ts` powers the header search (TM attractions + SeatGeek performers + cached Music genres). `event/[id].ts` fetches one event (`sg-` ids go to SeatGeek). `setlist-history.ts` resolves the exact setlist.fm artist by MBID first, because setlist.fm's `artistName` search is fuzzy and often returns tribute acts.
