import { ref } from 'vue'
import ngeohash from 'ngeohash'

interface NominatimResponse {
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
  }
}

export const FALLBACK_GEOPOINT = 'c20fbr' // Portland, OR

const userGeoPoint = ref<string>(FALLBACK_GEOPOINT)
const userCity = ref<string>('')

const resolveCityFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    const data = await $fetch<NominatimResponse>('https://nominatim.openstreetmap.org/reverse', {
      query: { format: 'json', lat, lon },
      headers: { 'Accept-Language': 'en' }
    })
    return data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? ''
  } catch {
    return ''
  }
}

export const useUserLocation = () => {
  const detectLocation = (): void => {
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const geoPoint = ngeohash.encode(latitude, longitude, 6)
        userGeoPoint.value = geoPoint

        const city = await resolveCityFromCoords(latitude, longitude)
        if (city) userCity.value = city
      },
      () => {},
      { timeout: 6000 }
    )
  }

  return { userGeoPoint, userCity, detectLocation }
}
