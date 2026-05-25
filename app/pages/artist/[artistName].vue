<script setup lang="ts">
import { computed } from 'vue'
import { useMusicCacheStore } from '../../stores/music-cache'
import { filterEventsWithinRadius, resolveCityFallback, resolveSearchCenter } from '../../utils/location'
import type { TicketmasterEvent, TmDiscoveryResponse } from '../../types/music'

interface ArtistPagePayload {
  upcomingEvents: TicketmasterEvent[]
  upcomingError: string | null
}

const route = useRoute()
const musicCacheStore = useMusicCacheStore()

const rawArtistParam = computed<string>(() => {
  const value = route.params.artistName
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
})

const artistName = computed<string>(() => decodeURIComponent(rawArtistParam.value))

const normalizeEvents = (response: TmDiscoveryResponse): TicketmasterEvent[] => {
  return response._embedded?.events ?? []
}

const getEventArtistName = (event: TicketmasterEvent): string | null => {
  const ticketmasterArtistName = event._embedded?.attractions?.[0]?.name
  return ticketmasterArtistName ?? artistName.value
}

const getShowRoute = (event: TicketmasterEvent): string | null => {
  const eventArtistName = getEventArtistName(event)
  if (!eventArtistName) {
    return null
  }
  return `/show/${encodeURIComponent(event.id)}?artistName=${encodeURIComponent(eventArtistName)}`
}

const { data, pending, refresh } = await useAsyncData<ArtistPagePayload>(
  () => `artist-page:${rawArtistParam.value}`,
  async () => {
    const encodedArtistName = encodeURIComponent(artistName.value)
    try {
      const upcomingResponse = await $fetch<TmDiscoveryResponse>(
        `/api/tm-discovery?keyword=${encodedArtistName}`
      )
      return {
        upcomingEvents: normalizeEvents(upcomingResponse),
        upcomingError: null
      }
    } catch (error: unknown) {
      return {
        upcomingEvents: [],
        upcomingError: String(error)
      }
    }
  },
  { watch: [artistName] }
)

const upcomingEvents = computed<TicketmasterEvent[]>(() => data.value?.upcomingEvents ?? [])
const nearbyUpcomingEvents = computed<TicketmasterEvent[]>(() => {
  const localCenter = resolveSearchCenter(musicCacheStore.location)
  const fallbackCity = resolveCityFallback(musicCacheStore.location)
  return filterEventsWithinRadius(upcomingEvents.value, localCenter, 100, fallbackCity)
})
const displayUpcomingEvents = computed<TicketmasterEvent[]>(() => {
  if (nearbyUpcomingEvents.value.length > 0) {
    return nearbyUpcomingEvents.value
  }
  return upcomingEvents.value
})
const upcomingError = computed<string | null>(() => data.value?.upcomingError ?? null)

const hasUpcomingData = computed<boolean>(() => displayUpcomingEvents.value.length > 0)
const isUsingUpcomingFallback = computed<boolean>(
  () => nearbyUpcomingEvents.value.length === 0 && upcomingEvents.value.length > 0
)

const isEmpty = computed<boolean>(() => !pending.value && !upcomingError.value && !hasUpcomingData.value)
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">{{ artistName }}</h1>
      <p class="text-sm text-slate-400">Upcoming tour dates for this artist.</p>
    </header>

    <section
      v-if="pending"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      Loading artist data...
    </section>

    <section
      v-else-if="upcomingError"
      class="rounded-lg border border-red-800 bg-red-950/40 p-5 text-sm text-red-200"
    >
      <p>Unable to load upcoming events.</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
        @click="refresh()"
      >
        Retry
      </button>
    </section>

    <section
      v-else-if="isEmpty"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      No upcoming tour dates found for this artist.
    </section>

    <section v-if="hasUpcomingData" class="space-y-3">
      <h2 class="text-xl font-medium text-slate-100">Upcoming Tour Dates</h2>
      <p v-if="isUsingUpcomingFallback" class="text-xs text-amber-300">
        Showing Ticketmaster results without distance filtering because venue coordinates were unavailable.
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="event in displayUpcomingEvents"
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
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <NuxtLink
              v-if="getShowRoute(event)"
              :to="getShowRoute(event) || ''"
              class="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              View show + setlist history
            </NuxtLink>
            <a
              v-if="event.url"
              :href="event.url"
              target="_blank"
              rel="noreferrer noopener"
              class="text-xs font-medium text-slate-400 hover:text-slate-300"
            >
              Open Ticketmaster listing
            </a>
          </div>
        </article>
      </div>
    </section>

    <section
      v-else-if="!pending && !upcomingError"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400"
    >
      No upcoming tour dates found.
    </section>
  </main>
</template>
