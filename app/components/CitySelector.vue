<script setup lang="ts">
import { computed } from 'vue'
import { useMusicCacheStore } from '../stores/music-cache'

type CityChoice = 'auto' | 'portland'

const musicCacheStore = useMusicCacheStore()

const selectedCityChoice = computed<CityChoice>({
  get: () => {
    return musicCacheStore.location.selectedCity === 'portland' ? 'portland' : 'auto'
  },
  set: (value) => {
    musicCacheStore.setSelectedCity(value === 'auto' ? null : value)
  }
})
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="city-selector" class="text-xs text-slate-400">City filter</label>
    <select
      id="city-selector"
      v-model="selectedCityChoice"
      class="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none transition focus:border-sky-500"
    >
      <option value="auto">Auto (location/Portland fallback)</option>
      <option value="portland">Portland</option>
    </select>
  </div>
</template>
