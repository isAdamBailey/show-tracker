<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SearchSuggestionList, { type SuggestionGroup, type SuggestionItem } from './SearchSuggestionList.vue'
import { useMusicCacheStore } from '../stores/music-cache'
import type { SuggestArtist, SuggestResponse } from '../types/music'

// Each pause fans out to several Ticketmaster calls, so debounce a little past the handoff's 150ms.
const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2
const EMPTY_SUGGESTIONS: SuggestResponse = { artists: [], genres: [] }

const cacheStore = useMusicCacheStore()
const route = useRoute()

const query = ref<string>('')
const open = ref<boolean>(false)
const mobileOpen = ref<boolean>(false)
/** -1 means nothing is highlighted, so Enter searches the raw query as an artist. */
const highlightIndex = ref<number>(-1)
const suggestions = ref<SuggestResponse>(EMPTY_SUGGESTIONS)

const desktopInput = ref<HTMLInputElement | null>(null)
const mobileInput = ref<HTMLInputElement | null>(null)

const trimmedQuery = computed<string>(() => query.value.trim())

const formatArtistMeta = (artist: SuggestArtist): string => {
  if (artist.upcoming <= 0) return 'No upcoming · setlists'
  return artist.upcoming === 1 ? '1 upcoming show' : `${artist.upcoming} upcoming shows`
}

const groups = computed<SuggestionGroup[]>(() => {
  const result: SuggestionGroup[] = []
  const { artists, genres } = suggestions.value

  if (artists.length > 0) {
    result.push({
      title: 'Artists',
      items: artists.map((artist, index) => ({
        id: `artist-${index}`,
        kind: 'artist',
        label: artist.name,
        meta: formatArtistMeta(artist),
        to: `/artist/${encodeURIComponent(artist.name)}`
      }))
    })
  }

  if (genres.length > 0) {
    result.push({
      title: 'Genres',
      items: genres.map((genre, index) => ({
        id: `genre-${index}`,
        kind: 'genre',
        label: genre.name,
        meta: genre.count != null ? `${genre.count.toLocaleString('en-US')} shows` : '',
        to: `/genre/${encodeURIComponent(genre.name)}`
      }))
    })
  }

  return result
})

const flatItems = computed<SuggestionItem[]>(() => groups.value.flatMap((group) => group.items))
const highlightedItem = computed<SuggestionItem | null>(() => flatItems.value[highlightIndex.value] ?? null)
const hasSuggestions = computed<boolean>(() => flatItems.value.length > 0)
const showDropdown = computed<boolean>(() => open.value && hasSuggestions.value)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let latestRequest = 0

const loadSuggestions = async (term: string): Promise<void> => {
  const requestId = ++latestRequest
  try {
    const response = await $fetch<SuggestResponse>('/api/suggest', { query: { q: term } })
    cacheStore.setSuggestions(term, response)
    if (requestId === latestRequest) suggestions.value = response
  } catch {
    if (requestId === latestRequest) suggestions.value = EMPTY_SUGGESTIONS
  }
}

watch(trimmedQuery, (term) => {
  highlightIndex.value = -1
  clearTimeout(debounceTimer)
  if (term.length < MIN_QUERY_LENGTH) {
    latestRequest += 1
    suggestions.value = EMPTY_SUGGESTIONS
    return
  }
  const cached = cacheStore.getSuggestions(term)
  if (cached) {
    latestRequest += 1
    suggestions.value = cached
    return
  }
  debounceTimer = setTimeout(() => loadSuggestions(term), DEBOUNCE_MS)
})

const close = (): void => {
  open.value = false
  mobileOpen.value = false
  highlightIndex.value = -1
}

const reset = (): void => {
  close()
  query.value = ''
  desktopInput.value?.blur()
}

const goTo = async (path: string): Promise<void> => {
  reset()
  await navigateTo(path)
}

const selectItem = (item: SuggestionItem): Promise<void> => goTo(item.to)

const submit = async (): Promise<void> => {
  if (highlightedItem.value) {
    await selectItem(highlightedItem.value)
    return
  }
  if (trimmedQuery.value) {
    await goTo(`/artist/${encodeURIComponent(trimmedQuery.value)}`)
  }
}

const moveHighlight = (step: 1 | -1): void => {
  const count = flatItems.value.length
  if (count === 0) return
  open.value = true
  if (highlightIndex.value === -1) {
    highlightIndex.value = step === 1 ? 0 : count - 1
    return
  }
  highlightIndex.value = (highlightIndex.value + step + count) % count
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveHighlight(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveHighlight(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    submit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
    desktopInput.value?.blur()
  }
}

const onHover = (id: string): void => {
  highlightIndex.value = flatItems.value.findIndex((item) => item.id === id)
}

const openMobile = async (): Promise<void> => {
  mobileOpen.value = true
  open.value = true
  await nextTick()
  mobileInput.value?.focus()
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

const onGlobalKeydown = (event: KeyboardEvent): void => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  if (isTypingTarget(event.target)) return
  event.preventDefault()
  if (window.matchMedia('(min-width: 768px)').matches) {
    desktopInput.value?.focus()
  } else {
    openMobile()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  clearTimeout(debounceTimer)
})

// Lock page scroll behind the full-screen mobile search.
watch(mobileOpen, (isOpen) => {
  document.documentElement.style.overflow = isOpen ? 'hidden' : ''
})

watch(() => route.fullPath, close)

const activeDescendant = computed<string | undefined>(() =>
  highlightedItem.value ? `search-suggestions-${highlightedItem.value.id}` : undefined
)
</script>

<template>
  <div class="relative w-full md:max-w-[620px] md:flex-1">
    <!-- Desktop: inline box with a dropdown -->
    <form
      role="search"
      class="hidden h-11 items-center gap-3 rounded-lg border border-line-strong bg-surface px-3.5 transition-colors focus-within:border-accent md:flex"
      @submit.prevent="submit"
    >
      <span aria-hidden="true" class="size-2.5 shrink-0 rounded-full border-2 border-muted" />
      <label class="sr-only" for="global-search">Search artists, genres or venues</label>
      <input
        id="global-search"
        ref="desktopInput"
        v-model="query"
        type="search"
        autocomplete="off"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        :aria-expanded="showDropdown"
        :aria-activedescendant="showDropdown ? activeDescendant : undefined"
        placeholder="Search artists, genres or venues"
        class="h-full min-w-0 flex-1 bg-transparent text-15 text-ink outline-none placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden"
        @focus="open = true"
        @blur="close"
        @keydown="onKeydown"
      >
      <kbd
        aria-hidden="true"
        class="rounded-tag border border-line-strong px-1.5 font-sans text-xs leading-5 text-muted"
      >/</kbd>
    </form>

    <div
      v-if="showDropdown"
      class="absolute inset-x-0 top-[50px] z-30 hidden rounded-lg border border-line-strong bg-surface pb-2 pt-2 shadow-popover md:block"
    >
      <SearchSuggestionList
        :groups="groups"
        :highlight-id="highlightedItem?.id ?? null"
        listbox-id="search-suggestions"
        @select="selectItem"
        @hover="onHover"
      />
    </div>

    <!-- Mobile: a tap target that opens full-screen search -->
    <button
      type="button"
      class="flex h-11 w-full items-center gap-3 rounded-lg border border-line-strong bg-surface px-3.5 text-left md:hidden"
      aria-haspopup="dialog"
      @click="openMobile"
    >
      <span aria-hidden="true" class="size-2.5 shrink-0 rounded-full border-2 border-muted" />
      <span class="text-15 text-placeholder">Artists, genres, venues</span>
    </button>

    <Teleport to="#teleports">
      <div
        v-if="mobileOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        class="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas pt-[env(safe-area-inset-top)] md:hidden"
      >
        <form
          role="search"
          class="flex items-center gap-4 border-b border-line px-[18px] py-4"
          @submit.prevent="submit"
        >
          <div
            class="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-line-strong bg-surface px-3.5 focus-within:border-accent"
          >
            <span aria-hidden="true" class="size-2.5 shrink-0 rounded-full border-2 border-muted" />
            <label class="sr-only" for="global-search-mobile">Search artists, genres or venues</label>
            <input
              id="global-search-mobile"
              ref="mobileInput"
              v-model="query"
              type="search"
              enterkeyhint="search"
              autocomplete="off"
              spellcheck="false"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="search-suggestions-mobile"
              :aria-expanded="hasSuggestions"
              placeholder="Artists, genres, venues"
              class="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden"
              @keydown="onKeydown"
            >
          </div>
          <button type="button" class="text-15 text-ink-2" @click="reset">Cancel</button>
        </form>
        <SearchSuggestionList
          v-if="hasSuggestions"
          :groups="groups"
          :highlight-id="highlightedItem?.id ?? null"
          listbox-id="search-suggestions-mobile"
          touch
          @select="selectItem"
          @hover="onHover"
        />
        <p v-else-if="trimmedQuery.length >= MIN_QUERY_LENGTH" class="px-[18px] py-5 text-sm text-ink-3">
          Press search to look up “{{ trimmedQuery }}” as an artist.
        </p>
      </div>
    </Teleport>
  </div>
</template>
