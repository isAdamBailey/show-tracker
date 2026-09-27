export interface CityOption {
  name: string
  lat: number
  lon: number
}

export const CITY_OPTIONS: readonly CityOption[] = [
  { name: 'Atlanta', lat: 33.749, lon: -84.388 },
  { name: 'Austin', lat: 30.2672, lon: -97.7431 },
  { name: 'Baltimore', lat: 39.2904, lon: -76.6122 },
  { name: 'Bend', lat: 44.0582, lon: -121.3153 },
  { name: 'Berkeley', lat: 37.8715, lon: -122.273 },
  { name: 'Boston', lat: 42.3601, lon: -71.0589 },
  { name: 'Calgary', lat: 51.0447, lon: -114.0719 },
  { name: 'Charlotte', lat: 35.2271, lon: -80.8431 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Cincinnati', lat: 39.1031, lon: -84.512 },
  { name: 'Cleveland', lat: 41.4993, lon: -81.6944 },
  { name: 'Columbus', lat: 39.9612, lon: -82.9988 },
  { name: 'Dallas', lat: 32.7767, lon: -96.797 },
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Detroit', lat: 42.3314, lon: -83.0458 },
  { name: 'Edmonton', lat: 53.5461, lon: -113.4938 },
  { name: 'Eugene', lat: 44.0521, lon: -123.0868 },
  { name: 'Houston', lat: 29.7604, lon: -95.3698 },
  { name: 'Indianapolis', lat: 39.7684, lon: -86.1581 },
  { name: 'Kansas City', lat: 39.0997, lon: -94.5786 },
  { name: 'Las Vegas', lat: 36.1699, lon: -115.1398 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Louisville', lat: 38.2527, lon: -85.7585 },
  { name: 'Memphis', lat: 35.1495, lon: -90.049 },
  { name: 'Miami', lat: 25.7617, lon: -80.1918 },
  { name: 'Milwaukee', lat: 43.0389, lon: -87.9065 },
  { name: 'Minneapolis', lat: 44.9778, lon: -93.265 },
  { name: 'Montreal', lat: 45.5019, lon: -73.5674 },
  { name: 'Nashville', lat: 36.1627, lon: -86.7816 },
  { name: 'New Orleans', lat: 29.9511, lon: -90.0715 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Oakland', lat: 37.8044, lon: -122.2712 },
  { name: 'Orlando', lat: 28.5384, lon: -81.3789 },
  { name: 'Philadelphia', lat: 39.9526, lon: -75.1652 },
  { name: 'Phoenix', lat: 33.4484, lon: -112.074 },
  { name: 'Pittsburgh', lat: 40.4406, lon: -79.9959 },
  { name: 'Portland', lat: 45.5152, lon: -122.6784 },
  { name: 'Raleigh', lat: 35.7796, lon: -78.6382 },
  { name: 'Sacramento', lat: 38.5816, lon: -121.4944 },
  { name: 'Salt Lake City', lat: 40.7608, lon: -111.891 },
  { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { name: 'Spokane', lat: 47.6588, lon: -117.426 },
  { name: 'St. Louis', lat: 38.627, lon: -90.1994 },
  { name: 'Tampa', lat: 27.9506, lon: -82.4572 },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
  { name: 'Washington', lat: 38.9072, lon: -77.0369 }
]

export const FALLBACK_CITY: CityOption = CITY_OPTIONS.find((city) => city.name === 'Portland')!

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

/** Great-circle distance in miles. */
export const distanceMiles = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => {
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

/** Listed cities ordered by distance from a point, excluding any within `excludeWithinMiles`. */
export const getNearestCities = (
  point: { lat: number; lon: number },
  count: number,
  excludeWithinMiles = 25
): CityOption[] =>
  CITY_OPTIONS.map((city) => ({ city, miles: distanceMiles(point, city) }))
    .filter(({ miles }) => miles > excludeWithinMiles)
    .sort((left, right) => left.miles - right.miles)
    .slice(0, count)
    .map(({ city }) => city)
