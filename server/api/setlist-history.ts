import type { SetlistHistoryProxyResponse, SetlistHistoryResponse } from '~/app/types/music'

interface SetlistQuery {
  artistName: string
}

const extractQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'artistName must be provided only once.'
    })
  }
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const getValidatedQuery = (query: Record<string, string | string[] | undefined>): SetlistQuery => {
  const keys = Object.keys(query)
  const invalidKey = keys.find((key) => key !== 'artistName')

  if (invalidKey) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported query parameter: ${invalidKey}`
    })
  }

  const artistName = extractQueryValue(query.artistName)

  if (!artistName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'artistName is required.'
    })
  }

  return { artistName }
}

const normalizeSetlistResponse = (
  response: SetlistHistoryResponse
): SetlistHistoryProxyResponse => {
  const setlists = response.setlist
  if (!setlists) {
    return { setlist: [] }
  }

  return { setlist: Array.isArray(setlists) ? setlists : [setlists] }
}

const isUpstreamError = (
  error: unknown
): error is { statusCode?: number; statusMessage?: string; message?: string } => {
  return typeof error === 'object' && error !== null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.setlistFmKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing setlist.fm API key configuration.'
    })
  }

  const query = getValidatedQuery(getQuery(event))

  try {
    const upstreamResponse = await $fetch<SetlistHistoryResponse>(
      'https://api.setlist.fm/rest/1.0/search/setlists',
      {
        query,
        headers: {
          Accept: 'application/json',
          'x-api-key': config.setlistFmKey
        }
      }
    )

    return normalizeSetlistResponse(upstreamResponse)
  } catch (error: unknown) {
    if (isUpstreamError(error)) {
      throw createError({
        statusCode: error.statusCode ?? 502,
        statusMessage: error.statusMessage || error.message || 'setlist.fm upstream request failed.'
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'setlist.fm upstream request failed.'
    })
  }
})
