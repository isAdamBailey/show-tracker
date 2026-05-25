<script setup lang="ts">
import { computed } from 'vue'
import SetlistAccordion from '../../components/SetlistAccordion.vue'
import { useMusicCacheStore } from '../../stores/music-cache'
import type {
  SetlistHistoryProxyResponse,
  SetlistItem,
  TicketmasterEvent,
  TmDiscoveryProxyResponse
} from '../../types/music'

interface ShowPagePayload {
  upcomingEvents: TicketmasterEvent[]
  setlists: SetlistItem[]
  upcomingError: string | null
  setlistError: string | null
}

const route = useRoute()
const cacheStore = useMusicCacheStore()

const rawEventId = computed<string>(() => {
  const value = route.params.eventId
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
})

const eventId = computed<string>(() => decodeURIComponent(rawEventId.value))

const artistNameFromQuery = computed<string>(() => {
  const value = route.query.artistName
  if (Array.isArray(value)) {
    return decodeURIComponent(value[0] ?? '')
  }
  if (typeof value !== 'string') {
    return ''
  }
  return decodeURIComponent(value)
})

const normalizeEvents = (response: TmDiscoveryProxyResponse): TicketmasterEvent[] => {
  return response._embedded.events
}

const normalizeSetlists = (response: SetlistHistoryProxyResponse): SetlistItem[] => {
  return response.setlist
}

const { data, pending, refresh } = await useAsyncData<ShowPagePayload>(
  () => `show-page:${eventId.value}:${artistNameFromQuery.value}`,
  async () => {
    if (!artistNameFromQuery.value) {
      return {
        upcomingEvents: [],
        setlists: [],
        upcomingError: 'Missing artistName for this show.',
        setlistError: 'Missing artistName for this show.'
      }
    }

    const cachedUpcoming = cacheStore.getArtistUpcoming(artistNameFromQuery.value)
    const cachedSetlists = cacheStore.getSetlistHistory(artistNameFromQuery.value)

    const upcomingPromise = cachedUpcoming
      ? Promise.resolve<TicketmasterEvent[]>(cachedUpcoming)
      : $fetch<TmDiscoveryProxyResponse>('/api/tm-discovery', {
          query: { keyword: artistNameFromQuery.value }
        }).then((response) => normalizeEvents(response))

    const setlistPromise = cachedSetlists
      ? Promise.resolve<SetlistItem[]>(cachedSetlists)
      : $fetch<SetlistHistoryProxyResponse>('/api/setlist-history', {
          query: { artistName: artistNameFromQuery.value }
        }).then((response) => normalizeSetlists(response))

    const [upcomingResult, setlistResult] = await Promise.allSettled([upcomingPromise, setlistPromise])

    const upcomingEvents = upcomingResult.status === 'fulfilled' ? upcomingResult.value : []
    const setlists = setlistResult.status === 'fulfilled' ? setlistResult.value : []

    if (upcomingResult.status === 'fulfilled') {
      cacheStore.setArtistUpcoming(artistNameFromQuery.value, upcomingEvents)
    }
    if (setlistResult.status === 'fulfilled') {
      cacheStore.setSetlistHistory(artistNameFromQuery.value, setlists)
    }

    return {
      upcomingEvents,
      setlists,
      upcomingError: upcomingResult.status === 'rejected' ? String(upcomingResult.reason) : null,
      setlistError: setlistResult.status === 'rejected' ? String(setlistResult.reason) : null
    }
  },
  { watch: [eventId, artistNameFromQuery] }
)

const upcomingEvents = computed<TicketmasterEvent[]>(() => data.value?.upcomingEvents ?? [])
const setlists = computed<SetlistItem[]>(() => data.value?.setlists ?? [])
const upcomingError = computed<string | null>(() => data.value?.upcomingError ?? null)
const setlistError = computed<string | null>(() => data.value?.setlistError ?? null)

const selectedEvent = computed<TicketmasterEvent | null>(() => {
  return upcomingEvents.value.find((event) => event.id === eventId.value) ?? null
})

const hasAnyData = computed<boolean>(() => Boolean(selectedEvent.value || setlists.value.length > 0))
const bothFailed = computed<boolean>(() => Boolean(upcomingError.value && setlistError.value))
const partialFailure = computed<boolean>(
  () => !pending.value && !bothFailed.value && Boolean(upcomingError.value || setlistError.value)
)
</script>

<template>
  <main class="mx-auto flex max-w-7xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">
        {{ artistNameFromQuery || 'Show Details' }}
      </h1>
      <p class="text-sm text-slate-400">Selected show info with historical setlist data.</p>
    </header>

    <section
      v-if="pending"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      Loading show details and setlist history...
    </section>

    <section
      v-else-if="bothFailed"
      class="rounded-lg border border-red-800 bg-red-950/40 p-5 text-sm text-red-200"
    >
      <p>Unable to load show details and setlist history.</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
        @click="refresh()"
      >
        Retry
      </button>
    </section>

    <section
      v-else-if="!hasAnyData"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      No show details or setlist history found.
    </section>

    <section
      v-else-if="partialFailure"
      class="rounded-lg border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-200"
    >
      <p>Part of the data could not be loaded. Showing available results.</p>
      <ul class="mt-2 space-y-1 text-xs">
        <li v-if="upcomingError">Show details could not be fully loaded.</li>
        <li v-if="setlistError">Setlist history could not be fully loaded.</li>
      </ul>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <article
        class="rounded-lg border border-slate-800 bg-slate-900/60 p-5"
        :class="{ 'opacity-70': !selectedEvent }"
      >
        <h2 class="text-xl font-medium text-slate-100">Show Info</h2>
        <template v-if="selectedEvent">
          <h3 class="mt-4 text-base font-medium text-slate-100">{{ selectedEvent.name }}</h3>
          <p class="mt-1 text-sm text-slate-300">
            {{ selectedEvent.dates?.start?.localDate ?? 'Unknown date' }}
            <span v-if="selectedEvent.dates?.start?.localTime">
              • {{ selectedEvent.dates.start.localTime }}
            </span>
          </p>
          <p class="text-xs text-slate-400">
            {{ selectedEvent._embedded?.venues?.[0]?.name ?? 'Unknown venue' }}
            <span v-if="selectedEvent._embedded?.venues?.[0]?.city?.name">
              • {{ selectedEvent._embedded?.venues?.[0]?.city?.name }}
            </span>
            <span v-if="selectedEvent._embedded?.venues?.[0]?.country?.name">
              , {{ selectedEvent._embedded?.venues?.[0]?.country?.name }}
            </span>
          </p>
          <a
            v-if="selectedEvent.url"
            :href="selectedEvent.url"
            target="_blank"
            rel="noreferrer noopener"
            class="mt-3 inline-block text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            Open event listing
          </a>
        </template>
        <p v-else class="mt-4 text-sm text-slate-400">
          The selected show was not found in current Ticketmaster results.
        </p>
      </article>

      <article class="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="text-xl font-medium text-slate-100">Historical Setlists</h2>
        <div class="mt-4">
          <SetlistAccordion v-if="setlists.length > 0" :setlists="setlists" />
          <p v-else class="text-sm text-slate-400">No historical setlist data available.</p>
        </div>
      </article>
    </section>
  </main>
</template>
