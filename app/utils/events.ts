import type {
  MergedEventsResult,
  SgEventsProxyResponse,
  SourceStatus,
  TicketmasterEvent,
  TicketmasterVenue,
  TmDiscoveryProxyResponse
} from '../types/music'
import { foldText } from '#shared/utils/text'
import { formatShowTime, toLocalIsoDateTime, toTicketmasterDateTime } from './dates'

export const getArtistNameFromEvent = (event: TicketmasterEvent): string | null => {
  const artistName = event._embedded?.attractions?.[0]?.name
  return artistName?.trim() ? artistName : null
}

/** The headliner to display: the first attraction, or the event name when there are none. */
export const getHeadliner = (event: TicketmasterEvent): string => getArtistNameFromEvent(event) ?? event.name

export const getSupportActs = (event: TicketmasterEvent): string[] =>
  (event._embedded?.attractions ?? [])
    .slice(1)
    .map((attraction) => attraction.name)
    .filter(Boolean)

export const getEventGenre = (event: TicketmasterEvent): string | null => {
  const genre = event.classifications?.[0]?.genre?.name?.trim()
  return genre && genre.toLowerCase() !== 'undefined' ? genre : null
}

export const getEventVenue = (event: TicketmasterEvent): TicketmasterVenue | undefined => event._embedded?.venues?.[0]

/** "Portland, OR", or just the city when there is no state code. */
export const formatVenueCity = (venue: TicketmasterVenue | undefined): string => {
  const city = venue?.city?.name
  const state = venue?.state?.stateCode
  return [city, state].filter(Boolean).join(', ')
}

/** "$32–45", "$15", or null when no source reported a price. */
export const formatPriceRange = (event: TicketmasterEvent): string | null => {
  const range = event.priceRanges?.[0]
  if (range?.min == null) {
    return null
  }
  const min = Math.round(range.min)
  const max = range.max != null ? Math.round(range.max) : min
  return max > min ? `$${min}–${max}` : `$${min}`
}

export const getDoorsTime = (event: TicketmasterEvent): string | null =>
  event.doorsTime ? formatShowTime(event.doorsTime) : null

export const getShowTime = (event: TicketmasterEvent): string | null => {
  const localTime = event.dates?.start?.localTime
  return localTime ? formatShowTime(localTime) : null
}

export const getTicketSourceName = (event: TicketmasterEvent): string =>
  event.source === 'seatgeek' ? 'SeatGeek' : 'Ticketmaster'

export const buildShowRoute = (event: TicketmasterEvent): string =>
  `/show/${encodeURIComponent(event.id)}?artistName=${encodeURIComponent(getHeadliner(event))}`

/** Only the first row of each day shows the date. */
export const isFirstOfDay = (events: TicketmasterEvent[], index: number): boolean =>
  index === 0 || events[index - 1]?.dates?.start?.localDate !== events[index]?.dates?.start?.localDate

/** Local date + time, used for ordering and day grouping. TM `dateTime` is UTC and SG's is local, so never sort on it. */
const getLocalSortKey = (event: TicketmasterEvent): string =>
  `${event.dates?.start?.localDate ?? '9999-99-99'}T${event.dates?.start?.localTime ?? '99:99'}`

const buildEventDedupeKey = (event: TicketmasterEvent): string => {
  const date = event.dates?.start?.localDate ?? ''
  const artist = foldText(getHeadliner(event))
  return `${date}|${artist}`
}

export const mergeShowEvents = (
  ticketmasterEvents: TicketmasterEvent[],
  seatgeekEvents: TicketmasterEvent[]
): TicketmasterEvent[] => {
  const mergedEvents: TicketmasterEvent[] = []
  const seenKeys = new Set<string>()

  for (const event of [...ticketmasterEvents, ...seatgeekEvents]) {
    const dedupeKey = buildEventDedupeKey(event)
    if (seenKeys.has(dedupeKey)) {
      continue
    }

    seenKeys.add(dedupeKey)
    mergedEvents.push(event)
  }

  return mergedEvents.sort((left, right) => getLocalSortKey(left).localeCompare(getLocalSortKey(right)))
}

const MUSIC_QUERY = { segmentName: 'Music', sort: 'date,asc', size: '100' }

// The server already normalizes events (source, doorsTime), so the client only unwraps them.
const fetchDiscovery = async (query: Record<string, string>): Promise<TmDiscoveryProxyResponse> =>
  $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', { query })

export const fetchEventById = (eventId: string): Promise<TicketmasterEvent> =>
  $fetch<TicketmasterEvent>(`/api/event/${encodeURIComponent(eventId)}`)

const toSourceStatus = (
  result: PromiseSettledResult<unknown>,
  configured: boolean = true
): SourceStatus => {
  if (result.status === 'rejected') return 'failed'
  return configured ? 'ok' : 'unconfigured'
}

const settleMerged = (
  ticketmasterResult: PromiseSettledResult<TicketmasterEvent[]>,
  seatgeekResult: PromiseSettledResult<SgEventsProxyResponse>
): MergedEventsResult => {
  const ticketmasterEvents = ticketmasterResult.status === 'fulfilled' ? ticketmasterResult.value : []
  const seatgeekEvents = seatgeekResult.status === 'fulfilled' ? seatgeekResult.value.events : []
  const seatgeekConfigured = seatgeekResult.status === 'fulfilled' ? seatgeekResult.value.configured !== false : true

  return {
    events: mergeShowEvents(ticketmasterEvents, seatgeekEvents),
    ticketmaster: toSourceStatus(ticketmasterResult),
    seatgeek: toSourceStatus(seatgeekResult, seatgeekConfigured)
  }
}

/** True when every configured source failed, i.e. nothing trustworthy to show. */
export const allSourcesFailed = (result: MergedEventsResult): boolean =>
  result.ticketmaster === 'failed' && result.seatgeek !== 'ok'

/** True when the artist (already folded) is anywhere on the bill, headlining or supporting. */
const eventFeaturesArtist = (event: TicketmasterEvent, foldedArtist: string): boolean =>
  (event._embedded?.attractions ?? []).some((attraction) => foldText(attraction.name) === foldedArtist)

/**
 * Artist search is always nationwide. Keyword matching also returns tribute acts and
 * events that merely mention the name, so keep only shows with the artist on the bill.
 */
export const fetchMergedArtistEvents = async (artistName: string): Promise<MergedEventsResult> => {
  const [ticketmasterResult, seatgeekResult] = await Promise.allSettled([
    fetchDiscovery({ ...MUSIC_QUERY, keyword: artistName }).then((response) => response._embedded.events),
    $fetch<SgEventsProxyResponse>('/api/sg-artist-events', { query: { artistName } })
  ])
  const merged = settleMerged(ticketmasterResult, seatgeekResult)
  const foldedArtist = foldText(artistName)
  return { ...merged, events: merged.events.filter((event) => eventFeaturesArtist(event, foldedArtist)) }
}

/** Genre search is always nationwide: Ticketmaster classification first, then a Music-only keyword match. */
export const fetchMergedGenreEvents = async (genre: string): Promise<MergedEventsResult> => {
  let usedKeywordFallback = false
  const fetchTicketmasterGenreEvents = async (): Promise<TicketmasterEvent[]> => {
    const byClassification = await fetchDiscovery({ ...MUSIC_QUERY, classificationName: genre })
    if (byClassification._embedded.events.length > 0) return byClassification._embedded.events
    usedKeywordFallback = true
    return (await fetchDiscovery({ ...MUSIC_QUERY, keyword: genre }))._embedded.events
  }

  const [ticketmasterResult, seatgeekResult] = await Promise.allSettled([
    fetchTicketmasterGenreEvents(),
    $fetch<SgEventsProxyResponse>('/api/sg-genre-events', { query: { genre } })
  ])
  return { ...settleMerged(ticketmasterResult, seatgeekResult), usedKeywordFallback }
}

export interface LocalFeedQuery {
  lat: number
  lon: number
  geoPoint: string
  radiusMiles: number
  start: Date
  end: Date
}

// Ticketmaster caps size at 200 and deep paging at 1,000 results.
const TM_PAGE_SIZE = 200
const TM_MAX_PAGES = 3

type GeoWindow = Pick<LocalFeedQuery, 'geoPoint' | 'radiusMiles' | 'start' | 'end'>

const buildGeoQuery = (query: GeoWindow): Record<string, string> => ({
  geoPoint: query.geoPoint,
  radius: String(query.radiusMiles),
  unit: 'miles',
  segmentName: 'Music',
  startDateTime: toTicketmasterDateTime(query.start),
  endDateTime: toTicketmasterDateTime(query.end)
})

// Pages are fetched one at a time: the API key is shared by every visitor, so latency is traded for rate-limit headroom.
const fetchTicketmasterLocalEvents = async (
  query: LocalFeedQuery
): Promise<{ events: TicketmasterEvent[]; truncated: boolean }> => {
  const baseQuery = { ...buildGeoQuery(query), sort: 'date,asc', size: String(TM_PAGE_SIZE) }

  const events: TicketmasterEvent[] = []
  let totalPages = 1
  for (let page = 0; page < TM_MAX_PAGES; page += 1) {
    const response = await fetchDiscovery({ ...baseQuery, page: String(page) })
    events.push(...response._embedded.events)
    totalPages = response.page?.totalPages ?? 1
    if (page + 1 >= totalPages) {
      break
    }
  }
  return { events, truncated: totalPages > TM_MAX_PAGES }
}

/** Local feed: Ticketmaster + SeatGeek within a radius, merged. */
export const fetchMergedLocalEvents = async (query: LocalFeedQuery): Promise<MergedEventsResult> => {
  let truncated = false
  const [ticketmasterResult, seatgeekResult] = await Promise.allSettled([
    fetchTicketmasterLocalEvents(query).then((result) => {
      truncated = result.truncated
      return result.events
    }),
    $fetch<SgEventsProxyResponse>('/api/sg-local-events', {
      query: {
        lat: query.lat.toFixed(4),
        lon: query.lon.toFixed(4),
        range: String(query.radiusMiles),
        start: toLocalIsoDateTime(query.start),
        end: toLocalIsoDateTime(query.end)
      }
    })
  ])
  return { ...settleMerged(ticketmasterResult, seatgeekResult), truncated }
}

/**
 * Ticketmaster-only count for a place and window, used by the empty state
 * to suggest a nearby city that actually has shows.
 */
export const countTicketmasterEvents = async (query: GeoWindow & { genre?: string }): Promise<number> => {
  const response = await fetchDiscovery({
    ...buildGeoQuery(query),
    size: '1',
    ...(query.genre ? { classificationName: query.genre } : {})
  })
  return response.page?.totalElements ?? 0
}
