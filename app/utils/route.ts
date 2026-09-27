/** First string value of a route param or query entry ("" when absent). */
export const readRouteValue = (value: unknown): string => {
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first : ''
}
