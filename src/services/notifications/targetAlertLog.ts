import type { TargetAlertPayload } from '../../business/targetAlerts'

const LOG_KEY = 'activos-trading:target-alerts-log'

export type TargetAlertLogEntry = TargetAlertPayload & {
  id: string
  sentAt: string
}

type DailyLog = {
  date: string
  entries: TargetAlertLogEntry[]
}

export const TARGET_ALERTS_LOG_CHANGED = 'activos-trading:target-alerts-log-changed'

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA')
}

function loadRaw(): DailyLog {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return { date: todayKey(), entries: [] }
    const parsed = JSON.parse(raw) as DailyLog
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
      return { date: todayKey(), entries: [] }
    }
    return parsed
  } catch {
    return { date: todayKey(), entries: [] }
  }
}

function save(log: DailyLog): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log))
    window.dispatchEvent(new Event(TARGET_ALERTS_LOG_CHANGED))
  } catch {
    // ignore
  }
}

/** Más reciente primero (descendente por hora del día). */
export function sortAlertLogNewestFirst(entries: TargetAlertLogEntry[]): TargetAlertLogEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  )
}

/** Devuelve el historial del día actual; limpia automáticamente si cambió la fecha. */
export function getTodayAlertLog(): TargetAlertLogEntry[] {
  const log = loadRaw()
  if (log.date !== todayKey()) {
    save({ date: todayKey(), entries: [] })
    return []
  }
  return sortAlertLogNewestFirst(log.entries)
}

export function appendTodayAlertLog(alert: TargetAlertPayload, sentAt = new Date()): TargetAlertLogEntry {
  const log = loadRaw()
  const date = todayKey()
  const entries = log.date === date ? log.entries : []

  const entry: TargetAlertLogEntry = {
    ...alert,
    id: `${alert.lotId}-${sentAt.getTime()}`,
    sentAt: sentAt.toISOString(),
  }

  save({ date, entries: [entry, ...entries] })
  return entry
}
