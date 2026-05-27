<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TmClassificationListResponse } from '../types/music'

type SearchMode = 'artist' | 'genre'

const searchMode = ref<SearchMode>('artist')
const searchValue = ref<string>('')
const artistCity = ref<string>('')

const { data: classificationData, pending: genreLoading } = await useAsyncData<TmClassificationListResponse>(
  'tm-classifications',
  () => $fetch('/api/tm-classifications')
)

const genreOptions = computed<string[]>(() => classificationData.value?.genres ?? [])

const normalizedGenreMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>()
  for (const option of genreOptions.value) {
    map.set(option.toLowerCase(), option)
  }
  return map
})

const isEmptySearch = computed<boolean>(() => searchValue.value.trim().length === 0)

watch(searchMode, () => {
  searchValue.value = ''
  artistCity.value = ''
})

const submitSearch = async (): Promise<void> => {
  if (isEmptySearch.value) {
    return
  }

  const normalizedInput = searchValue.value.trim()
  const normalizedSearchValue =
    searchMode.value === 'genre'
      ? normalizedGenreMap.value.get(normalizedInput.toLowerCase()) ?? normalizedInput
      : normalizedInput

  const encodedValue = encodeURIComponent(normalizedSearchValue)
  const targetPath = searchMode.value === 'artist' ? `/artist/${encodedValue}` : `/genre/${encodedValue}`
  const cityValue = artistCity.value.trim()

  if (cityValue.length > 0) {
    const encodedCity = encodeURIComponent(artistCity.value.trim())
    await navigateTo(`${targetPath}?city=${encodedCity}`)
    return
  }

  await navigateTo(targetPath)
}
</script>

<template>
  <form
    class="flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 shadow-lg shadow-sky-950/30 md:flex-row md:items-center"
    @submit.prevent="submitSearch"
  >
    <label class="sr-only" for="search-mode">Search mode</label>
    <select
      id="search-mode"
      v-model="searchMode"
      class="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
    >
      <option value="artist">Artist</option>
      <option value="genre">Genre</option>
    </select>

    <label class="sr-only" for="search-value">Search value</label>
    <input
      v-if="searchMode === 'artist'"
      id="search-value"
      v-model="searchValue"
      type="text"
      class="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
      placeholder="Search artist"
    >
    <input
      v-else
      id="search-value"
      v-model="searchValue"
      type="text"
      list="ticketmaster-genre-options"
      class="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
      :placeholder="genreLoading ? 'Loading genres...' : 'Type a genre (e.g. Punk)'"
    >
    <CitySearchInput v-model="artistCity" />
    <datalist id="ticketmaster-genre-options">
      <option v-for="genre in genreOptions" :key="genre" :value="genre" />
    </datalist>

    <button
      type="submit"
      class="rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-900/40 transition hover:from-sky-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="isEmptySearch"
    >
      Search
    </button>
  </form>
</template>
