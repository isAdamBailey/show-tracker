import type { SgEventsProxyResponse } from '../../app/types/music'
import { readAllowedQuery, readRequiredString, toUpstreamError } from '../utils/http'
import { fetchSeatGeekGenreEvents } from '../utils/seatgeek-events'

export default defineEventHandler(async (event): Promise<SgEventsProxyResponse> => {
  const genre = readRequiredString(readAllowedQuery(event, ['genre']), 'genre')

  const config = useRuntimeConfig(event)
  if (!config.seatgeekClientId) {
    return { events: [], configured: false }
  }

  try {
    return { events: await fetchSeatGeekGenreEvents(genre, config.seatgeekClientId), configured: true }
  } catch (error: unknown) {
    throw toUpstreamError(error, 'SeatGeek upstream request failed.')
  }
})
