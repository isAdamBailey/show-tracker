import type { TicketmasterEvent } from '../../../app/types/music'
import { toUpstreamError } from '../../utils/http'
import { SEATGEEK_ID_PREFIX, fetchSeatGeekEventById } from '../../utils/seatgeek-events'
import { normalizeTicketmasterEvent, type RawTicketmasterEvent } from '../../utils/ticketmaster'

export default defineEventHandler(async (event): Promise<TicketmasterEvent> => {
  const id = getRouterParam(event, 'id')?.trim() ?? ''
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid event id is required.' })
  }

  const config = useRuntimeConfig(event)

  try {
    if (id.startsWith(SEATGEEK_ID_PREFIX)) {
      if (!config.seatgeekClientId) {
        throw createError({ statusCode: 404, statusMessage: 'SeatGeek is not configured.' })
      }
      return await fetchSeatGeekEventById(id.slice(SEATGEEK_ID_PREFIX.length), config.seatgeekClientId)
    }

    if (!config.ticketmasterApiKey) {
      throw createError({ statusCode: 500, statusMessage: 'Missing Ticketmaster API key configuration.' })
    }

    const tmEvent = await $fetch<RawTicketmasterEvent>(
      `https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(id)}.json`,
      { query: { apikey: config.ticketmasterApiKey } }
    )
    return normalizeTicketmasterEvent(tmEvent)
  } catch (error: unknown) {
    throw toUpstreamError(error, 'Event lookup failed.')
  }
})
