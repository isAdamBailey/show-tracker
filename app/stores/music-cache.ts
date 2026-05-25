import { ref } from 'vue'
import type { SetlistItem, TicketmasterEvent } from '~/app/types/music'
import {
  buildArtistUpcomingCacheKey,
  buildGenreCacheKey,
  buildLocalDiscoveryCacheKey,
  buildSetlistHistoryCacheKey,
  type LocalDiscoveryLookup
} from '~/app/utils/query-keys'

type EventCache = Record<string, TicketmasterEvent[]>
type SetlistCache = Record<string, SetlistItem[]>

export type LocationSource = 'geoPoint' | 'dmaId' | null
export type LocationPermissionState = 'idle' | 'granted' | 'denied' | 'unavailable'

export interface LocationState {
  source: LocationSource
  geoPoint: string | null
  dmaId: string | null
  permission: LocationPermissionState
}

const emptyLocationState = (): LocationState => ({
  source: null,
  geoPoint: null,
  dmaId: null,
  permission: 'idle'
})

export const useMusicCacheStore = defineStore('music-cache', () => {
  const location = ref<LocationState>(emptyLocationState())

  const localDiscoveryCache = ref<EventCache>({})
  const genreDiscoveryCache = ref<EventCache>({})
  const artistUpcomingCache = ref<EventCache>({})
  const setlistHistoryCache = ref<SetlistCache>({})

  const setLocationByGeoPoint = (geoPoint: string): void => {
    location.value = {
      source: 'geoPoint',
      geoPoint,
      dmaId: null,
      permission: 'granted'
    }
  }

  const setLocationByDmaId = (dmaId: string, permission: LocationPermissionState): void => {
    location.value = {
      source: 'dmaId',
      geoPoint: null,
      dmaId,
      permission
    }
  }

  const setLocationPermission = (permission: LocationPermissionState): void => {
    location.value.permission = permission
  }

  const getLocalDiscovery = (lookup: LocalDiscoveryLookup): TicketmasterEvent[] | undefined => {
    const key = buildLocalDiscoveryCacheKey(lookup)
    return localDiscoveryCache.value[key]
  }

  const setLocalDiscovery = (lookup: LocalDiscoveryLookup, events: TicketmasterEvent[]): void => {
    const key = buildLocalDiscoveryCacheKey(lookup)
    localDiscoveryCache.value[key] = events
  }

  const getGenreDiscovery = (classificationName: string): TicketmasterEvent[] | undefined => {
    const key = buildGenreCacheKey(classificationName)
    return genreDiscoveryCache.value[key]
  }

  const setGenreDiscovery = (classificationName: string, events: TicketmasterEvent[]): void => {
    const key = buildGenreCacheKey(classificationName)
    genreDiscoveryCache.value[key] = events
  }

  const getArtistUpcoming = (artistName: string): TicketmasterEvent[] | undefined => {
    const key = buildArtistUpcomingCacheKey(artistName)
    return artistUpcomingCache.value[key]
  }

  const setArtistUpcoming = (artistName: string, events: TicketmasterEvent[]): void => {
    const key = buildArtistUpcomingCacheKey(artistName)
    artistUpcomingCache.value[key] = events
  }

  const getSetlistHistory = (artistName: string): SetlistItem[] | undefined => {
    const key = buildSetlistHistoryCacheKey(artistName)
    return setlistHistoryCache.value[key]
  }

  const setSetlistHistory = (artistName: string, setlists: SetlistItem[]): void => {
    const key = buildSetlistHistoryCacheKey(artistName)
    setlistHistoryCache.value[key] = setlists
  }

  const clearSessionCaches = (): void => {
    localDiscoveryCache.value = {}
    genreDiscoveryCache.value = {}
    artistUpcomingCache.value = {}
    setlistHistoryCache.value = {}
  }

  const resetStore = (): void => {
    location.value = emptyLocationState()
    clearSessionCaches()
  }

  return {
    location,
    localDiscoveryCache,
    genreDiscoveryCache,
    artistUpcomingCache,
    setlistHistoryCache,
    setLocationByGeoPoint,
    setLocationByDmaId,
    setLocationPermission,
    getLocalDiscovery,
    setLocalDiscovery,
    getGenreDiscovery,
    setGenreDiscovery,
    getArtistUpcoming,
    setArtistUpcoming,
    getSetlistHistory,
    setSetlistHistory,
    clearSessionCaches,
    resetStore
  }
})
