import type { TmDiscoveryProxyResponse, TmDiscoveryResponse } from '../../app/types/music'
import { readAllowedQuery, readOptionalString, toUpstreamError } from '../utils/http'
import { normalizeTicketmasterEvent } from '../utils/ticketmaster'

// Ticketmaster caps size at 200. Dates must have no fractional seconds.
const QUERY_RULES = {
  geoPoint: [/^[0-9bcdefghjkmnpqrstuvwxyz]+$/i, 'geoPoint must be a valid geohash string.'],
  keyword: [/^.{1,120}$/, 'keyword must be at most 120 characters.'],
  classificationName: [/^.{1,120}$/, 'classificationName must be at most 120 characters.'],
  radius: [/^\d{1,4}$/, 'radius must be a whole number.'],
  unit: [/^miles$/, 'unit must be miles.'],
  sort: [/^date,asc$/, 'sort must be date,asc.'],
  segmentName: [/^Music$/, 'segmentName must be Music.'],
  startDateTime: [/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 'startDateTime must be formatted as YYYY-MM-DDTHH:mm:ssZ.'],
  endDateTime: [/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 'endDateTime must be formatted as YYYY-MM-DDTHH:mm:ssZ.'],
  size: [/^([1-9]\d?|1\d\d|200)$/, 'size must be a whole number from 1 to 200.'],
  page: [/^\d{1,2}$/, 'page must be a whole number.']
} satisfies Record<string, [RegExp, string]>

type AllowedQueryKey = keyof typeof QUERY_RULES
const ALLOWED_QUERY_KEYS = Object.keys(QUERY_RULES) as AllowedQueryKey[]

export default defineEventHandler(async (event): Promise<TmDiscoveryProxyResponse> => {
  const config = useRuntimeConfig(event)
  if (!config.ticketmasterApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing Ticketmaster API key configuration.'
    })
  }

  const rawQuery = readAllowedQuery(event, ALLOWED_QUERY_KEYS)
  const query: Partial<Record<AllowedQueryKey, string>> = {}
  for (const key of ALLOWED_QUERY_KEYS) {
    const value = readOptionalString(rawQuery, key)
    if (value === undefined) continue
    const [pattern, message] = QUERY_RULES[key]
    if (!pattern.test(value)) {
      throw createError({ statusCode: 400, statusMessage: message })
    }
    query[key] = value
  }

  if (Object.keys(query).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one allowed query parameter is required.'
    })
  }

  try {
    const response = await $fetch<TmDiscoveryResponse>('https://app.ticketmaster.com/discovery/v2/events.json', {
      query: { ...query, apikey: config.ticketmasterApiKey }
    })
    return {
      _embedded: { events: (response._embedded?.events ?? []).map(normalizeTicketmasterEvent) },
      page: response.page
    }
  } catch (error: unknown) {
    throw toUpstreamError(error, 'Ticketmaster upstream request failed.')
  }
})
