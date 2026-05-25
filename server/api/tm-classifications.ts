import type { TicketmasterClassificationsResponse, TmClassificationListResponse } from '../../app/types/music'

const isUpstreamError = (
  error: unknown
): error is { statusCode?: number; statusMessage?: string; message?: string } => {
  return typeof error === 'object' && error !== null
}

const normalizeGenres = (response: TicketmasterClassificationsResponse): TmClassificationListResponse => {
  const classifications = response._embedded?.classifications ?? []
  const genreSet = new Set<string>()

  for (const item of classifications) {
    const directGenreName = item.genre?.name?.trim()
    if (directGenreName && directGenreName.toLowerCase() !== 'undefined') {
      genreSet.add(directGenreName)
    }

    const nestedGenres = item.segment?._embedded?.genres ?? []
    for (const nestedGenre of nestedGenres) {
      const nestedGenreName = nestedGenre.name?.trim()
      if (nestedGenreName && nestedGenreName.toLowerCase() !== 'undefined') {
        genreSet.add(nestedGenreName)
      }

      const nestedSubGenres = nestedGenre._embedded?.subgenres ?? []
      for (const nestedSubGenre of nestedSubGenres) {
        const nestedSubGenreName = nestedSubGenre.name?.trim()
        if (nestedSubGenreName && nestedSubGenreName.toLowerCase() !== 'undefined') {
          genreSet.add(nestedSubGenreName)
        }
      }
    }
  }

  return {
    genres: Array.from(genreSet).sort((left, right) => left.localeCompare(right))
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  if (Object.keys(query).length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This endpoint does not accept query parameters.'
    })
  }

  const config = useRuntimeConfig(event)
  if (!config.ticketmasterApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing Ticketmaster API key configuration.'
    })
  }

  try {
    const upstreamResponse = await $fetch<TicketmasterClassificationsResponse>(
      'https://app.ticketmaster.com/discovery/v2/classifications.json',
      {
        query: {
          apikey: config.ticketmasterApiKey
        }
      }
    )

    return normalizeGenres(upstreamResponse)
  } catch (error: unknown) {
    if (isUpstreamError(error)) {
      throw createError({
        statusCode: error.statusCode ?? 502,
        statusMessage:
          error.statusMessage || error.message || 'Ticketmaster classifications request failed.'
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Ticketmaster classifications request failed.'
    })
  }
})
