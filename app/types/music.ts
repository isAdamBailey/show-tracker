export interface TicketmasterVenue {
  name?: string
  city?: { name?: string }
  country?: { name?: string }
}

export interface TicketmasterAttraction {
  name: string
}

export interface TicketmasterEvent {
  id: string
  name: string
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
