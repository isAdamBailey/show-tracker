<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { encode as encodeGeoHash } from 'ngeohash'
import { useMusicCacheStore, type LocationPermissionState } from '~/app/stores/music-cache'
import type { LocalDiscoveryLookup } from '~/app/utils/query-keys'
import type { TicketmasterEvent, TmDiscoveryProxyResponse } from '~/app/types/music'

const FALLBACK_DMA_ID = '37'
const EVENT_GEOHASH_PRECISION = 9

const musicCacheStore = useMusicCacheStore()

const events = ref<TicketmasterEvent[]>([])
const loading = ref<boolean>(true)
const errorMessage = ref<string | null>(null)
const activeLookup = ref<LocalDiscoveryLookup>({ dmaId: FALLBACK_DMA_ID })

const getArtistNameFromEvent = (event: TicketmasterEvent): string | null => {
  const artistName = event._embedded?.attractions?.[0]?.name
  return artistName ?? null
}

const getArtistRoute = (event: TicketmasterEvent): string | null => {
  const artistName = getArtistNameFromEvent(event)
  if (!artistName) {
    return null
  }
  return `/artist/${encodeURIComponent(artistName)}`
}

const getLookupLabel = (lookup: LocalDiscoveryLookup): string => {
  if (lookup.geoPoint) {
    return 'your current location'
  }
  if (lookup.dmaId) {
    return 'Portland/Vancouver metro'
  }
  return 'local area'
}

const fetchLocalEvents = async (lookup: LocalDiscoveryLookup): Promise<void> => {
  loading.value = true
  errorMessage.value = null
  activeLookup.value = lookup

  const cachedEvents = musicCacheStore.getLocalDiscovery(lookup)
  if (cachedEvents) {
    events.value = cachedEvents
    loading.value = false
    return
  }

  try {
    const query = lookup.geoPoint
      ? { geoPoint: lookup.geoPoint }
      : { dmaId: lookup.dmaId ?? FALLBACK_DMA_ID }
    const response = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', { query })
    const fetchedEvents = response._embedded.events
    events.value = fetchedEvents
    musicCacheStore.setLocalDiscovery(lookup, fetchedEvents)
  } catch {
    events.value = []
    errorMessage.value = 'Unable to load local events right now.'
  } finally {
    loading.value = false
  }
}

const fetchWithFallbackDma = async (permission: LocationPermissionState): Promise<void> => {
  musicCacheStore.setLocationByDmaId(FALLBACK_DMA_ID, permission)
  await fetchLocalEvents({ dmaId: FALLBACK_DMA_ID })
}

const isPermissionDeniedError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false
  }
  const code = (error as { code?: number }).code
  return code === 1
}

const requestGeolocation = async (): Promise<void> => {
  if (!navigator.geolocation) {
    await fetchWithFallbackDma('unavailable')
    return
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      })
    })
    const geoPoint = encodeGeoHash(
      position.coords.latitude,
      position.coords.longitude,
      EVENT_GEOHASH_PRECISION
    )
    musicCacheStore.setLocationByGeoPoint(geoPoint)
    await fetchLocalEvents({ geoPoint })
  } catch (error: unknown) {
    if (isPermissionDeniedError(error)) {
      await fetchWithFallbackDma('denied')
      return
    }
    await fetchWithFallbackDma('unavailable')
  }
}

onMounted(async () => {
  await requestGeolocation()
})
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">Local Upcoming Music</h1>
      <p class="text-sm text-slate-400">
        Showing events for {{ getLookupLabel(activeLookup) }} via Ticketmaster Discovery.
      </p>
    </header>

    <section
      v-if="loading"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      Loading local events...
    </section>

    <section
      v-else-if="errorMessage"
      class="rounded-lg border border-red-800 bg-red-950/40 p-5 text-sm text-red-200"
    >
      <p>{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
        @click="fetchLocalEvents(activeLookup)"
      >
        Retry
      </button>
    </section>

    <section
      v-else-if="events.length === 0"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      No upcoming local music events found.
    </section>

    <section v-else class="space-y-3">
      <h2 class="text-xl font-medium text-slate-100">Upcoming Events</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="event in events"
          :key="event.id"
          class="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
        >
          <h3 class="text-base font-medium text-slate-100">{{ event.name }}</h3>
          <p class="mt-1 text-sm text-slate-300">
            {{ event.dates?.start?.localDate ?? 'Unknown date' }}
            <span v-if="event.dates?.start?.localTime"> • {{ event.dates.start.localTime }}</span>
          </p>
          <p class="text-xs text-slate-400">
            {{ event._embedded?.venues?.[0]?.name ?? 'Unknown venue' }}
            <span v-if="event._embedded?.venues?.[0]?.city?.name">
              • {{ event._embedded?.venues?.[0]?.city?.name }}
            </span>
            <span v-if="event._embedded?.venues?.[0]?.country?.name">
              , {{ event._embedded?.venues?.[0]?.country?.name }}
            </span>
          </p>

          <NuxtLink
            v-if="getArtistRoute(event)"
            :to="getArtistRoute(event) || ''"
            class="mt-3 inline-block text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            View artist history
          </NuxtLink>
          <p v-else class="mt-3 text-xs text-slate-500">
            Artist history unavailable for this event.
          </p>
        </article>
      </div>
    </section>
  </main>
</template>
