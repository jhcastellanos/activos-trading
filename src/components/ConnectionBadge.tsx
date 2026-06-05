import type { ConnectionMode } from '../domain/types'

const labels: Record<ConnectionMode, string> = {
  demo: 'Modo Demo',
  disconnected: 'Desconectado',
  schwab: 'Schwab conectado',
}

export function ConnectionBadge({ mode }: { mode: ConnectionMode }) {
  return <span className={`badge badge-${mode}`}>{labels[mode]}</span>
}
