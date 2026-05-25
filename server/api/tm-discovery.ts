import type { TmDiscoveryProxyResponse, TmDiscoveryResponse } from '../../app/types/music'

const ALLOWED_QUERY_KEYS = ['geoPoint', 'dmaId', 'keyword', 'classificationName'] as const

type AllowedQueryKey = (typeof ALLOWED_QUERY_KEYS)[number]
type AllowedQuery = Partial<Record<AllowedQueryKey, string>>

const ensureSingleString = (
  value: string | string[] | undefined,
  key: AllowedQueryKey
): string | undefined => {
  if (Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Query parameter "${key}" must be provided only once.`
    })
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const getValidatedQuery = (query: Record<string, string | string[] | undefined>): AllowedQuery => {
  const invalidKey = Object.keys(query).find(
    (key) => !ALLOWED_QUERY_KEYS.includes(key as AllowedQueryKey)
  )
  if (invalidKey) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported query parameter: ${invalidKey}`
    })
  }

  const validated: AllowedQuery = {}
  for (const key of ALLOWED_QUERY_KEYS) {
    const value = ensureSingleString(query[key], key)
    if (value) {
      validated[key] = value
    }
  }

  if (Object.keys(validated).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one allowed query parameter is required.'
    })
  }

  if (validated.dmaId && !/^\d+$/.test(validated.dmaId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dmaId must be numeric.'
    })
  }

  if (validated.geoPoint && !/^[0-9bcdefghjkmnpqrstuvwxyz]+$/i.test(validated.geoPoint)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'geoPoint must be a valid geohash string.'
    })
  }

  return validated
}

const normalizeTmResponse = (response: TmDiscoveryResponse): TmDiscoveryProxyResponse => ({
  _embedded: {
    events: response._embedded?.events ?? []
  }
})

const isUpstreamError = (
  error: unknown
): error is { statusCode?: number; statusMessage?: string; message?: string } => {
  return typeof error === 'object' && error !== null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.ticketmasterApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing Ticketmaster API key configuration.'
    })
  }

  const query = getQuery(event)
  const validatedQuery = getValidatedQuery(query)

  try {
    const upstreamResponse = await $fetch<TmDiscoveryResponse>(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      {
        query: {
          ...validatedQuery,
          apikey: config.ticketmasterApiKey
        }
      }
    )

    return normalizeTmResponse(upstreamResponse)
  } catch (error: unknown) {
    if (isUpstreamError(error)) {
      throw createError({
        statusCode: error.statusCode ?? 502,
        statusMessage:
          error.statusMessage || error.message || 'Ticketmaster upstream request failed.'
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Ticketmaster upstream request failed.'
    })
  }
})
