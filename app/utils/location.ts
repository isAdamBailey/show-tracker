import type { TicketmasterEvent } from '../types/music'
import type { LocationState } from '../stores/music-cache'

export interface Coordinates {
  latitude: number
  longitude: number
}

export const PORTLAND_COORDINATES: Coordinates = {
  latitude: 45.5152,
  longitude: -122.6784
}

const EARTH_RADIUS_MILES = 3958.8
const DEFAULT_RADIUS_MILES = 100
const PORTLAND_FALLBACK_CITY = 'portland'

const degreesToRadians = (value: number): number => {
  return (value * Math.PI) / 180
}

const parseCoordinateValue = (value: string | undefined): number | null => {
  if (!value) {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const getEventCoordinates = (event: TicketmasterEvent): Coordinates | null => {
  const venueLocation = event._embedded?.venues?.[0]?.location
  const latitude = parseCoordinateValue(venueLocation?.latitude)
  const longitude = parseCoordinateValue(venueLocation?.longitude)

  if (latitude === null || longitude === null) {
    return null
  }

  return { latitude, longitude }
}

export const getDistanceInMiles = (from: Coordinates, to: Coordinates): number => {
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude)
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude)

  const fromLatitudeRadians = degreesToRadians(from.latitude)
  const toLatitudeRadians = degreesToRadians(to.latitude)

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) * Math.cos(toLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MILES * c
}

export const resolveSearchCenter = (location: LocationState): Coordinates => {
  if (location.selectedCity === 'portland') {
    return PORTLAND_COORDINATES
  }

  if (location.source === 'geoPoint' && location.latitude !== null && location.longitude !== null) {
    return {
      latitude: location.latitude,
      longitude: location.longitude
    }
  }

  return PORTLAND_COORDINATES
}

export const resolveCityFallback = (location: LocationState): string | null => {
  if (location.selectedCity) {
    return normalizeCityName(location.selectedCity)
  }

  if (location.dmaId === '37' || location.source === 'dmaId') {
    return PORTLAND_FALLBACK_CITY
  }
  return null
}

const normalizeCityName = (value: string | undefined): string => {
  if (!value) {
    return ''
  }
  return value.trim().toLowerCase()
}

export const filterEventsWithinRadius = (
  events: TicketmasterEvent[],
  center: Coordinates,
  radiusMiles = DEFAULT_RADIUS_MILES,
  cityFallback: string | null = null
): TicketmasterEvent[] => {
  const normalizedFallbackCity = normalizeCityName(cityFallback ?? undefined)

  return events.filter((event) => {
    const eventCoordinates = getEventCoordinates(event)
    if (eventCoordinates) {
      return getDistanceInMiles(center, eventCoordinates) <= radiusMiles
    }

    if (!normalizedFallbackCity) {
      return false
    }

    const venueCity = normalizeCityName(event._embedded?.venues?.[0]?.city?.name)
    return venueCity === normalizedFallbackCity
  })
}
