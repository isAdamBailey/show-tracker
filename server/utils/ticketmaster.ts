import type { TicketmasterEvent } from '../../app/types/music'

/** Ticketmaster's payload keeps doors on `doorsTimes`; the app reads a flat `doorsTime`. */
export type RawTicketmasterEvent = TicketmasterEvent & { doorsTimes?: { localTime?: string } }

export const normalizeTicketmasterEvent = ({ doorsTimes, ...event }: RawTicketmasterEvent): TicketmasterEvent => ({
  ...event,
  source: 'ticketmaster',
  doorsTime: doorsTimes?.localTime?.slice(0, 5)
})
