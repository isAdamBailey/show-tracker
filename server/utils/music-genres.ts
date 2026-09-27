import type { TicketmasterClassificationsResponse } from '../../app/types/music'

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export interface MusicGenreList {
  /** Top-level Music genres ("Rock", "Jazz"), which rank first in suggestions. */
  genres: string[]
  subgenres: string[]
}

// Holds the in-flight promise, so concurrent cold requests share one fetch.
let cached: { promise: Promise<MusicGenreList>; expiresAt: number } | null = null

const isUsableName = (name: string | undefined): name is string => {
  const trimmed = name?.trim()
  return Boolean(trimmed) && !['undefined', 'other'].includes(trimmed!.toLowerCase())
}

const fetchMusicGenres = async (apiKey: string): Promise<MusicGenreList> => {
  const response = await $fetch<TicketmasterClassificationsResponse>(
    'https://app.ticketmaster.com/discovery/v2/classifications.json',
    { query: { apikey: apiKey } }
  )

  const genres = new Set<string>()
  const subgenres = new Set<string>()
  for (const classification of response._embedded?.classifications ?? []) {
    if (classification.segment?.name !== 'Music') {
      continue
    }
    for (const genre of classification.segment._embedded?.genres ?? []) {
      if (isUsableName(genre.name)) {
        genres.add(genre.name.trim())
      }
      for (const subgenre of genre._embedded?.subgenres ?? []) {
        if (isUsableName(subgenre.name)) {
          subgenres.add(subgenre.name.trim())
        }
      }
    }
  }

  for (const genre of genres) {
    subgenres.delete(genre)
  }

  return {
    genres: [...genres].sort((left, right) => left.localeCompare(right)),
    subgenres: [...subgenres].sort((left, right) => left.localeCompare(right))
  }
}

/** Ticketmaster's Music-segment genres, cached in memory for a few hours. */
export const getMusicGenres = (apiKey: string): Promise<MusicGenreList> => {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise
  }
  const promise = fetchMusicGenres(apiKey)
  cached = { promise, expiresAt: Date.now() + CACHE_TTL_MS }
  // A failed fetch must not be served for the whole TTL.
  promise.catch(() => {
    if (cached?.promise === promise) cached = null
  })
  return promise
}
