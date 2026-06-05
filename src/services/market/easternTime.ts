/** Partes de fecha/hora en America/New_York (ET). */
export interface EasternDateTime {
  date: string // YYYY-MM-DD
  time: string // HH:mm:ss
  iso: string // ISO local ET como referencia legible
  dayOfWeek: number // 0=Dom … 6=Sáb
  instant: Date
}

export function toEastern(now: Date = new Date()): EasternDateTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  const second = get('second')
  const weekday = get('weekday')

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`,
    iso: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    dayOfWeek: weekdayMap[weekday] ?? 0,
    instant: now,
  }
}
