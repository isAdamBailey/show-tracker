import type { SgEventsProxyResponse } from '../../app/types/music'
import { fetchSeatGeekArtistEvents } from '../utils/seatgeek-events'

interface SgArtistEventsQuery {
  artistName: string
  city?: string
}

const extractQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query parameters must be provided only once.'
    })
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const getValidatedQuery = (
  query: Record<string, string | string[] | undefined>
): SgArtistEventsQuery => {
  const allowedKeys = ['artistName', 'city']
  const invalidKey = Object.keys(query).find((key) => !allowedKeys.includes(key))

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

  return {
    artistName,
    city: extractQueryValue(query.city)
  }
}

const isUpstreamError = (
  error: unknown
): error is { statusCode?: number; statusMessage?: string; message?: string } => {
  return typeof error === 'object' && error !== null
}

export default defineEventHandler(async (event): Promise<SgEventsProxyResponse> => {
  const config = useRuntimeConfig(event)
  if (!config.seatgeekClientId) {
    return { events: [] }
  }

  const validatedQuery = getValidatedQuery(getQuery(event))

  try {
    const events = await fetchSeatGeekArtistEvents(
      validatedQuery.artistName,
      config.seatgeekClientId,
      validatedQuery.city
    )
    return { events }
  } catch (error: unknown) {
    if (isUpstreamError(error)) {
      throw createError({
        statusCode: error.statusCode ?? 502,
        statusMessage: error.statusMessage || error.message || 'SeatGeek upstream request failed.'
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'SeatGeek upstream request failed.'
    })
  }
})
