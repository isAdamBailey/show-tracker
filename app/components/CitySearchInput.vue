<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CITY_OPTIONS } from '../data/cities'

const model = defineModel<string>({ default: '' })

const isOpen = ref<boolean>(false)
const highlightedIndex = ref<number>(0)
const listboxId = 'city-suggestions'

const normalizedQuery = computed<string>(() => model.value.trim().toLowerCase())

const filteredCities = computed<string[]>(() => {
  const query = normalizedQuery.value
  if (query.length === 0) return []
  return CITY_OPTIONS.filter((city) => city.toLowerCase().startsWith(query)).slice(0, 8)
})

const showSuggestions = computed<boolean>(
  () => isOpen.value && normalizedQuery.value.length > 0 && filteredCities.value.length > 0
)

watch(filteredCities, () => {
  highlightedIndex.value = 0
})

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

const onKeydown = (e: KeyboardEvent): void => {
  if (!showSuggestions.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredCities.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    const city = filteredCities.value[highlightedIndex.value]
    if (city) selectCity(city)
    // don't prevent default — let the form submit after selecting
  }
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
      :aria-activedescendant="showSuggestions ? `city-opt-${highlightedIndex}` : undefined"
      aria-autocomplete="list"
      class="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
      placeholder="City (optional)"
      @focus="openSuggestions"
      @input="openSuggestions"
      @blur="closeSuggestions"
      @keydown="onKeydown"
    >
    <ul
      v-if="showSuggestions"
      :id="listboxId"
      role="listbox"
      class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 py-1 shadow-lg shadow-zinc-950/60"
    >
      <li
        v-for="(city, i) in filteredCities"
        :id="`city-opt-${i}`"
        :key="city"
        role="option"
        :aria-selected="i === highlightedIndex"
        :class="['cursor-pointer px-3 py-2 text-sm text-slate-100 transition', i === highlightedIndex ? 'bg-slate-800' : 'hover:bg-slate-800']"
        @mousedown.prevent="selectCity(city)"
        @mouseover="highlightedIndex = i"
      >
        {{ city }}
      </li>
    </ul>
  </div>
</template>
