import { ref } from 'vue'
import type { MergedEventsResult, SetlistItem, SuggestResponse, TicketmasterEvent } from '../types/music'
import {
  buildArtistUpcomingCacheKey,
  buildGenreCacheKey,
  buildLocalDiscoveryCacheKey,
  buildSetlistHistoryCacheKey,
  buildSuggestCacheKey,
  type LocalDiscoveryLookup
} from '../utils/query-keys'

type MergedCache = Record<string, MergedEventsResult>
type SetlistCache = Record<string, SetlistItem[]>
type SuggestCache = Record<string, SuggestResponse>

export const useMusicCacheStore = defineStore('music-cache', () => {
  const localDiscoveryCache = ref<MergedCache>({})
  const genreDiscoveryCache = ref<MergedCache>({})
  const artistUpcomingCache = ref<MergedCache>({})
  const setlistHistoryCache = ref<SetlistCache>({})
  const suggestCache = ref<SuggestCache>({})

  const getLocalDiscovery = (lookup: LocalDiscoveryLookup): MergedEventsResult | undefined => {
    return localDiscoveryCache.value[buildLocalDiscoveryCacheKey(lookup)]
  }

  const setLocalDiscovery = (lookup: LocalDiscoveryLookup, result: MergedEventsResult): void => {
    localDiscoveryCache.value[buildLocalDiscoveryCacheKey(lookup)] = result
  }

  const getGenreDiscovery = (classificationName: string): MergedEventsResult | undefined => {
    return genreDiscoveryCache.value[buildGenreCacheKey(classificationName)]
  }

  const setGenreDiscovery = (classificationName: string, result: MergedEventsResult): void => {
    genreDiscoveryCache.value[buildGenreCacheKey(classificationName)] = result
  }

  const getArtistUpcoming = (artistName: string): MergedEventsResult | undefined => {
    return artistUpcomingCache.value[buildArtistUpcomingCacheKey(artistName)]
  }

  const setArtistUpcoming = (artistName: string, result: MergedEventsResult): void => {
    artistUpcomingCache.value[buildArtistUpcomingCacheKey(artistName)] = result
  }

  /** Any event already loaded this session, so the show page can render without refetching. */
  const findCachedEvent = (eventId: string): TicketmasterEvent | undefined => {
    for (const cache of [localDiscoveryCache.value, artistUpcomingCache.value, genreDiscoveryCache.value]) {
      for (const result of Object.values(cache)) {
        const match = result.events.find((event) => event.id === eventId)
        if (match) return match
      }
    }
    return undefined
  }

  const getSetlistHistory = (artistName: string): SetlistItem[] | undefined => {
    return setlistHistoryCache.value[buildSetlistHistoryCacheKey(artistName)]
  }

  const setSetlistHistory = (artistName: string, setlists: SetlistItem[]): void => {
    setlistHistoryCache.value[buildSetlistHistoryCacheKey(artistName)] = setlists
  }

  const getSuggestions = (query: string): SuggestResponse | undefined => {
    return suggestCache.value[buildSuggestCacheKey(query)]
  }

  const setSuggestions = (query: string, suggestions: SuggestResponse): void => {
    suggestCache.value[buildSuggestCacheKey(query)] = suggestions
  }

  const clearSessionCaches = (): void => {
    localDiscoveryCache.value = {}
    genreDiscoveryCache.value = {}
    artistUpcomingCache.value = {}
    setlistHistoryCache.value = {}
    suggestCache.value = {}
  }

  const resetStore = (): void => {
    clearSessionCaches()
  }

  return {
    localDiscoveryCache,
    genreDiscoveryCache,
    artistUpcomingCache,
    setlistHistoryCache,
    suggestCache,
    getLocalDiscovery,
    setLocalDiscovery,
    getGenreDiscovery,
    setGenreDiscovery,
    getArtistUpcoming,
    setArtistUpcoming,
    findCachedEvent,
    getSetlistHistory,
    setSetlistHistory,
    getSuggestions,
    setSuggestions,
    clearSessionCaches,
    resetStore
  }
})
