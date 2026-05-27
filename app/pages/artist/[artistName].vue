<script setup lang="ts">
import { computed } from 'vue'
import ShowSetlistButton from '../../components/ShowSetlistButton.vue'
import type { TicketmasterEvent } from '../../types/music'
import { fetchMergedArtistEvents, getArtistNameFromEvent, getEventListingLabel } from '../../utils/events'

interface ArtistPagePayload {
  upcomingEvents: TicketmasterEvent[]
  upcomingError: string | null
}

const route = useRoute()

const rawArtistParam = computed<string>(() => {
  const value = route.params.artistName
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
})

const artistName = computed<string>(() => decodeURIComponent(rawArtistParam.value))
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

const getEventArtistName = (event: TicketmasterEvent): string | null => {
  return getArtistNameFromEvent(event) ?? artistName.value
}

const getShowRoute = (event: TicketmasterEvent): string | null => {
  const eventArtistName = getEventArtistName(event)
  if (!eventArtistName) {
    return null
  }
  const basePath = `/show/${encodeURIComponent(event.id)}?artistName=${encodeURIComponent(eventArtistName)}`
  if (!cityFromQuery.value) {
    return basePath
  }
  return `${basePath}&city=${encodeURIComponent(cityFromQuery.value)}`
}

const { data, pending, refresh } = await useAsyncData<ArtistPagePayload>(
  () => `artist-page:${rawArtistParam.value}:${cityFromQuery.value}`,
  async () => {
    try {
      const upcomingEvents = await fetchMergedArtistEvents(
        artistName.value,
        cityFromQuery.value || undefined
      )
      return {
        upcomingEvents,
        upcomingError: null
      }
    } catch (error: unknown) {
      return {
        upcomingEvents: [],
        upcomingError: String(error)
      }
    }
  },
  { watch: [artistName, cityFromQuery] }
)

const upcomingEvents = computed<TicketmasterEvent[]>(() => data.value?.upcomingEvents ?? [])
const upcomingError = computed<string | null>(() => data.value?.upcomingError ?? null)

const hasUpcomingData = computed<boolean>(() => upcomingEvents.value.length > 0)

const isEmpty = computed<boolean>(() => !pending.value && !upcomingError.value && !hasUpcomingData.value)
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">{{ artistName }}</h1>
      <p class="text-sm text-slate-400">
        Upcoming tour dates from Ticketmaster and SeatGeek
        <span v-if="cityFromQuery">in {{ cityFromQuery }}</span>.
      </p>
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
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="event in upcomingEvents"
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
            <ShowSetlistButton :to="getShowRoute(event)" />
            <a
              v-if="event.url"
              :href="event.url"
              target="_blank"
              rel="noreferrer noopener"
              class="w-full text-center text-xs font-medium text-slate-400 hover:text-slate-300"
            >
              {{ getEventListingLabel(event) }}
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
