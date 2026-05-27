<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ShowSetlistButton from '../../components/ShowSetlistButton.vue'
import { useMusicCacheStore } from '../../stores/music-cache'
import type { TicketmasterEvent, TmDiscoveryProxyResponse } from '../../types/music'
import { fetchMergedGenreEvents, getArtistNameFromEvent } from '../../utils/events'

const route = useRoute()
const musicCacheStore = useMusicCacheStore()

const events = ref<TicketmasterEvent[]>([])
const loading = ref<boolean>(true)
const errorMessage = ref<string | null>(null)
const usedKeywordFallback = ref<boolean>(false)

const rawGenreParam = computed<string>(() => {
  const value = route.params.name
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
})

const classificationName = computed<string>(() => decodeURIComponent(rawGenreParam.value))
const cityFromQuery = computed<string>(() => {
  const value = route.query.city
  if (Array.isArray(value)) {
    return decodeURIComponent(value[0] ?? '')
  }
  if (typeof value !== 'string') {
    return ''
  }
  return decodeURIComponent(value)
})

const getArtistNameFromEventForRoute = (event: TicketmasterEvent): string | null => {
  return getArtistNameFromEvent(event)
}

const buildDiscoveryQuery = (genre: string): { classificationName: string; dmaId: string } => ({
  classificationName: genre,
  dmaId: '37'
})

const buildKeywordFallbackQuery = (term: string): { keyword: string } => ({
  keyword: term
})

const getShowRoute = (event: TicketmasterEvent): string | null => {
  const artistName = getArtistNameFromEventForRoute(event)
  if (!artistName) {
    return null
  }
  const basePath = `/show/${encodeURIComponent(event.id)}?artistName=${encodeURIComponent(artistName)}`
  if (!cityFromQuery.value) {
    return basePath
  }
  return `${basePath}&city=${encodeURIComponent(cityFromQuery.value)}`
}

const fetchGenreEvents = async (): Promise<void> => {
  loading.value = true
  errorMessage.value = null
  usedKeywordFallback.value = false

  const genre = classificationName.value.trim()
  if (!genre) {
    events.value = []
    errorMessage.value = 'Genre name is missing from the route.'
    loading.value = false
    return
  }

  const cacheKey = cityFromQuery.value ? `${genre}::${cityFromQuery.value}` : genre
  const cachedEvents = musicCacheStore.getGenreDiscovery(cacheKey)
  if (cachedEvents && cachedEvents.length > 0) {
    events.value = cachedEvents
    loading.value = false
    return
  }

  try {
    const cityKeyword = cityFromQuery.value ? `${genre} ${cityFromQuery.value}` : genre

    const fetchTicketmasterGenreEvents = async (): Promise<TicketmasterEvent[]> => {
      let discoveryEvents: TicketmasterEvent[] = []

      if (cityFromQuery.value) {
        const cityQuery = buildKeywordFallbackQuery(cityKeyword)
        const cityResponse = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', {
          query: cityQuery
        })
        discoveryEvents = cityResponse._embedded.events
        usedKeywordFallback.value = true
      } else {
        const query = buildDiscoveryQuery(genre)
        const classificationResponse = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', { query })
        discoveryEvents = classificationResponse._embedded.events
      }

      if (discoveryEvents.length === 0) {
        const keywordQuery = buildKeywordFallbackQuery(genre)
        const keywordResponse = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', {
          query: keywordQuery
        })
        discoveryEvents = keywordResponse._embedded.events
        usedKeywordFallback.value = true
      }

      return discoveryEvents
    }

    events.value = await fetchMergedGenreEvents(
      fetchTicketmasterGenreEvents,
      genre,
      cityFromQuery.value || undefined
    )
    musicCacheStore.setGenreDiscovery(cacheKey, events.value)
  } catch {
    events.value = []
    errorMessage.value = 'Unable to load genre events right now.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchGenreEvents()
})

watch(classificationName, async () => {
  await fetchGenreEvents()
})

watch(cityFromQuery, async () => {
  await fetchGenreEvents()
})
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">
        Genre: {{ classificationName || 'Unknown' }}
        <span v-if="cityFromQuery"> in {{ cityFromQuery }}</span>
      </h1>
      <p class="text-sm text-slate-400">
        Upcoming events from Ticketmaster and SeatGeek.
      </p>
    </header>

    <section
      v-if="loading"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      Loading genre events...
    </section>

    <section
      v-else-if="errorMessage"
      class="rounded-lg border border-red-800 bg-red-950/40 p-5 text-sm text-red-200"
    >
      <p>{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
        @click="fetchGenreEvents"
      >
        Retry
      </button>
    </section>

    <section
      v-else-if="events.length === 0"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      No events found for this genre.
    </section>

    <section v-else class="space-y-3">
      <h2 class="text-xl font-medium text-slate-100">Genre Events</h2>
      <p v-if="usedKeywordFallback" class="text-xs text-amber-300">
        <span v-if="cityFromQuery">
          Showing keyword-based matches for {{ classificationName }} in {{ cityFromQuery }}.
        </span>
        <span v-else>No direct classification matches found. Showing keyword-based matches instead.</span>
      </p>
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
          <ShowSetlistButton :to="getShowRoute(event)" />
        </article>
      </div>
    </section>
  </main>
</template>
