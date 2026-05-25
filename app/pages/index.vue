<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ShowSetlistButton from '../components/ShowSetlistButton.vue'
import { useMusicCacheStore } from '../stores/music-cache'
import type { LocalDiscoveryLookup } from '../utils/query-keys'
import type { TicketmasterEvent, TmDiscoveryProxyResponse } from '../types/music'

const FALLBACK_DMA_ID = '37'
const DEFAULT_LOOKUP: LocalDiscoveryLookup = { dmaId: FALLBACK_DMA_ID }

const musicCacheStore = useMusicCacheStore()

const events = ref<TicketmasterEvent[]>([])
const loading = ref<boolean>(true)
const errorMessage = ref<string | null>(null)

const getArtistNameFromEvent = (event: TicketmasterEvent): string | null => {
  const artistName = event._embedded?.attractions?.[0]?.name
  return artistName ?? null
}

const getArtistRoute = (event: TicketmasterEvent): string | null => {
  const artistName = getArtistNameFromEvent(event)
  if (!artistName) {
    return null
  }
  return `/show/${encodeURIComponent(event.id)}?artistName=${encodeURIComponent(artistName)}`
}

const fetchLocalEvents = async (): Promise<void> => {
  loading.value = true
  errorMessage.value = null

  const cachedEvents = musicCacheStore.getLocalDiscovery(DEFAULT_LOOKUP)
  if (cachedEvents) {
    events.value = cachedEvents
    loading.value = false
    return
  }

  try {
    const response = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', {
      query: { dmaId: FALLBACK_DMA_ID }
    })
    events.value = response._embedded.events
    musicCacheStore.setLocalDiscovery(DEFAULT_LOOKUP, response._embedded.events)
  } catch {
    events.value = []
    errorMessage.value = 'Unable to load local events right now.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchLocalEvents()
})
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">Local Upcoming Music</h1>
      <p class="text-sm text-slate-400">Showing events for Portland/Vancouver metro.</p>
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
        @click="fetchLocalEvents"
      >
        Retry
      </button>
    </section>

    <section
      v-else-if="events.length === 0"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      Enter an artist and optional city above to find shows.
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

          <ShowSetlistButton :to="getArtistRoute(event)" />
        </article>
      </div>
    </section>
  </main>
</template>
