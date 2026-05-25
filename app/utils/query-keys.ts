export interface LocalDiscoveryLookup {
  geoPoint?: string
  dmaId?: string
}

export const buildLocalDiscoveryCacheKey = (lookup: LocalDiscoveryLookup): string => {
  if (lookup.geoPoint) {
    return `local:geoPoint:${lookup.geoPoint}`
  }

  if (lookup.dmaId) {
    return `local:dmaId:${lookup.dmaId}`
  }

  throw new Error('Local discovery cache key requires geoPoint or dmaId.')
}

export const buildGenreCacheKey = (classificationName: string): string => {
  return `genre:${classificationName}`
}

export const buildArtistUpcomingCacheKey = (artistName: string): string => {
  return `artist-upcoming:${artistName}`
}

export const buildSetlistHistoryCacheKey = (artistName: string): string => {
  return `setlist-history:${artistName}`
}
