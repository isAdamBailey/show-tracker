export interface LocalDiscoveryLookup {
  geoPoint: string
  radiusMiles: number
  /** Local date the Month window starts on, so a cached feed expires at midnight. */
  startDate: string
}

export const buildLocalDiscoveryCacheKey = (lookup: LocalDiscoveryLookup): string => {
  return `local:${lookup.geoPoint}:${lookup.radiusMiles}mi:${lookup.startDate}`
}

export const buildGenreCacheKey = (classificationName: string): string => {
  return `genre:${classificationName.toLowerCase()}`
}

export const buildArtistUpcomingCacheKey = (artistName: string): string => {
  return `artist-upcoming:${artistName.toLowerCase()}`
}

export const buildSetlistHistoryCacheKey = (artistName: string): string => {
  return `setlist-history:${artistName}`
}

export const buildSuggestCacheKey = (query: string): string => {
  return `suggest:${query.trim().toLowerCase()}`
}
