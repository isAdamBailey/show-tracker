import type {
  SeatGeekEvent,
  SeatGeekEventsResponse,
  SeatGeekGenresResponse,
  SeatGeekPerformersResponse,
  TicketmasterEvent
} from '../../app/types/music'

const SEATGEEK_API_BASE = 'https://api.seatgeek.com/2'
const GENRE_PERFORMER_LIMIT = 8
const EVENTS_PER_PAGE = 50

const MUSIC_PERFORMER_TYPES = new Set(['band', 'music_festival'])

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

const normalizeComparableText = (value: string | undefined): string => {
  return (value ?? '').trim().toLowerCase()
}

export const normalizeSeatGeekEvent = (event: SeatGeekEvent): TicketmasterEvent => {
  const { localDate, localTime } = parseEventDateTime(event.datetime_local ?? event.datetime_utc)

  return {
    id: `sg-${event.id}`,
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
    _embedded: {
      venues: event.venue
        ? [
            {
              name: event.venue.name,
              city: { name: event.venue.city },
              country: { name: event.venue.country },
              location: {
                latitude: event.venue.location?.lat?.toString(),
                longitude: event.venue.location?.lon?.toString()
              }
            }
          ]
        : undefined,
      attractions: (event.performers ?? []).map((performer) => ({ name: performer.name }))
    }
  }
}

const normalizeSeatGeekEvents = (events: SeatGeekEvent[]): TicketmasterEvent[] => {
  return events
    .filter((event) => event.type === 'concert' || (event.performers ?? []).some((performer) => MUSIC_PERFORMER_TYPES.has(performer.type ?? '')))
    .map(normalizeSeatGeekEvent)
}

const filterEventsByCity = (events: TicketmasterEvent[], city: string | undefined): TicketmasterEvent[] => {
  const normalizedCity = normalizeComparableText(city)
  if (!normalizedCity) {
    return events
  }

  return events.filter((event) => {
    const eventCity = normalizeComparableText(event._embedded?.venues?.[0]?.city?.name)
    return eventCity.includes(normalizedCity) || normalizedCity.includes(eventCity)
  })
}

const fetchSeatGeekResource = async <T>(
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
): SeatGeekPerformersResponse['performers'][number] | null => {
  const normalizedArtistName = normalizeComparableText(artistName)
  const musicPerformers = performers.filter((performer) => MUSIC_PERFORMER_TYPES.has(performer.type ?? ''))

  const exactMatch = musicPerformers.find(
    (performer) => normalizeComparableText(performer.name) === normalizedArtistName
  )
  if (exactMatch) {
    return exactMatch
  }

  const partialMatch = musicPerformers.find((performer) =>
    normalizeComparableText(performer.name).includes(normalizedArtistName)
  )
  if (partialMatch) {
    return partialMatch
  }

  return musicPerformers[0] ?? performers[0] ?? null
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

  const normalizedGenre = normalizeComparableText(genre)
  const nameMatch = genres.find((entry) => normalizeComparableText(entry.name) === normalizedGenre)
  if (nameMatch?.slug) {
    return nameMatch.slug
  }

  const partialMatch = genres.find((entry) => {
    const slug = entry.slug ?? ''
    const name = normalizeComparableText(entry.name)
    return slug.includes(derivedSlug) || derivedSlug.includes(slug) || name.includes(normalizedGenre)
  })
  if (partialMatch?.slug) {
    return partialMatch.slug
  }

  return derivedSlug
}

const buildConcertEventQuery = (city: string | undefined): Record<string, string> => {
  const query: Record<string, string> = {
    type: 'concert',
    'datetime_utc.gte': getTodayDate(),
    sort: 'datetime_utc.asc'
  }

  if (city?.trim()) {
    query['venue.city'] = city.trim()
  }

  return query
}

export const fetchSeatGeekArtistEvents = async (
  artistName: string,
  clientId: string,
  city?: string
): Promise<TicketmasterEvent[]> => {
  const performersResponse = await fetchSeatGeekResource<SeatGeekPerformersResponse>('/performers', clientId, {
    q: artistName
  })

  const matchedPerformer = pickBestPerformer(performersResponse.performers ?? [], artistName)
  const eventQuery = buildConcertEventQuery(city)

  if (matchedPerformer) {
    const eventsResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
      ...eventQuery,
      'performers.id': String(matchedPerformer.id)
    })
    const normalizedEvents = normalizeSeatGeekEvents(eventsResponse.events ?? [])
    if (normalizedEvents.length > 0) {
      return filterEventsByCity(normalizedEvents, city)
    }
  }

  const keywordResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
    ...eventQuery,
    q: artistName
  })

  return filterEventsByCity(normalizeSeatGeekEvents(keywordResponse.events ?? []), city)
}

export const fetchSeatGeekGenreEvents = async (
  genre: string,
  clientId: string,
  city?: string
): Promise<TicketmasterEvent[]> => {
  const genreSlug = await resolveGenreSlug(genre, clientId)
  const performersResponse = await fetchSeatGeekResource<SeatGeekPerformersResponse>('/performers', clientId, {
    'genres.slug': genreSlug
  })

  const performerIds = (performersResponse.performers ?? [])
    .filter((performer) => MUSIC_PERFORMER_TYPES.has(performer.type ?? ''))
    .slice(0, GENRE_PERFORMER_LIMIT)
    .map((performer) => performer.id)

  if (performerIds.length === 0) {
    const keywordResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
      ...buildConcertEventQuery(city),
      q: genre
    })
    return filterEventsByCity(normalizeSeatGeekEvents(keywordResponse.events ?? []), city)
  }

  const eventsResponse = await fetchSeatGeekResource<SeatGeekEventsResponse>('/events', clientId, {
    ...buildConcertEventQuery(city),
    'performers.id': performerIds.join(',')
  })

  return filterEventsByCity(normalizeSeatGeekEvents(eventsResponse.events ?? []), city)
}
