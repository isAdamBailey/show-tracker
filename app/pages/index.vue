<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CityPicker from '../components/CityPicker.vue'
import ErrorPanel from '../components/ErrorPanel.vue'
import FeedList from '../components/FeedList.vue'
import FeedSkeleton from '../components/FeedSkeleton.vue'
import { getNearestCities, type CityOption } from '../data/cities'
import { useMusicCacheStore } from '../stores/music-cache'
import type { CitySource } from '../composables/useUserCity'
import type { MergedEventsResult, TicketmasterEvent } from '../types/music'
import { FEED_TABS, getTabLastDate, getTabRange, toLocalIsoDate, type FeedTab } from '../utils/dates'
import { allSourcesFailed, countTicketmasterEvents, fetchMergedLocalEvents, getEventGenre } from '../utils/events'
import { readRouteValue } from '../utils/route'
import ngeohash from 'ngeohash'

const RADIUS_MILES = 50
const ALL_GENRES = 'All'
const DEFAULT_TAB: FeedTab = 'week'

const TAB_LABELS: Record<FeedTab, { long: string; short: string; phrase: string }> = {
  tonight: { long: 'Tonight', short: 'Tonight', phrase: 'tonight' },
  week: { long: 'This week', short: 'Week', phrase: 'this week' },
  month: { long: 'This month', short: 'Month', phrase: 'this month' }
}

useHead({ title: 'Shows near you · Live Music Tracker' })

const route = useRoute()
const router = useRouter()
const cacheStore = useMusicCacheStore()
const { userCity, userGeoPoint, locationResolved, detecting, setManualCity, useMyLocation } = useUserLocation()

// ── Filters live in the URL so a filtered feed can be shared ──
const tab = computed<FeedTab>(() => {
  const value = readRouteValue(route.query.tab)
  return (FEED_TABS as readonly string[]).includes(value) ? (value as FeedTab) : DEFAULT_TAB
})
const genre = computed<string>(() => readRouteValue(route.query.genre) || ALL_GENRES)

const setFilters = (next: { tab?: FeedTab; genre?: string }): void => {
  const nextTab = next.tab ?? tab.value
  const nextGenre = next.genre ?? genre.value
  router.replace({
    query: {
      ...route.query,
      tab: nextTab === DEFAULT_TAB ? undefined : nextTab,
      genre: nextGenre === ALL_GENRES ? undefined : nextGenre
    }
  })
}

// ── Feed data: one Month fetch backs all three tabs ──
const result = ref<MergedEventsResult | null>(null)
const loading = ref<boolean>(false)
let latestRequest = 0

const loadFeed = async (force = false): Promise<void> => {
  const city = userCity.value
  const geoPoint = userGeoPoint.value
  if (!city || !geoPoint) return

  const now = new Date()
  const lookup = { geoPoint, radiusMiles: RADIUS_MILES, startDate: toLocalIsoDate(now) }
  const cached = force ? undefined : cacheStore.getLocalDiscovery(lookup)
  if (cached) {
    latestRequest += 1
    result.value = cached
    loading.value = false
    return
  }

  const requestId = ++latestRequest
  loading.value = true
  const { start, end } = getTabRange('month', now)
  const merged = await fetchMergedLocalEvents({
    lat: city.lat,
    lon: city.lon,
    geoPoint,
    radiusMiles: RADIUS_MILES,
    start,
    end
  })
  if (requestId !== latestRequest) return

  if (!allSourcesFailed(merged)) cacheStore.setLocalDiscovery(lookup, merged)
  result.value = merged
  loading.value = false
}

// Wait for detection (or its timeout) so the feed never flashes the fallback city first.
watch(
  [locationResolved, userGeoPoint],
  ([resolved]) => {
    if (resolved) loadFeed()
  },
  { immediate: true }
)

const showSkeleton = computed<boolean>(() => !locationResolved.value || loading.value || !result.value)
const failed = computed<boolean>(() => Boolean(result.value && allSourcesFailed(result.value)))
const failedSourceName = computed<string | null>(() => {
  if (!result.value || failed.value) return null
  if (result.value.seatgeek === 'failed') return 'SeatGeek'
  if (result.value.ticketmaster === 'failed') return 'Ticketmaster'
  return null
})

// ── Filtering ──
/** Drops shows from earlier days, since a cached feed can outlive midnight. */
const upcomingEvents = computed<TicketmasterEvent[]>(() => {
  const today = toLocalIsoDate(new Date())
  return (result.value?.events ?? []).filter((event) => (event.dates?.start?.localDate ?? '') >= today)
})

/** One pass over the feed: each tab's shows for the active genre. Counts follow the chip, so a count matches the list it opens. */
const eventsByTab = computed<Record<FeedTab, TicketmasterEvent[]>>(() => {
  const lastDates = FEED_TABS.map((tabName) => [tabName, getTabLastDate(tabName)] as const)
  const byTab: Record<FeedTab, TicketmasterEvent[]> = { tonight: [], week: [], month: [] }
  for (const event of upcomingEvents.value) {
    if (genre.value !== ALL_GENRES && getEventGenre(event) !== genre.value) continue
    const date = event.dates?.start?.localDate ?? ''
    for (const [tabName, lastDate] of lastDates) {
      if (date <= lastDate) byTab[tabName].push(event)
    }
  }
  return byTab
})

const visibleEvents = computed<TicketmasterEvent[]>(() => eventsByTab.value[tab.value])

const tabCounts = computed<Record<FeedTab, string>>(() => {
  const counts = {} as Record<FeedTab, string>
  for (const tabName of FEED_TABS) {
    const count = eventsByTab.value[tabName].length
    counts[tabName] = tabName === 'month' && result.value?.truncated ? `${count}+` : String(count)
  }
  return counts
})

/** Genres present this month, most common first; "Other" goes last. */
const genreChips = computed<string[]>(() => {
  const frequency = new Map<string, number>()
  for (const event of upcomingEvents.value) {
    const name = getEventGenre(event)
    if (name) frequency.set(name, (frequency.get(name) ?? 0) + 1)
  }
  const names = [...frequency.entries()]
    .sort(([leftName, left], [rightName, right]) => {
      if (leftName === 'Other') return 1
      if (rightName === 'Other') return -1
      return right - left
    })
    .map(([name]) => name)
  if (genre.value !== ALL_GENRES && !names.includes(genre.value)) names.unshift(genre.value)
  return [ALL_GENRES, ...names]
})

// ── Heading copy ──
const cityLabel = computed<string>(() => {
  if (!locationResolved.value || !userCity.value) return 'you'
  return userCity.value.name
})

const SOURCE_PREFIX: Record<CitySource, string> = {
  detected: 'Detected from your location.',
  manual: 'Set manually.',
  default: 'Couldn’t detect your location, so this is the default city.'
}

const sourceLine = computed<string>(() => {
  if (detecting.value && userCity.value?.source !== 'manual') return 'Detecting your location…'
  const prefix = userCity.value ? SOURCE_PREFIX[userCity.value.source] : 'Finding shows near you.'
  return `${prefix} Search results cover every city.`
})

// ── Empty state: offer only what we've actually checked ──
const monthCountForGenre = computed<number>(() => eventsByTab.value.month.length)
const canWidenToMonth = computed<boolean>(() => tab.value !== 'month' && monthCountForGenre.value > 0)
type NearbyAlternative = { city: CityOption; count: number } | null
const nearbyAlternative = ref<NearbyAlternative>(null)
const isEmpty = computed<boolean>(() => !showSkeleton.value && !failed.value && visibleEvents.value.length === 0)

/** Probe results per tab|genre|place, so flipping filters back and forth doesn't refetch. */
const probeCache = new Map<string, NearbyAlternative>()

const probeNearbyCities = async (): Promise<NearbyAlternative> => {
  const origin = userCity.value!
  const { start, end } = getTabRange(tab.value)
  for (const city of getNearestCities(origin, 2)) {
    const count = await countTicketmasterEvents({
      geoPoint: ngeohash.encode(city.lat, city.lon, 7),
      radiusMiles: RADIUS_MILES,
      start,
      end,
      genre: genre.value === ALL_GENRES ? undefined : genre.value
    })
    if (count > 0) return { city, count }
  }
  return null
}

watch([isEmpty, tab, genre, userGeoPoint], async (_, __, onCleanup) => {
  nearbyAlternative.value = null
  if (!isEmpty.value || !userCity.value) return

  let cancelled = false
  onCleanup(() => {
    cancelled = true
  })

  const key = `${tab.value}|${genre.value}|${userGeoPoint.value}`
  if (!probeCache.has(key)) {
    try {
      probeCache.set(key, await probeNearbyCities())
    } catch {
      return
    }
  }
  if (!cancelled) nearbyAlternative.value = probeCache.get(key) ?? null
})

const emptyTitle = computed<string>(() => {
  const genreWord = genre.value === ALL_GENRES ? '' : `${genre.value.toLowerCase()} `
  return `No ${genreWord}shows ${TAB_LABELS[tab.value].phrase} in ${cityLabel.value}.`
})

const emptyHelper = computed<string>(() => {
  const parts: string[] = []
  if (canWidenToMonth.value) {
    parts.push(`There ${monthCountForGenre.value === 1 ? 'is 1' : `are ${monthCountForGenre.value}`} this month`)
  }
  if (nearbyAlternative.value) {
    const { city, count } = nearbyAlternative.value
    parts.push(`${city.name} has ${count} ${TAB_LABELS[tab.value].phrase}`)
  }
  if (parts.length === 0) {
    return genre.value === ALL_GENRES
      ? 'Try another city from the list above.'
      : 'Try another genre or another city from the list above.'
  }
  return `${parts.join(', and ')}.`
})
</script>

<template>
  <main class="mx-auto max-w-screen-2xl">
    <!-- Heading: stays in place in every state -->
    <section class="px-[18px] pt-8 md:px-10 md:pt-10">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="font-display text-40 font-bold leading-[0.9] tracking-[-0.015em] text-ink md:text-64">
            Shows near
            <ClientOnly>
              <CityPicker
                :label="cityLabel"
                :pending="!locationResolved"
                @select="setManualCity"
                @use-location="useMyLocation"
              />
              <template #fallback>
                <span class="text-muted">you</span>
              </template>
            </ClientOnly>
          </h1>
          <p class="mt-3 text-sm text-muted">{{ sourceLine }}</p>
        </div>

        <div
          role="group"
          aria-label="Date range"
          class="grid grid-cols-3 rounded-lg border border-line bg-surface p-1 lg:flex"
        >
          <button
            v-for="tabName in FEED_TABS"
            :key="tabName"
            type="button"
            :aria-pressed="tab === tabName"
            class="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-seg px-4 text-15 transition-colors"
            :class="tab === tabName ? 'bg-ink font-semibold text-canvas' : 'text-ink-2 hover:text-ink'"
            @click="setFilters({ tab: tabName })"
          >
            <span class="lg:hidden">{{ TAB_LABELS[tabName].short }}</span>
            <span class="hidden lg:inline">{{ TAB_LABELS[tabName].long }}</span>
            <span
              v-if="!showSkeleton && !failed"
              class="tabular hidden text-13 lg:inline"
              :class="tab === tabName ? 'text-canvas/70' : 'text-muted'"
            >{{ tabCounts[tabName] }}</span>
          </button>
        </div>
      </div>

      <div
        class="scrollbar-none -mx-[18px] mt-6 flex gap-2 overflow-x-auto px-[18px] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        aria-label="Filter by genre"
        role="group"
      >
        <button
          v-for="chip in genreChips"
          :key="chip"
          type="button"
          :aria-pressed="genre === chip"
          class="shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors"
          :class="
            genre === chip
              ? 'border-accent bg-accent font-semibold text-on-accent'
              : 'border-line-strong text-ink-2 hover:border-muted'
          "
          @click="setFilters({ genre: chip })"
        >
          {{ chip }}
        </button>
      </div>
    </section>

    <!-- List: the only area that changes between states -->
    <section class="pb-10 pt-6 lg:px-6" aria-live="polite" :aria-busy="showSkeleton">
      <div
        v-if="failedSourceName && !showSkeleton"
        class="flex items-center justify-between gap-4 border-b border-warn-line bg-warn-bg px-[18px] py-3 text-sm text-warn-ink lg:px-4"
      >
        <p>{{ failedSourceName }} didn’t respond, so some shows may be missing.</p>
        <button type="button" class="shrink-0 font-semibold text-accent-text hover:text-accent-hover" @click="loadFeed(true)">
          Retry
        </button>
      </div>

      <div
        class="hidden grid-cols-[88px_minmax(0,1fr)_240px_120px_96px] gap-x-6 border-b border-line px-4 pb-2.5 text-xs text-muted lg:grid"
        aria-hidden="true"
      >
        <span>Date</span><span>Lineup</span><span>Venue</span><span>Time</span><span class="text-right">Tickets</span>
      </div>

      <FeedSkeleton v-if="showSkeleton" />

      <ErrorPanel v-else-if="failed" class="mx-[18px] mt-4 lg:mx-4" @retry="loadFeed(true)" />

      <div v-else-if="isEmpty" class="mx-[18px] mt-4 rounded-lg border border-line px-6 py-7 lg:mx-4">
        <h2 class="font-display text-34 font-semibold leading-none text-ink">{{ emptyTitle }}</h2>
        <p class="mt-2.5 text-sm text-ink-3">{{ emptyHelper }}</p>
        <div class="mt-5 flex flex-wrap gap-2.5">
          <button
            v-if="canWidenToMonth"
            type="button"
            class="whitespace-nowrap rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            @click="setFilters({ tab: 'month' })"
          >
            See this month
          </button>
          <button
            v-else-if="genre !== ALL_GENRES"
            type="button"
            class="whitespace-nowrap rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            @click="setFilters({ genre: ALL_GENRES })"
          >
            See all genres
          </button>
          <button
            v-if="nearbyAlternative"
            type="button"
            class="whitespace-nowrap rounded-lg border border-line-strong px-4 py-2.5 text-sm text-ink transition-colors hover:border-muted"
            @click="setManualCity(nearbyAlternative.city)"
          >
            Switch to {{ nearbyAlternative.city.name }}
          </button>
        </div>
      </div>

      <FeedList
        v-else
        :events="visibleEvents"
        :show-badge="tab !== 'tonight'"
        :feed-city="userCity?.name ?? ''"
      />
    </section>
  </main>
</template>
