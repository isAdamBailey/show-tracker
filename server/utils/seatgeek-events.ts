import type {
  SeatGeekEvent,
  SeatGeekEventsResponse,
  SeatGeekGenresResponse,
  SeatGeekPerformer,
  SeatGeekPerformersResponse,
  TicketmasterEvent
} from '../../app/types/music'
import { foldText } from '#shared/utils/text'

const SEATGEEK_API_BASE = 'https://api.seatgeek.com/2'
const GENRE_PERFORMER_LIMIT = 8
const EVENTS_PER_PAGE = 50
// SeatGeek caps per_page at 100.
const MAX_PER_PAGE = 100
const MAX_LOCAL_PAGES = 4

/** SeatGeek ids are prefixed so they never collide with Ticketmaster's. */
export const SEATGEEK_ID_PREFIX = 'sg-'

const MUSIC_PERFORMER_TYPES = new Set(['band', 'music_festival'])

export const isMusicPerformer = (performer: SeatGeekPerformer): boolean =>
  MUSIC_PERFORMER_TYPES.has(performer.type ?? '')

// SeatGeek genre slugs are finer-grained than Ticketmaster's; fold them into
// Ticketmaster's top-level Music genres so genre chips stay consistent.
// Rules match folded text, where slug hyphens become spaces.
const SEATGEEK_GENRE_RULES: Array<[RegExp, string]> = [
  [/metal|hardcore|grindcore/, 'Metal'],
  [/hip ?hop|rap/, 'Hip-Hop/Rap'],
  [/rnb|r and b|soul|funk/, 'R&B'],
  [/country|bluegrass|americana/, 'Country'],
  [/folk|singer songwriter/, 'Folk'],
  [/jazz/, 'Jazz'],
  [/blues/, 'Blues'],
  [/electronic|edm|house|techno|dance|dubstep|trance/, 'Dance/Electronic'],
  [/classical|opera/, 'Classical'],
  [/latin|reggaeton/, 'Latin'],
  [/reggae/, 'Reggae'],
  [/alternative|indie/, 'Alternative'],
  [/rock|punk|grunge|emo/, 'Rock'],
  [/pop/, 'Pop']
]

const getTodayDate = (): string => {
  return new Date().toISOString().slice(0, 10)
}

const buildSeatGeekUrl = (path: string | undefined): string | undefined => {
  if (!path) {
    return undefined
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `https://seatgeek.com${path.startsWith('/') ? path : `/${path}`}`
}

const parseEventDateTime = (datetime: string | undefined): { localDate?: string; localTime?: string } => {
  if (!datetime) {
    return {}
  }

  const [localDate, timePart] = datetime.split('T')
  if (!timePart) {
    return { localDate }
  }

  const localTime = timePart.slice(0, 5)
  return {
    localDate,
    localTime: localTime.length > 0 ? localTime : undefined
  }
}

const mapSeatGeekGenre = (genre: { slug?: string; name?: string } | undefined): string | undefined => {
  const key = foldText(genre?.slug ?? genre?.name)
  if (!key) {
    return undefined
  }
  return SEATGEEK_GENRE_RULES.find(([pattern]) => pattern.test(key))?.[1] ?? 'Other'
}

const orderPerformers = (performers: SeatGeekPerformer[]): SeatGeekPerformer[] => {
  // The canonical headliner is attractions[0], so the primary performer goes first.
  const primary = performers.find((performer) => performer.primary)
  return primary ? [primary, ...performers.filter((performer) => performer !== primary)] : performers
}

export const normalizeSeatGeekEvent = (event: SeatGeekEvent): TicketmasterEvent => {
  const { localDate, localTime } = parseEventDateTime(event.datetime_local ?? event.datetime_utc)
  const performers = orderPerformers(event.performers ?? [])
  const headliner = performers[0]
  const headlinerGenre = headliner?.genres?.find((genre) => genre.primary) ?? headliner?.genres?.[0]
  const genreName = mapSeatGeekGenre(headlinerGenre)
  const lowestPrice = event.stats?.lowest_price ?? undefined
  const highestPrice = event.stats?.highest_price ?? undefined

  return {
    id: `${SEATGEEK_ID_PREFIX}${event.id}`,
    source: 'seatgeek',
    name: event.title,
    url: buildSeatGeekUrl(event.url),
    dates: {
      start: {
        localDate,
        localTime,
        dateTime: event.datetime_local ?? event.datetime_utc
      }
    },
    priceRanges:
      lowestPrice != null ? [{ min: lowestPrice, max: highestPrice ?? lowestPrice, currency: 'USD' }] : undefined,
    classifications: genreName ? [{ segment: { name: 'Music' }, genre: { name: genreName } }] : undefined,
    _embedded: {
      venues: event.venue
        ? [
            {
              id: event.venue.id != null ? `${SEATGEEK_ID_PREFIX}${event.venue.id}` : undefined,
              name: event.venue.name,
              city: { name: event.venue.city },
              state: event.venue.state ? { stateCode: event.venue.state } : undefined,
              country: { name: event.venue.country, countryCode: event.venue.country },
              address: event.venue.address ? { line1: event.venue.address } : undefined,
              location: {
                latitude: event.venue.location?.lat?.toString(),
                longitude: event.venue.location?.lon?.toString()
              }
            }
          ]
        : undefined,
      attractions: performers.map((performer) => ({ name: performer.name }))
    }
  }
}

const isMusicEvent = (event: SeatGeekEvent): boolean =>
  event.type === 'concert' ||
  (event.performers ?? []).some(isMusicPerformer)

const normalizeSeatGeekEvents = (events: SeatGeekEvent[]): TicketmasterEvent[] => {
  return events.filter(isMusicEvent).map(normalizeSeatGeekEvent)
}

export const fetchSeatGeekResource = async <T>(
  path: string,
  clientId: string,
  query: Record<string, string | number | undefined> = {}
): Promise<T> => {
  return $fetch<T>(`${SEATGEEK_API_BASE}${path}`, {
    query: {
      client_id: clientId,
      per_page: EVENTS_PER_PAGE,
      ...query
    }
  })
}

const pickBestPerformer = (
  performers: SeatGeekPerformersResponse['performers'],
  artistName: string
): SeatGeekPerformer | null => {
  const allPerformers = performers ?? []
  const normalizedArtistName = foldText(artistName)
  const musicPerformers = allPerformers.filter(isMusicPerformer)

  const exactMatch = musicPerformers.find(
    (performer) => foldText(performer.name) === normalizedArtistName
  )
  if (exactMatch) {
    return exactMatch
  }

  const partialMatch = musicPerformers.find((performer) =>
    foldText(performer.name).includes(normalizedArtistName)
  )
  if (partialMatch) {
    return partialMatch
  }

  return musicPerformers[0] ?? allPerformers[0] ?? null
}

const toGenreSlug = (genre: string): string => {
  return genre
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const resolveGenreSlug = async (genre: string, clientId: string): Promise<string> => {
  const derivedSlug = toGenreSlug(genre)
  const response = await fetchSeatGeekResource<SeatGeekGenresResponse>('/genres', clientId)
  const genres = response.genres ?? []

  const exactSlugMatch = genres.find((entry) => entry.slug === derivedSlug)
  if (exactSlugMatch?.slug) {
    return exactSlugMatch.slug
  }

  const normalizedGenre = foldText(genre)
  const nameMatch = genres.find((entry) => foldText(entry.name) === normalizedGenre)
  if (nameMatch?.slug) {
    return nameMatch.slug
  }

  const partialMatch = genres.find((entry) => {
    const slug = entry.slug ?? ''
    const name = foldText(entry.name)
    return slug.includes(derivedSlug) || derivedSlug.includes(slug) || name.includes(normalizedGenre)
  })
  if (partialMatch?.slug) {
    return partialMatch.slug
  }

  return derivedSlug
}

const buildConcertEventQuery = (): Record<string, string> => ({
  type: 'concert',
  'datetime_utc.gte': getTodayDate(),
  sort: 'datetime_utc.asc'
})

export const fetchSeatGeekArtistEvents = async (
  artistName: string,
  clientId: string
): Promise<TicketmasterEvent[]> => {
  const performersResponse = await fetchSeatGeekResource<SeatGeekPerformersResponse>('/performers', clientId, {
    q: artistName
  })

  const matchedPerformer = pickBestPerformer(performersResponse.performers ?? [], artistName)
  const eventQuery = buildConcertEventQuery()

  if (matchedPerformer) {
    const eventsResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
      ...eventQuery,
      'performers.id': String(matchedPerformer.id)
    })
    const normalizedEvents = normalizeSeatGeekEvents(eventsResponse.events ?? [])
    if (normalizedEvents.length > 0) {
      return normalizedEvents
    }
  }

  const keywordResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
    ...eventQuery,
    q: artistName
  })

  return normalizeSeatGeekEvents(keywordResponse.events ?? [])
}

export const fetchSeatGeekGenreEvents = async (genre: string, clientId: string): Promise<TicketmasterEvent[]> => {
  const genreSlug = await resolveGenreSlug(genre, clientId)
  const performersResponse = await fetchSeatGeekResource<SeatGeekPerformersResponse>('/performers', clientId, {
    'genres.slug': genreSlug
  })

  const performerIds = (performersResponse.performers ?? [])
    .filter(isMusicPerformer)
    .slice(0, GENRE_PERFORMER_LIMIT)
    .map((performer) => performer.id)

  if (performerIds.length === 0) {
    const keywordResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
      ...buildConcertEventQuery(),
      q: genre
    })
    return normalizeSeatGeekEvents(keywordResponse.events ?? [])
  }

  const eventsResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
    ...buildConcertEventQuery(),
    'performers.id': performerIds.join(',')
  })

  return normalizeSeatGeekEvents(eventsResponse.events ?? [])
}

export interface SeatGeekLocalQuery {
  lat: number
  lon: number
  rangeMiles: number
  /** Local datetimes, `YYYY-MM-DDTHH:mm:ss`. */
  start: string
  end: string
}

export const fetchSeatGeekLocalEvents = async (
  query: SeatGeekLocalQuery,
  clientId: string
): Promise<TicketmasterEvent[]> => {
  const baseQuery = {
    type: 'concert',
    lat: query.lat,
    lon: query.lon,
    range: `${query.rangeMiles}mi`,
    'datetime_local.gte': query.start,
    'datetime_local.lte': query.end,
    sort: 'datetime_local.asc',
    per_page: MAX_PER_PAGE
  }

  const events: SeatGeekEvent[] = []
  for (let page = 1; page <= MAX_LOCAL_PAGES; page += 1) {
    const response = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
      ...baseQuery,
      page
    })
    const pageEvents = response.events ?? []
    events.push(...pageEvents)
    const total = response.meta?.total ?? 0
    if (pageEvents.length < MAX_PER_PAGE || events.length >= total) {
      break
    }
  }

  return normalizeSeatGeekEvents(events)
}

export const fetchSeatGeekEventById = async (id: string, clientId: string): Promise<TicketmasterEvent> => {
  const event = await $fetch<SeatGeekEvent>(`${SEATGEEK_API_BASE}/events/${encodeURIComponent(id)}`, {
    query: { client_id: clientId }
  })
  return normalizeSeatGeekEvent(event)
}
