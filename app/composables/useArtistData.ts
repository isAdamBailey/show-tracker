import { useMusicCacheStore } from '../stores/music-cache'
import type { MergedEventsResult, SetlistHistoryProxyResponse, SetlistItem } from '../types/music'
import { allSourcesFailed, fetchMergedArtistEvents } from '../utils/events'

/** Cached loaders shared by the artist and show pages. */
export const useArtistData = () => {
  const cacheStore = useMusicCacheStore()

  const loadArtistUpcoming = async (artistName: string): Promise<MergedEventsResult> => {
    const cached = cacheStore.getArtistUpcoming(artistName)
    if (cached) return cached
    const result = await fetchMergedArtistEvents(artistName)
    if (!allSourcesFailed(result)) cacheStore.setArtistUpcoming(artistName, result)
    return result
  }

  const loadSetlistHistory = async (artistName: string): Promise<SetlistItem[]> => {
    const cached = cacheStore.getSetlistHistory(artistName)
    if (cached) return cached
    const { setlist } = await $fetch<SetlistHistoryProxyResponse>('/api/setlist-history', { query: { artistName } })
    cacheStore.setSetlistHistory(artistName, setlist)
    return setlist
  }

  return { loadArtistUpcoming, loadSetlistHistory }
}
