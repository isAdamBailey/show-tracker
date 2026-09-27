import type { SgEventsProxyResponse } from '../../app/types/music'
import { readAllowedQuery, readNumberInRange, readRequiredString, toUpstreamError } from '../utils/http'
import { fetchSeatGeekLocalEvents } from '../utils/seatgeek-events'

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/
const MAX_RANGE_MILES = 200

const readLocalDateTime = (query: Record<string, unknown>, key: string): string => {
  const value = readRequiredString(query, key)
  if (!LOCAL_DATE_TIME_PATTERN.test(value)) {
    throw createError({ statusCode: 400, statusMessage: `${key} must be formatted as YYYY-MM-DDTHH:mm:ss.` })
  }
  return value
}

export default defineEventHandler(async (event): Promise<SgEventsProxyResponse> => {
  const query = readAllowedQuery(event, ['lat', 'lon', 'range', 'start', 'end'])
  const localQuery = {
    lat: readNumberInRange(query, 'lat', -90, 90),
    lon: readNumberInRange(query, 'lon', -180, 180),
    rangeMiles: readNumberInRange(query, 'range', 1, MAX_RANGE_MILES),
    start: readLocalDateTime(query, 'start'),
    end: readLocalDateTime(query, 'end')
  }

  const config = useRuntimeConfig(event)
  if (!config.seatgeekClientId) {
    return { events: [], configured: false }
  }

  try {
    return { events: await fetchSeatGeekLocalEvents(localQuery, config.seatgeekClientId), configured: true }
  } catch (error: unknown) {
    throw toUpstreamError(error, 'SeatGeek upstream request failed.')
  }
})
