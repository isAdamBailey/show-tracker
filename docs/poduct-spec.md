# Live Music Tracker

## Role

Act as a Senior Frontend Engineer.

## Project Goal

Scaffold a Nuxt 4 application for live music tracking.

## Core Architecture Rule

The application must use a strict linear data flow.

1. Ticketmaster Discovery API is the only source for:
   - local event discovery
   - genre discovery
   - artist/event discovery

2. setlist.fm is only used for historical data.

3. The only allowed bridge from Ticketmaster to setlist.fm is the exact artist name string from the Ticketmaster event payload at:
   `_embedded.attractions[0].name`

Do not guess or invent alternate linking logic.
Do not query setlist.fm by genre, city, coordinates, venue, or any other field.
Only query setlist.fm using `artistName`.

## Tech Stack Requirements

- Nuxt 4
- Vue 3 Composition API
- `<script setup>`
- Nuxt `app/` and `server/` directory separation
- Tailwind CSS with a dark theme using deep grays and slates
- `@vueuse/motion` for layout transitions
- Pinia for location state and response caching
- npm as the package manager
- TypeScript throughout; avoid `any`

## API Rules

### Ticketmaster Discovery API v2

Endpoint:
`https://app.ticketmaster.com/discovery/v2/events.json`

Allowed query usage:

- `classificationName` for genre discovery
- `geoPoint` or `dmaId` for local discovery
- `keyword` for artist/event search

Important:

- `latlong` is deprecated and must not be used
- If browser geolocation is available, convert latitude/longitude to a Ticketmaster-compatible `geoPoint`
- Use a geohash library for this conversion
- If the user denies location access, fallback to `dmaId=37` for Portland/Vancouver metro
- Do not invent unsupported Ticketmaster parameters

### setlist.fm API

Endpoint:
`https://api.setlist.fm/rest/1.0/search/setlists`

Allowed query usage:

- ONLY `artistName`

Required request headers:

- `Accept: application/json`
- `x-api-key: [YOUR_KEY]`

Do not add date filters or other search parameters unless explicitly requested later.
Use the default most recent results returned by the API.

## Runtime Config Requirements

Use Nuxt runtime config for private server-side API keys only:

- `TICKETMASTER_API_KEY`
- `SETLIST_FM_KEY`

Never expose these keys to client-side code.

## Required Directory Structure and Files

- `server/api/tm-discovery.ts`
  - Nitro route
  - Accepts only: `geoPoint`, `dmaId`, `keyword`, `classificationName`
  - Injects `TICKETMASTER_API_KEY` from `useRuntimeConfig()`

- `server/api/setlist-history.ts`
  - Nitro route
  - Accepts only: `artistName`
  - Injects `SETLIST_FM_KEY` from `useRuntimeConfig()`

- `app/app.vue`
  - Main layout
  - Contains a global search component
  - Search mode dropdown must support:
    - `Artist`
    - `Genre`

- `app/pages/index.vue`
  - Request `navigator.geolocation` on mount
  - Fetch and display a grid of upcoming local music events using `server/api/tm-discovery.ts`

- `app/pages/genre/[name].vue`
  - Discovery feed page
  - Query `tm-discovery.ts` using `classificationName`
  - Display event cards
  - Clicking a card must route using the exact artist name from Ticketmaster:
    `_embedded.attractions[0].name`
  - If that field is missing, do not guess; disable artist-history navigation for that card

- `app/pages/artist/[artistName].vue`
  - Must perform parallel data fetching
  - Fetch 1:
    call `tm-discovery.ts` with `keyword=[artistName]` to show upcoming tour dates globally
  - Fetch 2:
    call `setlist-history.ts` with `artistName=[artistName]` to show historical tour locations and setlists
  - Display setlists in an interactive accordion

## State Management Rules

Use Pinia to cache:

- local discovery results by `geoPoint` or `dmaId`
- genre results by `classificationName`
- artist upcoming events by `artistName`
- setlist history by `artistName`

Cache for the current session only.

## UX Requirements

Every page must include:

- loading state
- empty state
- error state

## Artist Page Behavior

- Fetch Ticketmaster and setlist.fm in parallel
- If one request fails, still render the other successful dataset
- Do not block the whole page on one failed request

## Routing Rules

- Encode artist names when generating routes
- Decode route params before querying APIs

## Implementation Quality Rules

- Keep files modular and reasonably small
- Prefer reusable components
- Use descriptive naming
- Add minimal comments only where helpful
- Use strict typing for API responses, route params, and query parsing
- Do not use `any` unless absolutely unavoidable

## First Task

1. Output the updated `package.json`
2. Initialize the Nuxt 4 folder structure
3. Write the complete code for `app/pages/artist/[artistName].vue`
4. Demonstrate the exact parallel fetching logic and data binding for the two separate server routes
5. Include loading, partial-failure, empty, and success UI states

## Critical Constraint

When navigating from a Ticketmaster event to the artist page, use the exact Ticketmaster payload field:
`_embedded.attractions[0].name`

Do not substitute another field.
Do not normalize, infer, or rewrite the artist name before sending it to `setlist-history.ts`.
