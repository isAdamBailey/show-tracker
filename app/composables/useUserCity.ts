import { computed } from 'vue'
import ngeohash from 'ngeohash'
import { FALLBACK_CITY, distanceMiles, getNearestCities, type CityOption } from '../data/cities'

interface NominatimResponse {
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
  }
}

/** detected: from the browser; manual: picked by the user; default: detection failed or timed out. */
export type CitySource = 'detected' | 'manual' | 'default'

export type UserCity = CityOption & { source: CitySource }

const STORAGE_KEY = 'lmt:city'
const DETECTION_TIMEOUT_MS = 6000
const NEAR_LISTED_CITY_MILES = 30

const resolveCityFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    const data = await $fetch<NominatimResponse>('https://nominatim.openstreetmap.org/reverse', {
      query: { format: 'json', lat, lon },
      headers: { 'Accept-Language': 'en' },
      timeout: 4000
    })
    return data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? ''
  } catch {
    return ''
  }
}

const nearestListedCityName = (lat: number, lon: number): string | null => {
  const [nearest] = getNearestCities({ lat, lon }, 1, -1)
  return nearest && distanceMiles({ lat, lon }, nearest) <= NEAR_LISTED_CITY_MILES ? nearest.name : null
}

const readStoredCity = (): UserCity | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<UserCity>
    if (typeof parsed.name !== 'string' || typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') {
      return null
    }
    return { name: parsed.name, lat: parsed.lat, lon: parsed.lon, source: 'manual' }
  } catch {
    return null
  }
}

const writeStoredCity = (city: CityOption | null): void => {
  try {
    if (city) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: city.name, lat: city.lat, lon: city.lon }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this session only.
  }
}

export const useUserLocation = () => {
  const userCity = useState<UserCity | null>('user-city', () => null)
  /** True once a city is known: stored, detected, or the default after the timeout. */
  const locationResolved = useState<boolean>('user-city-resolved', () => false)
  const detecting = useState<boolean>('user-city-detecting', () => false)

  const userGeoPoint = computed<string | null>(() =>
    userCity.value ? ngeohash.encode(userCity.value.lat, userCity.value.lon, 7) : null
  )

  const applyDefault = (): void => {
    userCity.value = { ...FALLBACK_CITY, source: 'default' }
    locationResolved.value = true
  }

  const detectLocation = (): void => {
    if (!import.meta.client) return

    if (!('geolocation' in navigator)) {
      if (!locationResolved.value) applyDefault()
      return
    }

    detecting.value = true
    // The browser's own timeout only starts once the permission prompt is answered,
    // so the gate runs on its own timer.
    const gate = window.setTimeout(() => {
      if (!locationResolved.value) applyDefault()
    }, DETECTION_TIMEOUT_MS)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const name =
          (await resolveCityFromCoords(latitude, longitude)) ||
          nearestListedCityName(latitude, longitude) ||
          'your area'
        window.clearTimeout(gate)
        detecting.value = false
        // A manual pick made while detection was in flight wins.
        if (userCity.value?.source === 'manual') return
        userCity.value = { name, lat: latitude, lon: longitude, source: 'detected' }
        locationResolved.value = true
      },
      () => {
        window.clearTimeout(gate)
        detecting.value = false
        if (userCity.value?.source !== 'manual') applyDefault()
      },
      { timeout: DETECTION_TIMEOUT_MS, maximumAge: 10 * 60 * 1000 }
    )
  }

  /** Call once on the client: a saved manual city skips detection entirely. */
  const initLocation = (): void => {
    if (!import.meta.client || locationResolved.value) return
    const stored = readStoredCity()
    if (stored) {
      userCity.value = stored
      locationResolved.value = true
      return
    }
    detectLocation()
  }

  const setManualCity = (city: CityOption): void => {
    writeStoredCity(city)
    userCity.value = { name: city.name, lat: city.lat, lon: city.lon, source: 'manual' }
    locationResolved.value = true
  }

  const useMyLocation = (): void => {
    writeStoredCity(null)
    if (userCity.value) userCity.value = { ...userCity.value, source: 'default' }
    detectLocation()
  }

  return {
    userCity,
    userGeoPoint,
    locationResolved,
    detecting,
    initLocation,
    setManualCity,
    useMyLocation
  }
}
