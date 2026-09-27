import type { H3Event } from 'h3'

type RawQuery = Record<string, unknown>

const badRequest = (statusMessage: string): never => {
  throw createError({ statusCode: 400, statusMessage })
}

/** Rejects any query key outside `allowed`, then returns the raw query. */
export const readAllowedQuery = (event: H3Event, allowed: readonly string[]): RawQuery => {
  const query = getQuery(event) as RawQuery
  const invalidKey = Object.keys(query).find((key) => !allowed.includes(key))
  if (invalidKey) badRequest(`Unsupported query parameter: ${invalidKey}`)
  return query
}

/** A single, trimmed, non-empty string, or undefined when absent. */
export const readOptionalString = (query: RawQuery, key: string): string | undefined => {
  const value = query[key]
  if (Array.isArray(value)) badRequest(`${key} must be provided only once.`)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const readRequiredString = (query: RawQuery, key: string): string =>
  readOptionalString(query, key) ?? badRequest(`${key} is required.`)

export const readNumberInRange = (query: RawQuery, key: string, min: number, max: number): number => {
  const parsed = Number(readRequiredString(query, key))
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    badRequest(`${key} must be a number between ${min} and ${max}.`)
  }
  return parsed
}

/** Rethrow an upstream $fetch failure as an H3 error, keeping its status when it has one. */
export const toUpstreamError = (error: unknown, fallbackMessage: string) => {
  const upstream = (typeof error === 'object' && error !== null ? error : {}) as {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
  return createError({
    statusCode: upstream.statusCode ?? 502,
    statusMessage: upstream.statusMessage || upstream.message || fallbackMessage
  })
}
