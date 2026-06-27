<script setup lang="ts">
import { computed, ref } from 'vue'
import { CITY_OPTIONS } from '../data/cities'

const model = defineModel<string>({ default: '' })

const isOpen = ref<boolean>(false)
const listboxId = 'city-suggestions'

const normalizedQuery = computed<string>(() => model.value.trim().toLowerCase())

const filteredCities = computed<string[]>(() => {
  const query = normalizedQuery.value
  if (query.length === 0) {
    return []
  }

  return CITY_OPTIONS.filter((city) => city.toLowerCase().startsWith(query)).slice(0, 8)
})

const showSuggestions = computed<boolean>(
  () => isOpen.value && normalizedQuery.value.length > 0 && filteredCities.value.length > 0
)

const openSuggestions = (): void => {
  isOpen.value = true
}

const closeSuggestions = (): void => {
  isOpen.value = false
}

const selectCity = (city: string): void => {
  model.value = city
  closeSuggestions()
}
</script>

<template>
  <div class="relative w-full md:w-44">
    <label class="sr-only" for="search-city">City</label>
    <input
      id="search-city"
      v-model="model"
      type="text"
      autocomplete="off"
      role="combobox"
      :aria-expanded="showSuggestions"
      :aria-controls="listboxId"
      aria-autocomplete="list"
      class="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
      placeholder="City (optional)"
      @focus="openSuggestions"
      @input="openSuggestions"
      @blur="closeSuggestions"
      @keydown.enter="closeSuggestions"
    >
    <ul
      v-if="showSuggestions"
      :id="listboxId"
      role="listbox"
      class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 py-1 shadow-lg shadow-zinc-950/60"
    >
      <li
        v-for="city in filteredCities"
        :key="city"
        role="option"
        class="cursor-pointer px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
        @mousedown.prevent="selectCity(city)"
      >
        {{ city }}
      </li>
    </ul>
  </div>
</template>
