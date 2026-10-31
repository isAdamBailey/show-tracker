const runtimeEnv = [
  ['TICKETMASTER_API_KEY', 'NUXT_TICKETMASTER_API_KEY'],
  ['SETLIST_FM_KEY', 'NUXT_SETLIST_FM_KEY'],
  ['SEATGEEK_CLIENT_ID', 'NUXT_SEATGEEK_CLIENT_ID']
]

for (const [source, target] of runtimeEnv) {
  const value = process.env[source]

  if (!value) {
    throw new Error(`Required Nuxt runtime variable is missing: ${source}`)
  }

  process.env[target] = value
}
