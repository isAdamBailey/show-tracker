export type FeedTab = 'tonight' | 'week' | 'month'

export const FEED_TABS: readonly FeedTab[] = ['tonight', 'week', 'month']

/** Days after today each tab reaches (inclusive). The Month fetch backs all three. */
const TAB_DAY_SPAN: Record<FeedTab, number> = {
  tonight: 0,
  week: 6,
  month: 30
}

const pad = (value: number): string => String(value).padStart(2, '0')

const parseIsoDate = (isoDate: string): Date => {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** `YYYY-MM-DD` for a Date in the viewer's local time zone. */
export const toLocalIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** `YYYY-MM-DDTHH:mm:ss` in local time, the shape SeatGeek's datetime_local filters take. */
export const toLocalIsoDateTime = (date: Date): string =>
  `${toLocalIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

/** `YYYY-MM-DDTHH:mm:ssZ`, the only shape Ticketmaster accepts (no milliseconds). */
export const toTicketmasterDateTime = (date: Date): string => `${date.toISOString().slice(0, 19)}Z`

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const endOfDay = (date: Date): Date => {
  const end = new Date(date)
  end.setHours(23, 59, 59, 0)
  return end
}

/** The window a tab covers, from now until the end of its last local day. */
export const getTabRange = (tab: FeedTab, now: Date = new Date()): { start: Date; end: Date } => ({
  start: now,
  end: endOfDay(addDays(now, TAB_DAY_SPAN[tab]))
})

/** Last local date (`YYYY-MM-DD`) a tab includes, for filtering the Month fetch client-side. */
export const getTabLastDate = (tab: FeedTab, now: Date = new Date()): string =>
  toLocalIsoDate(addDays(now, TAB_DAY_SPAN[tab]))

const getDayDiff = (isoDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((parseIsoDate(isoDate).getTime() - today.getTime()) / 86_400_000)
}

export function formatShowDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

/** "Sep 19, 2026", used for setlist history rows. */
export function formatLongDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/** "Sep 27", used for short tour-date lists. */
export function formatMonthDay(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Parts for the feed's date column: "Sat", "Sep", "26". */
export function getDateParts(isoDate: string): { weekday: string; month: string; day: number } {
  const date = parseIsoDate(isoDate)
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate()
  }
}

/** setlist.fm dates are `DD-MM-YYYY`; convert to `YYYY-MM-DD`. */
export function parseSetlistDate(eventDate: string | undefined): string | null {
  const match = eventDate?.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null
}

export function formatShowTime(isoTime: string): string {
  const [h = 0, m = 0] = isoTime.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function getUrgencyLabel(isoDate: string): 'Tonight' | 'Tomorrow' | null {
  const diffDays = getDayDiff(isoDate)
  if (diffDays === 0) return 'Tonight'
  if (diffDays === 1) return 'Tomorrow'
  return null
}
