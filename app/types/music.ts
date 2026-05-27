export interface TicketmasterVenue {
  name?: string
  city?: { name?: string }
  country?: { name?: string }
  location?: {
    latitude?: string
    longitude?: string
  }
}

export interface TicketmasterAttraction {
  name: string
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
  _embedded?: {
    venues?: TicketmasterVenue[]
    attractions?: TicketmasterAttraction[]
  }
}

export interface TmDiscoveryResponse {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
}

export interface TmDiscoveryProxyResponse {
  _embedded: {
    events: TicketmasterEvent[]
  }
}

export interface SeatGeekVenue {
  name?: string
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
  genres?: Array<{ slug?: string; name?: string }>
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
    country?: {
      name?: string
    }
  }
}

export interface SetlistSong {
  name?: string
}

export interface SetlistSet {
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
