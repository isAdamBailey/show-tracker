<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ShowSetlistButton from '../components/ShowSetlistButton.vue'
import { useMusicCacheStore } from '../stores/music-cache'
import type { LocalDiscoveryLookup } from '../utils/query-keys'
import type { TicketmasterEvent, TmDiscoveryProxyResponse } from '../types/music'
import { formatShowDate, formatShowTime, getUrgencyLabel } from '../utils/dates'

const FALLBACK_DMA_ID = '37'
const DEFAULT_LOOKUP: LocalDiscoveryLookup = { dmaId: FALLBACK_DMA_ID }

const musicCacheStore = useMusicCacheStore()

const events = ref<TicketmasterEvent[]>([])
const loading = ref<boolean>(true)
const errorMessage = ref<string | null>(null)

const getArtistNameFromEvent = (event: TicketmasterEvent): string | null => {
  return event._embedded?.attractions?.[0]?.name ?? null
}

const getArtistRoute = (event: TicketmasterEvent): string | null => {
  const artistName = getArtistNameFromEvent(event)
  if (!artistName) return null
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
    <section
      v-if="loading"
      class="space-y-3"
      aria-busy="true"
      aria-label="Loading upcoming shows"
    >
      <div class="h-6 w-52 animate-pulse rounded bg-slate-800"></div>
      <div class="grid gap-4 md:grid-cols-2">
        <div
          v-for="i in 6"
          :key="i"
          class="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
        >
          <div class="h-5 w-3/4 animate-pulse rounded bg-slate-800"></div>
          <div class="h-4 w-2/5 animate-pulse rounded bg-slate-800"></div>
          <div class="h-3 w-3/5 animate-pulse rounded bg-slate-800"></div>
          <div class="mt-2 h-10 w-full animate-pulse rounded-lg bg-slate-800"></div>
        </div>
      </div>
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
      No upcoming events found for Portland/Vancouver right now.
    </section>

    <section v-else class="space-y-3">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="font-display text-xl font-semibold leading-tight tracking-tight text-slate-100">Upcoming Shows</h2>
        <p class="text-sm text-slate-400">Portland/Vancouver · {{ events.length }} events</p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="event in events"
          :key="event.id"
          class="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-base font-semibold text-slate-100">{{ event.name }}</h3>
            <span
              v-if="event.dates?.start?.localDate && getUrgencyLabel(event.dates.start.localDate)"
              class="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400"
            >
              {{ getUrgencyLabel(event.dates.start.localDate) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-300">
            <time
              v-if="event.dates?.start?.localDate"
              :datetime="event.dates.start.localDate"
            >{{ formatShowDate(event.dates.start.localDate) }}</time>
            <span v-else>Unknown date</span>
            <span v-if="event.dates?.start?.localTime"> · {{ formatShowTime(event.dates.start.localTime) }}</span>
          </p>
          <p class="text-xs text-slate-400">
            {{ event._embedded?.venues?.[0]?.name ?? 'Unknown venue' }}
            <span v-if="event._embedded?.venues?.[0]?.city?.name">
              · {{ event._embedded?.venues?.[0]?.city?.name }}
            </span>
          </p>

          <ShowSetlistButton :to="getArtistRoute(event)" />
        </article>
      </div>
    </section>
  </main>
</template>
