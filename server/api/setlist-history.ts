import type { SetlistHistoryProxyResponse, SetlistHistoryResponse } from '../../app/types/music'
import { foldText } from '#shared/utils/text'
import { readAllowedQuery, readRequiredString, toUpstreamError } from '../utils/http'

const SETLIST_FM_BASE = 'https://api.setlist.fm/rest/1.0'
const MBID_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MBID_CACHE_MAX_ENTRIES = 500

interface SetlistArtistSearchResponse {
  artist?: Array<{ mbid?: string; name?: string }>
}

/** Folded artist name -> setlist.fm MBID (null when no exact artist exists). Artist ids rarely change. */
const mbidCache = new Map<string, { mbid: string | null; expiresAt: number }>()

const normalizeSetlistResponse = (response: SetlistHistoryResponse): SetlistHistoryProxyResponse => {
  const setlists = response.setlist
  if (!setlists) {
    return { setlist: [] }
  }
  return { setlist: Array.isArray(setlists) ? setlists : [setlists] }
}

const resolveArtistMbid = async (
  artistName: string,
  headers: Record<string, string>
): Promise<string | null> => {
  const key = foldText(artistName)
  const cached = mbidCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.mbid
  }

  const search = await $fetch<SetlistArtistSearchResponse>(`${SETLIST_FM_BASE}/search/artists`, {
    query: { artistName, sort: 'relevance' },
    headers
  }).catch(() => null)
  if (!search) {
    // Don't cache a failed lookup; the next request retries it.
    return null
  }

  const mbid = (search.artist ?? []).find((artist) => artist.mbid && foldText(artist.name) === key)?.mbid ?? null
  if (mbidCache.size >= MBID_CACHE_MAX_ENTRIES) {
    mbidCache.delete(mbidCache.keys().next().value!)
  }
  mbidCache.set(key, { mbid, expiresAt: Date.now() + MBID_CACHE_TTL_MS })
  return mbid
}

export default defineEventHandler(async (event): Promise<SetlistHistoryProxyResponse> => {
  const config = useRuntimeConfig(event)
  if (!config.setlistFmKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing setlist.fm API key configuration.'
    })
  }

  const artistName = readRequiredString(readAllowedQuery(event, ['artistName']), 'artistName')
  const headers = {
    Accept: 'application/json',
    'x-api-key': config.setlistFmKey
  }

  try {
    // setlist.fm's artistName search is fuzzy and often returns only tribute acts,
    // so resolve the exact artist first and read that artist's setlists.
    const mbid = await resolveArtistMbid(artistName, headers)
    if (mbid) {
      const response = await $fetch<SetlistHistoryResponse>(
        `${SETLIST_FM_BASE}/artist/${encodeURIComponent(mbid)}/setlists`,
        { query: { p: 1 }, headers }
      )
      return normalizeSetlistResponse(response)
    }

    const response = await $fetch<SetlistHistoryResponse>(`${SETLIST_FM_BASE}/search/setlists`, {
      query: { artistName },
      headers
    })
    const wanted = foldText(artistName)
    return { setlist: normalizeSetlistResponse(response).setlist.filter((item) => foldText(item.artist?.name) === wanted) }
  } catch (error: unknown) {
    // setlist.fm answers 404 when an artist has no setlists at all.
    if ((error as { statusCode?: number })?.statusCode === 404) {
      return { setlist: [] }
    }
    throw toUpstreamError(error, 'setlist.fm upstream request failed.')
  }
})
