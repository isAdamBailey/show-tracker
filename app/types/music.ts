export interface TicketmasterVenue {
  id?: string
  name?: string
  city?: { name?: string }
  state?: { name?: string; stateCode?: string }
  country?: { name?: string; countryCode?: string }
  address?: { line1?: string }
  location?: {
    latitude?: string
    longitude?: string
  }
}

export interface TicketmasterAttraction {
  id?: string
  name: string
}

export interface TicketmasterPriceRange {
  min?: number
  max?: number
  currency?: string
}

export interface TicketmasterEventClassification {
  segment?: { name?: string }
  genre?: { name?: string }
  subGenre?: { name?: string }
}

export type EventSource = 'ticketmaster' | 'seatgeek'

export interface TicketmasterEvent {
  id: string
  name: string
  source?: EventSource
  url?: string
  dates?: {
    start?: {
      localDate?: string
      localTime?: string
      dateTime?: string
    }
  }
  /** Doors time ("HH:mm"), when the source provides one. */
  doorsTime?: string
  priceRanges?: TicketmasterPriceRange[]
  classifications?: TicketmasterEventClassification[]
  _embedded?: {
    venues?: TicketmasterVenue[]
    attractions?: TicketmasterAttraction[]
  }
}

export interface TmPage {
  size?: number
  totalElements?: number
  totalPages?: number
  number?: number
}

export interface TmDiscoveryResponse {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
  page?: TmPage
}

export interface TmDiscoveryProxyResponse {
  _embedded: {
    events: TicketmasterEvent[]
  }
  page?: TmPage
}

export interface TmAttraction {
  id: string
  name: string
  upcomingEvents?: { _total?: number }
  classifications?: TicketmasterEventClassification[]
}

export interface TmAttractionsResponse {
  _embedded?: {
    attractions?: TmAttraction[]
  }
}

export interface SuggestArtist {
  id: string
  name: string
  upcoming: number
}

export interface SuggestGenre {
  name: string
  /** Nationwide upcoming show count, when Ticketmaster answered. */
  count?: number
}

export interface SuggestResponse {
  artists: SuggestArtist[]
  genres: SuggestGenre[]
}

export type SourceStatus = 'ok' | 'failed' | 'unconfigured'

export interface MergedEventsResult {
  events: TicketmasterEvent[]
  ticketmaster: SourceStatus
  seatgeek: SourceStatus
  /** A source had more results than were fetched, so counts are a floor. */
  truncated?: boolean
  /** Genre search only: Ticketmaster had no such category, so its results are keyword matches. */
  usedKeywordFallback?: boolean
}

export interface SeatGeekVenue {
  id?: number
  name?: string
  address?: string
  city?: string
  state?: string
  country?: string
  location?: {
    lat?: number
    lon?: number
  }
}

export interface SeatGeekPerformer {
  id: number
  name: string
  slug?: string
  type?: string
  primary?: boolean
  num_upcoming_events?: number
  genres?: Array<{ slug?: string; name?: string; primary?: boolean }>
}

export interface SeatGeekEvent {
  id: number
  title: string
  url?: string
  datetime_local?: string
  datetime_utc?: string
  type?: string
  venue?: SeatGeekVenue
  performers?: SeatGeekPerformer[]
  stats?: {
    lowest_price?: number | null
    highest_price?: number | null
  }
}

export interface SeatGeekEventsResponse {
  events?: SeatGeekEvent[]
  meta?: {
    total?: number
    per_page?: number
    page?: number
  }
}

export interface SeatGeekPerformersResponse {
  performers?: SeatGeekPerformer[]
  meta?: {
    total?: number
  }
}

export interface SeatGeekGenresResponse {
  genres?: Array<{ id?: number; name?: string; slug?: string }>
}

export interface SgEventsProxyResponse {
  events: TicketmasterEvent[]
  /** false when SEATGEEK_CLIENT_ID is not set, so the client can tell "unconfigured" from "failed". */
  configured?: boolean
}

export interface TicketmasterClassificationValue {
  name?: string
}

export interface TicketmasterNestedGenre {
  name?: string
  _embedded?: {
    subgenres?: TicketmasterNestedGenre[]
  }
}

export interface TicketmasterClassificationSegment {
  name?: string
  _embedded?: {
    genres?: TicketmasterNestedGenre[]
  }
}

export interface TicketmasterClassification {
  segment?: TicketmasterClassificationValue & TicketmasterClassificationSegment
  genre?: TicketmasterClassificationValue
  subGenre?: TicketmasterClassificationValue
}

export interface TicketmasterClassificationsResponse {
  _embedded?: {
    classifications?: TicketmasterClassification[]
  }
}

export interface TmClassificationListResponse {
  genres: string[]
}

export interface SetlistArtist {
  name?: string
}

export interface SetlistVenue {
  name?: string
  city?: {
    name?: string
    state?: string
    stateCode?: string
    country?: {
      code?: string
      name?: string
    }
  }
}

export interface SetlistSong {
  name?: string
  info?: string
  tape?: boolean
  cover?: { name?: string }
}

export interface SetlistSet {
  name?: string
  encore?: number
  song?: SetlistSong[] | SetlistSong
}

export interface SetlistSets {
  set?: SetlistSet[] | SetlistSet
}

export interface SetlistItem {
  id: string
  eventDate?: string
  tour?: { name?: string }
  artist?: SetlistArtist
  venue?: SetlistVenue
  sets?: SetlistSets
}

export interface SetlistHistoryResponse {
  setlist?: SetlistItem[] | SetlistItem
}

export interface SetlistHistoryProxyResponse {
  setlist: SetlistItem[]
}
