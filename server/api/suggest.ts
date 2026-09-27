import type {
  SeatGeekPerformersResponse,
  SuggestArtist,
  SuggestGenre,
  SuggestResponse,
  TmAttractionsResponse,
  TmDiscoveryResponse
} from '../../app/types/music'
import { foldText } from '#shared/utils/text'
import { readAllowedQuery, readOptionalString } from '../utils/http'
import { getMusicGenres } from '../utils/music-genres'
import { SEATGEEK_ID_PREFIX, fetchSeatGeekResource, isMusicPerformer } from '../utils/seatgeek-events'

const MAX_PER_GROUP = 3
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 80
const GENRE_COUNT_TTL_MS = 60 * 60 * 1000
// Typing fires a request per pause; caching whole answers keeps repeat prefixes off Ticketmaster's rate limit.
const RESPONSE_TTL_MS = 5 * 60 * 1000
const RESPONSE_CACHE_MAX_ENTRIES = 500

const genreCountCache = new Map<string, { count: number; expiresAt: number }>()
const responseCache = new Map<string, { response: SuggestResponse; expiresAt: number }>()

const matchRank = (name: string, query: string): number => {
  const folded = foldText(name)
  if (folded === query) return 0
  if (folded.startsWith(query)) return 1
  if (folded.split(' ').some((word) => word.startsWith(query))) return 2
  if (folded.includes(query)) return 3
  return 4
}

const fetchTicketmasterArtists = async (query: string, apiKey: string): Promise<SuggestArtist[]> => {
  const response = await $fetch<TmAttractionsResponse>('https://app.ticketmaster.com/discovery/v2/attractions.json', {
    query: { apikey: apiKey, keyword: query, segmentName: 'Music', size: 10 }
  })
  // segmentName isn't applied strictly (e.g. monster-truck shows come back), so check each attraction.
  return (response._embedded?.attractions ?? [])
    .filter((attraction) => attraction.classifications?.some((c) => c.segment?.name === 'Music') ?? true)
    .map((attraction) => ({
    id: attraction.id,
    name: attraction.name,
    upcoming: attraction.upcomingEvents?._total ?? 0
  }))
}

const fetchSeatGeekArtists = async (query: string, clientId: string | undefined): Promise<SuggestArtist[]> => {
  if (!clientId) {
    return []
  }
  const response = await fetchSeatGeekResource<SeatGeekPerformersResponse>('/performers', clientId, {
    q: query,
    per_page: 10
  })
  return (response.performers ?? [])
    .filter(isMusicPerformer)
    .map((performer) => ({
      id: `${SEATGEEK_ID_PREFIX}${performer.id}`,
      name: performer.name,
      upcoming: performer.num_upcoming_events ?? 0
    }))
}

const mergeArtists = (query: string, groups: SuggestArtist[][]): SuggestArtist[] => {
  const byName = new Map<string, SuggestArtist>()
  // Ticketmaster comes first, so its id and spelling win on ties.
  for (const artist of groups.flat()) {
    const key = foldText(artist.name)
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, { ...artist })
    } else {
      existing.upcoming = Math.max(existing.upcoming, artist.upcoming)
    }
  }

  return [...byName.values()]
    .filter((artist) => matchRank(artist.name, query) < 4)
    .sort(
      (left, right) =>
        matchRank(left.name, query) - matchRank(right.name, query) || right.upcoming - left.upcoming
    )
    .slice(0, MAX_PER_GROUP)
}

const fetchGenreCount = async (genre: string, apiKey: string): Promise<number | undefined> => {
  const cachedCount = genreCountCache.get(genre)
  if (cachedCount && cachedCount.expiresAt > Date.now()) {
    return cachedCount.count
  }
  try {
    const response = await $fetch<TmDiscoveryResponse>('https://app.ticketmaster.com/discovery/v2/events.json', {
      query: { apikey: apiKey, classificationName: genre, segmentName: 'Music', size: 1 }
    })
    const count = response.page?.totalElements ?? 0
    genreCountCache.set(genre, { count, expiresAt: Date.now() + GENRE_COUNT_TTL_MS })
    return count
  } catch {
    return undefined
  }
}

const suggestGenres = async (query: string, apiKey: string): Promise<SuggestGenre[]> => {
  const { genres, subgenres } = await getMusicGenres(apiKey)
  const matches = [...genres, ...subgenres]
    .map((name, index) => ({ name, rank: matchRank(name, query), index }))
    .filter((entry) => entry.rank < 3)
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .slice(0, MAX_PER_GROUP)

  const withCounts = await Promise.all(
    matches.map(async ({ name }) => ({ name, count: await fetchGenreCount(name, apiKey) }))
  )
  // A genre with nothing on sale anywhere is a dead end; unknown counts still show.
  return withCounts.filter((genre) => genre.count !== 0)
}

export default defineEventHandler(async (event): Promise<SuggestResponse> => {
  const query = foldText(readOptionalString(readAllowedQuery(event, ['q']), 'q')).slice(0, MAX_QUERY_LENGTH)
  if (query.length < MIN_QUERY_LENGTH) {
    return { artists: [], genres: [] }
  }

  const cached = responseCache.get(query)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response
  }

  const config = useRuntimeConfig(event)
  if (!config.ticketmasterApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Ticketmaster API key configuration.' })
  }

  const [tmArtists, sgArtists, genres] = await Promise.allSettled([
    fetchTicketmasterArtists(query, config.ticketmasterApiKey),
    fetchSeatGeekArtists(query, config.seatgeekClientId),
    suggestGenres(query, config.ticketmasterApiKey)
  ])

  const valueOr = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === 'fulfilled' ? result.value : fallback

  const response: SuggestResponse = {
    artists: mergeArtists(query, [valueOr(tmArtists, []), valueOr(sgArtists, [])]),
    genres: valueOr(genres, [])
  }

  // Only cache complete answers, so a transient upstream failure isn't remembered.
  if ([tmArtists, sgArtists, genres].every((result) => result.status === 'fulfilled')) {
    if (responseCache.size >= RESPONSE_CACHE_MAX_ENTRIES) {
      responseCache.delete(responseCache.keys().next().value!)
    }
    responseCache.set(query, { response, expiresAt: Date.now() + RESPONSE_TTL_MS })
  }
  return response
})
