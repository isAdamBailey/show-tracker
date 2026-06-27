export function formatShowDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatShowTime(isoTime: string): string {
  const [h, m] = isoTime.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function getUrgencyLabel(isoDate: string): 'Tonight' | 'Tomorrow' | 'This Week' | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, mo, d] = isoDate.split('-').map(Number)
  const showDate = new Date(y, mo - 1, d)
  const diffDays = Math.round((showDate.getTime() - today.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Tonight'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 6) return 'This Week'
  return null
}
