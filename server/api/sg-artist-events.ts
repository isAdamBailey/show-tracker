import type { SgEventsProxyResponse } from '../../app/types/music'
import { readAllowedQuery, readRequiredString, toUpstreamError } from '../utils/http'
import { fetchSeatGeekArtistEvents } from '../utils/seatgeek-events'

export default defineEventHandler(async (event): Promise<SgEventsProxyResponse> => {
  const artistName = readRequiredString(readAllowedQuery(event, ['artistName']), 'artistName')

  const config = useRuntimeConfig(event)
  if (!config.seatgeekClientId) {
    return { events: [], configured: false }
  }

  try {
    return { events: await fetchSeatGeekArtistEvents(artistName, config.seatgeekClientId), configured: true }
  } catch (error: unknown) {
    throw toUpstreamError(error, 'SeatGeek upstream request failed.')
  }
})
