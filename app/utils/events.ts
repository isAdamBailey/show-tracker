import type { SgEventsProxyResponse, TicketmasterEvent, TmDiscoveryProxyResponse } from '../types/music'

const normalizeComparableText = (value: string | undefined): string => {
  return (value ?? '').trim().toLowerCase()
}

export const getArtistNameFromEvent = (event: TicketmasterEvent): string | null => {
  const artistName = event._embedded?.attractions?.[0]?.name
  return artistName?.trim() ? artistName : null
}

const buildEventDedupeKey = (event: TicketmasterEvent): string => {
  const date = normalizeComparableText(event.dates?.start?.localDate ?? event.dates?.start?.dateTime)
  const venue = normalizeComparableText(event._embedded?.venues?.[0]?.name)
  const artist = normalizeComparableText(getArtistNameFromEvent(event) ?? event.name)
  return `${date}|${venue}|${artist}`
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

  return mergedEvents.sort((left, right) => {
    const leftDate = left.dates?.start?.dateTime ?? left.dates?.start?.localDate ?? ''
    const rightDate = right.dates?.start?.dateTime ?? right.dates?.start?.localDate ?? ''
    return leftDate.localeCompare(rightDate)
  })
}

const normalizeTicketmasterEvents = (response: TmDiscoveryProxyResponse): TicketmasterEvent[] => {
  return (response._embedded.events ?? []).map((event) => ({
    ...event,
    source: event.source ?? 'ticketmaster'
  }))
}

export const fetchTicketmasterEvents = async (keyword: string): Promise<TicketmasterEvent[]> => {
  const response = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', {
    query: { keyword }
  })
  return normalizeTicketmasterEvents(response)
}

export const fetchSeatGeekArtistEvents = async (
  artistName: string,
  city?: string
): Promise<TicketmasterEvent[]> => {
  const query: { artistName: string; city?: string } = { artistName }
  if (city?.trim()) {
    query.city = city.trim()
  }

  const response = await $fetch<SgEventsProxyResponse>('/api/sg-artist-events', { query })
  return response.events
}

export const fetchSeatGeekGenreEvents = async (genre: string, city?: string): Promise<TicketmasterEvent[]> => {
  const query: { genre: string; city?: string } = { genre }
  if (city?.trim()) {
    query.city = city.trim()
  }

  const response = await $fetch<SgEventsProxyResponse>('/api/sg-genre-events', { query })
  return response.events
}

export const fetchMergedArtistEvents = async (
  artistName: string,
  city?: string
): Promise<TicketmasterEvent[]> => {
  const keyword = city?.trim() ? `${artistName} ${city.trim()}` : artistName

  const [ticketmasterResult, seatgeekResult] = await Promise.allSettled([
    fetchTicketmasterEvents(keyword),
    fetchSeatGeekArtistEvents(artistName, city)
  ])

  const ticketmasterEvents = ticketmasterResult.status === 'fulfilled' ? ticketmasterResult.value : []
  const seatgeekEvents = seatgeekResult.status === 'fulfilled' ? seatgeekResult.value : []

  return mergeShowEvents(ticketmasterEvents, seatgeekEvents)
}

export const fetchMergedGenreEvents = async (
  fetchTicketmasterGenreEvents: () => Promise<TicketmasterEvent[]>,
  genre: string,
  city?: string
): Promise<TicketmasterEvent[]> => {
  const [ticketmasterResult, seatgeekResult] = await Promise.allSettled([
    fetchTicketmasterGenreEvents(),
    fetchSeatGeekGenreEvents(genre, city)
  ])

  const ticketmasterEvents = ticketmasterResult.status === 'fulfilled' ? ticketmasterResult.value : []
  const seatgeekEvents = seatgeekResult.status === 'fulfilled' ? seatgeekResult.value : []

  return mergeShowEvents(ticketmasterEvents, seatgeekEvents)
}

export const getEventListingLabel = (event: TicketmasterEvent): string => {
  return event.source === 'seatgeek' ? 'Open SeatGeek listing' : 'Open Ticketmaster listing'
}
