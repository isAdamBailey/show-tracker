<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMusicCacheStore } from '../../stores/music-cache'
import {
  filterEventsWithinRadius,
  resolveCityFallback,
  resolveSearchCenter
} from '../../utils/location'
import type { TicketmasterEvent, TmDiscoveryProxyResponse } from '../../types/music'
import type { LocationState } from '../../stores/music-cache'

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

const getArtistNameFromEvent = (event: TicketmasterEvent): string | null => {
  const artistName = event._embedded?.attractions?.[0]?.name
  return artistName ?? null
}

const buildDiscoveryQuery = (
  genre: string,
  location: LocationState
): { classificationName: string; geoPoint?: string; dmaId?: string } => {
  if (location.selectedCity === 'portland') {
    return {
      classificationName: genre,
      dmaId: '37'
    }
  }

  if (location.source === 'geoPoint' && location.geoPoint) {
    return {
      classificationName: genre,
      geoPoint: location.geoPoint
    }
  }

  if (location.dmaId) {
    return {
      classificationName: genre,
      dmaId: location.dmaId
    }
  }

  return {
    classificationName: genre,
    dmaId: '37'
  }
}

const buildKeywordFallbackQuery = (
  genre: string,
  location: LocationState
): { keyword: string; geoPoint?: string; dmaId?: string } => {
  if (location.selectedCity === 'portland') {
    return {
      keyword: genre,
      dmaId: '37'
    }
  }

  if (location.source === 'geoPoint' && location.geoPoint) {
    return {
      keyword: genre,
      geoPoint: location.geoPoint
    }
  }

  if (location.dmaId) {
    return {
      keyword: genre,
      dmaId: location.dmaId
    }
  }

  return {
    keyword: genre,
    dmaId: '37'
  }
}

const goToShow = async (event: TicketmasterEvent): Promise<void> => {
  const artistName = getArtistNameFromEvent(event)
  if (!artistName) {
    return
  }
  await navigateTo(`/show/${encodeURIComponent(event.id)}?artistName=${encodeURIComponent(artistName)}`)
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

  const cachedEvents = musicCacheStore.getGenreDiscovery(genre)
  if (cachedEvents && cachedEvents.length > 0) {
    const localCenter = resolveSearchCenter(musicCacheStore.location)
    const fallbackCity = resolveCityFallback(musicCacheStore.location)
    events.value = filterEventsWithinRadius(cachedEvents, localCenter, 100, fallbackCity)
    loading.value = false
    return
  }

  try {
    const query = buildDiscoveryQuery(genre, musicCacheStore.location)
    const classificationResponse = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', { query })
    let discoveryEvents = classificationResponse._embedded.events

    if (discoveryEvents.length === 0) {
      const keywordQuery = buildKeywordFallbackQuery(genre, musicCacheStore.location)
      const keywordResponse = await $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', {
        query: keywordQuery
      })
      discoveryEvents = keywordResponse._embedded.events
      usedKeywordFallback.value = true
    }

    const localCenter = resolveSearchCenter(musicCacheStore.location)
    const fallbackCity = resolveCityFallback(musicCacheStore.location)
    const nearbyEvents = filterEventsWithinRadius(discoveryEvents, localCenter, 100, fallbackCity)
    const displayEvents = nearbyEvents.length > 0 ? nearbyEvents : discoveryEvents
    events.value = displayEvents
    musicCacheStore.setGenreDiscovery(genre, displayEvents)
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
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">
        Genre: {{ classificationName || 'Unknown' }}
      </h1>
      <p class="text-sm text-slate-400">
        Upcoming events discovered by Ticketmaster classification.
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
        No direct classification matches found. Showing keyword-based matches instead.
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="event in events"
          :key="event.id"
          class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition"
          :class="
            getArtistNameFromEvent(event)
              ? 'cursor-pointer hover:border-slate-600 hover:bg-slate-900'
              : 'cursor-not-allowed opacity-80'
          "
          @click="goToShow(event)"
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
          <p v-if="getArtistNameFromEvent(event)" class="mt-3 text-xs font-medium text-sky-400">
            View show + setlist history
          </p>
          <p v-else class="mt-3 text-xs text-slate-500">
            Artist unavailable from Ticketmaster event data
          </p>
        </article>
      </div>
    </section>
  </main>
</template>
