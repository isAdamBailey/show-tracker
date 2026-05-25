<script setup lang="ts">
import { ref } from 'vue'

type SearchMode = 'artist' | 'genre'

const searchMode = ref<SearchMode>('artist')
const searchValue = ref<string>('')

const isEmptySearch = (value: string): boolean => {
  return value.trim().length === 0
}

const submitSearch = async (): Promise<void> => {
  if (isEmptySearch(searchValue.value)) {
    return
  }

  const encodedValue = encodeURIComponent(searchValue.value)
  const targetPath =
    searchMode.value === 'artist' ? `/artist/${encodedValue}` : `/genre/${encodedValue}`

  await navigateTo(targetPath)
}
</script>

<template>
  <form
    class="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 md:flex-row md:items-center"
    @submit.prevent="submitSearch"
  >
    <label class="sr-only" for="search-mode">Search mode</label>
    <select
      id="search-mode"
      v-model="searchMode"
      class="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500"
    >
      <option value="artist">Artist</option>
      <option value="genre">Genre</option>
    </select>

    <label class="sr-only" for="search-value">Search value</label>
    <input
      id="search-value"
      v-model="searchValue"
      type="text"
      class="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500"
      :placeholder="searchMode === 'artist' ? 'Search artist' : 'Search genre'"
    >

    <button
      type="submit"
      class="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="isEmptySearch(searchValue)"
    >
      Search
    </button>
  </form>
</template>
