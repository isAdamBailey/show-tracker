<script setup lang="ts">
import { computed } from 'vue'
import SetlistAccordion from '~/app/components/SetlistAccordion.vue'
import type {
  SetlistHistoryResponse,
  SetlistItem,
  TicketmasterEvent,
  TmDiscoveryResponse
} from '~/app/types/music'

interface ArtistPagePayload {
  upcomingEvents: TicketmasterEvent[]
  setlists: SetlistItem[]
  upcomingError: string | null
  setlistError: string | null
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

const normalizeSetlists = (response: SetlistHistoryResponse): SetlistItem[] => {
  const rawSetlist = response.setlist
  if (!rawSetlist) {
    return []
  }
  return Array.isArray(rawSetlist) ? rawSetlist : [rawSetlist]
}

const normalizeEvents = (response: TmDiscoveryResponse): TicketmasterEvent[] => {
  return response._embedded?.events ?? []
}

const { data, pending, refresh } = await useAsyncData<ArtistPagePayload>(
  () => `artist-page:${rawArtistParam.value}`,
  async () => {
    const encodedArtistName = encodeURIComponent(artistName.value)
    const [upcomingResult, setlistResult] = await Promise.allSettled([
      $fetch<TmDiscoveryResponse>(`/api/tm-discovery?keyword=${encodedArtistName}`),
      $fetch<SetlistHistoryResponse>(`/api/setlist-history?artistName=${encodedArtistName}`)
    ])

    const upcomingEvents =
      upcomingResult.status === 'fulfilled' ? normalizeEvents(upcomingResult.value) : []
    const setlists =
      setlistResult.status === 'fulfilled' ? normalizeSetlists(setlistResult.value) : []

    return {
      upcomingEvents,
      setlists,
      upcomingError: upcomingResult.status === 'rejected' ? String(upcomingResult.reason) : null,
      setlistError: setlistResult.status === 'rejected' ? String(setlistResult.reason) : null
    }
  },
  { watch: [artistName] }
)

const upcomingEvents = computed<TicketmasterEvent[]>(() => data.value?.upcomingEvents ?? [])
const setlists = computed<SetlistItem[]>(() => data.value?.setlists ?? [])
const upcomingError = computed<string | null>(() => data.value?.upcomingError ?? null)
const setlistError = computed<string | null>(() => data.value?.setlistError ?? null)

const hasUpcomingData = computed<boolean>(() => upcomingEvents.value.length > 0)
const hasSetlistData = computed<boolean>(() => setlists.value.length > 0)

const hasAnyError = computed<boolean>(() => Boolean(upcomingError.value || setlistError.value))
const bothFailed = computed<boolean>(() => Boolean(upcomingError.value && setlistError.value))
const partialFailure = computed<boolean>(
  () =>
    hasAnyError.value &&
    !bothFailed.value &&
    (hasUpcomingData.value || hasSetlistData.value || !pending.value)
)
const isEmpty = computed<boolean>(
  () => !pending.value && !hasAnyError.value && !hasUpcomingData.value && !hasSetlistData.value
)
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-100">{{ artistName }}</h1>
      <p class="text-sm text-slate-400">
        Upcoming global tour dates and historical setlists for this exact artist name.
      </p>
    </header>

    <section
      v-if="pending"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
    >
      Loading artist data...
    </section>

    <section
      v-else-if="bothFailed"
      class="rounded-lg border border-red-800 bg-red-950/40 p-5 text-sm text-red-200"
    >
      <p>Unable to load both upcoming events and setlist history.</p>
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
      No upcoming events or setlist history found for this artist.
    </section>

    <section
      v-else-if="partialFailure"
      class="rounded-lg border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-200"
    >
      <p>Part of the data could not be loaded. Showing available results.</p>
      <ul class="mt-2 space-y-1 text-xs">
        <li v-if="upcomingError">Upcoming events failed to load.</li>
        <li v-if="setlistError">Setlist history failed to load.</li>
      </ul>
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
          <a
            v-if="event.url"
            :href="event.url"
            target="_blank"
            rel="noreferrer noopener"
            class="mt-3 inline-block text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            View event
          </a>
        </article>
      </div>
    </section>

    <section
      v-else-if="!pending && !upcomingError"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400"
    >
      No upcoming tour dates found.
    </section>

    <section v-if="hasSetlistData" class="space-y-3">
      <h2 class="text-xl font-medium text-slate-100">Setlist History</h2>
      <SetlistAccordion :setlists="setlists" />
    </section>

    <section
      v-else-if="!pending && !setlistError"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400"
    >
      No setlist history found.
    </section>
  </main>
</template>
