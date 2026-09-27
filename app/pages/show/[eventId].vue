<script setup lang="ts">
import { computed } from 'vue'
import SetlistHistory from '../../components/SetlistHistory.vue'
import { useMusicCacheStore } from '../../stores/music-cache'
import type { MergedEventsResult, SetlistItem, TicketmasterEvent } from '../../types/music'
import { formatMonthDay, formatShowDate, getUrgencyLabel } from '../../utils/dates'
import {
  buildShowRoute,
  fetchEventById,
  formatPriceRange,
  formatVenueCity,
  getDoorsTime,
  getEventGenre,
  getEventVenue,
  getHeadliner,
  getShowTime,
  getSupportActs,
  getTicketSourceName
} from '../../utils/events'
import { readRouteValue } from '../../utils/route'

interface ShowPagePayload {
  event: TicketmasterEvent | null
  tour: MergedEventsResult | null
  setlists: SetlistItem[]
  setlistError: boolean
}

const MORE_DATES_LIMIT = 3

const route = useRoute()
const cacheStore = useMusicCacheStore()
const { userCity } = useUserLocation()
const { loadArtistUpcoming, loadSetlistHistory } = useArtistData()

const eventId = computed<string>(() => readRouteValue(route.params.eventId))
const artistNameFromQuery = computed<string>(() => readRouteValue(route.query.artistName).trim())

const loadEvent = async (): Promise<TicketmasterEvent | null> =>
  cacheStore.findCachedEvent(eventId.value) ?? (await fetchEventById(eventId.value).catch(() => null))

const { data, pending, refresh } = await useAsyncData<ShowPagePayload>(
  () => `show-page:${eventId.value}:${artistNameFromQuery.value}`,
  async () => {
    // Feed links always carry artistName, so the event, tour and setlists can load together.
    // Without it, the headliner has to come from the event first.
    const eventPromise = loadEvent()
    const artistName =
      artistNameFromQuery.value || (await eventPromise.then((event) => (event ? getHeadliner(event) : '')))
    if (!artistName) {
      return { event: await eventPromise, tour: null, setlists: [], setlistError: false }
    }

    const [tourResult, setlistResult] = await Promise.allSettled([
      loadArtistUpcoming(artistName),
      loadSetlistHistory(artistName)
    ])
    return {
      event: await eventPromise,
      tour: tourResult.status === 'fulfilled' ? tourResult.value : null,
      setlists: setlistResult.status === 'fulfilled' ? setlistResult.value : [],
      setlistError: setlistResult.status === 'rejected'
    }
  },
  { watch: [eventId, artistNameFromQuery] }
)

const event = computed<TicketmasterEvent | null>(() => data.value?.event ?? null)

const headliner = computed<string>(() => (event.value ? getHeadliner(event.value) : artistNameFromQuery.value || 'Show'))
const support = computed<string>(() => (event.value ? getSupportActs(event.value).join(', ') : ''))
const localDate = computed<string | null>(() => event.value?.dates?.start?.localDate ?? null)
const badge = computed(() => (localDate.value ? getUrgencyLabel(localDate.value) : null))
const venue = computed(() => (event.value ? getEventVenue(event.value) : undefined))
const venueDetail = computed<string>(() =>
  [formatVenueCity(venue.value), venue.value?.address?.line1].filter(Boolean).join(' · ')
)
const price = computed<string | null>(() => (event.value ? formatPriceRange(event.value) : null))
const genre = computed<string | null>(() => (event.value ? getEventGenre(event.value) : null))
const timeLine = computed<string | null>(() => {
  if (!event.value) return null
  const doors = getDoorsTime(event.value)
  const show = getShowTime(event.value)
  return [doors ? `Doors ${doors}` : null, show ? `Show ${show}` : null].filter(Boolean).join(' · ') || null
})
const ticketLabel = computed<string>(() => (event.value ? `Tickets on ${getTicketSourceName(event.value)}` : ''))

const otherTourDates = computed<TicketmasterEvent[]>(() =>
  (data.value?.tour?.events ?? []).filter((tourEvent) => tourEvent.id !== eventId.value)
)
const moreTourDates = computed(() => otherTourDates.value.slice(0, MORE_DATES_LIMIT))
const artistRoute = computed<string>(() => `/artist/${encodeURIComponent(headliner.value)}`)

const backLabel = computed<string>(() => (userCity.value ? `Shows near ${userCity.value.name}` : 'All shows'))

useHead(() => ({ title: `${headliner.value} · Live Music Tracker` }))
</script>

<template>
  <main
    class="mx-auto grid max-w-screen-2xl gap-12 px-[18px] pb-32 pt-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pb-16 lg:pt-8"
  >
    <!-- Show details: pinned while the setlists scroll -->
    <aside class="flex flex-col gap-7 self-start lg:sticky lg:top-8">
      <NuxtLink to="/" class="self-start text-sm text-ink-3 transition-colors hover:text-ink">← {{ backLabel }}</NuxtLink>

      <div>
        <p v-if="localDate" class="flex items-center gap-2.5 text-15 text-ink-2">
          <time :datetime="localDate">{{ formatShowDate(localDate) }}</time>
          <span
            v-if="badge"
            class="rounded-tag bg-accent-soft px-[7px] py-0.5 text-xs font-semibold text-accent-soft-ink"
          >{{ badge }}</span>
        </p>
        <h1
          class="mt-3 text-balance font-display text-52 font-bold leading-[0.88] tracking-[-0.015em] text-ink lg:text-72"
        >
          {{ headliner }}
        </h1>
        <p v-if="support" class="mt-3 text-base text-ink-2">with {{ support }}</p>
      </div>

      <div v-if="pending && !event" class="space-y-3 border-y border-line py-5" aria-hidden="true">
        <div v-for="i in 4" :key="i" class="h-4 w-3/4 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
      </div>

      <template v-else-if="event">
        <dl class="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-3.5 border-y border-line py-5 text-15">
          <dt class="pt-0.5 text-13 text-muted">Venue</dt>
          <dd>
            <p class="text-ink">{{ venue?.name ?? 'Venue TBA' }}</p>
            <p v-if="venueDetail" class="mt-0.5 text-13 text-muted">{{ venueDetail }}</p>
          </dd>
          <dt class="pt-0.5 text-13 text-muted">Time</dt>
          <dd class="tabular text-ink">{{ timeLine ?? 'TBA' }}</dd>
          <dt class="pt-0.5 text-13 text-muted">Tickets</dt>
          <dd class="tabular text-ink">
            <template v-if="price">{{ price }}</template>
            <span v-else class="text-muted">Price not listed</span>
          </dd>
          <template v-if="genre">
            <dt class="pt-0.5 text-13 text-muted">Genre</dt>
            <dd>
              <span class="inline-block rounded-tag border border-line-strong px-1.5 text-xs leading-5 text-ink-3">{{ genre }}</span>
            </dd>
          </template>
        </dl>

        <a
          v-if="event.url"
          :href="event.url"
          target="_blank"
          rel="noreferrer noopener"
          class="hidden h-12 items-center justify-center rounded-lg bg-accent text-15 font-semibold text-on-accent transition-colors hover:bg-accent-hover lg:flex"
        >
          {{ ticketLabel }} ↗
        </a>
      </template>

      <p v-else class="border-y border-line py-5 text-sm text-ink-3">
        This show isn’t listed on Ticketmaster or SeatGeek anymore. Setlist history is below.
      </p>

      <section v-if="moreTourDates.length > 0">
        <div class="flex items-baseline justify-between">
          <h2 class="font-display text-22 font-semibold leading-none text-ink">More tour dates</h2>
          <NuxtLink :to="artistRoute" class="text-13 text-accent-text transition-colors hover:text-accent-hover">
            All {{ otherTourDates.length }} →
          </NuxtLink>
        </div>
        <ul class="mt-3">
          <li v-for="tourEvent in moreTourDates" :key="tourEvent.id" class="border-t border-line">
            <NuxtLink
              :to="buildShowRoute(tourEvent)"
              class="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 py-2.5 text-sm transition-colors hover:bg-surface"
            >
              <time
                v-if="tourEvent.dates?.start?.localDate"
                :datetime="tourEvent.dates.start.localDate"
                class="text-muted"
              >{{ formatMonthDay(tourEvent.dates.start.localDate) }}</time>
              <span v-else class="text-muted">TBA</span>
              <span class="truncate text-ink">
                {{ getEventVenue(tourEvent)?.name ?? 'Venue TBA'
                }}<span class="text-muted"> · {{ formatVenueCity(getEventVenue(tourEvent)) }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </aside>

    <SetlistHistory
      :setlists="data?.setlists ?? []"
      :artist-name="headliner"
      :pending="pending"
      :failed="data?.setlistError ?? false"
      @retry="refresh()"
    />

    <!-- Mobile: the ticket CTA stays in reach. Teleported so no transformed ancestor breaks `fixed`. -->
    <Teleport to="#teleports">
      <div
        v-if="event?.url"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas px-[18px] pb-7 pt-3 lg:hidden"
      >
        <a
          :href="event.url"
          target="_blank"
          rel="noreferrer noopener"
          class="flex h-12 items-center justify-center rounded-lg bg-accent text-15 font-semibold text-on-accent transition-colors hover:bg-accent-hover"
        >
          {{ ticketLabel }} ↗
        </a>
      </div>
    </Teleport>
  </main>
</template>
