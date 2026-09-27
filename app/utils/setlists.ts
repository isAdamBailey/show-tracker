import type { SetlistItem, SetlistSet, SetlistSong } from '../types/music'

export interface DisplaySong {
  name: string
  /** Continues across sets; null for tape entries, which aren't numbered. */
  number: number | null
  note: string | null
  tape: boolean
}

export interface DisplaySet {
  label: string
  encore: boolean
  songs: DisplaySong[]
}

const toArray = <T>(input: T | T[] | undefined): T[] => {
  if (!input) return []
  return Array.isArray(input) ? input : [input]
}

const getSongNote = (song: SetlistSong): string | null => {
  if (song.tape) return 'tape'
  const notes: string[] = []
  if (song.cover?.name?.trim()) notes.push(`cover of ${song.cover.name.trim()}`)
  if (song.info?.trim()) notes.push(song.info.trim())
  return notes.length > 0 ? notes.join('; ') : null
}

const getSetLabel = (set: SetlistSet, mainSetIndex: number, mainSetCount: number): string => {
  if (set.encore) return set.encore > 1 ? `Encore ${set.encore}` : 'Encore'
  const name = set.name?.trim().replace(/:$/, '')
  if (name) return name
  return mainSetCount > 1 ? `Set ${mainSetIndex + 1}` : 'Set'
}

export const getDisplaySets = (entry: SetlistItem): DisplaySet[] => {
  const sets = toArray<SetlistSet>(entry.sets?.set)
  const mainSetCount = sets.filter((set) => !set.encore).length
  let mainSetIndex = 0
  let songNumber = 0

  return sets
    .map((set) => {
      const label = getSetLabel(set, mainSetIndex, mainSetCount)
      if (!set.encore) mainSetIndex += 1

      const songs = toArray<SetlistSong>(set.song)
        .filter((song) => Boolean(song.name?.trim()))
        .map((song) => {
          const tape = Boolean(song.tape)
          if (!tape) songNumber += 1
          return { name: song.name!.trim(), number: tape ? null : songNumber, note: getSongNote(song), tape }
        })

      return { label, encore: Boolean(set.encore), songs }
    })
    .filter((set) => set.songs.length > 0)
}

/** Played songs only; tape entries don't count. */
export const countSongs = (sets: DisplaySet[]): number =>
  sets.reduce((total, set) => total + set.songs.filter((song) => !song.tape).length, 0)

/** "Seattle, WA" / "London, United Kingdom". */
export const formatSetlistCity = (entry: SetlistItem): string => {
  const city = entry.venue?.city
  if (!city?.name) return ''
  const region = city.country?.code === 'US' || city.country?.code === 'CA' ? city.stateCode : city.country?.name
  return [city.name, region].filter(Boolean).join(', ')
}
