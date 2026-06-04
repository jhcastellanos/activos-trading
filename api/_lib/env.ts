export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable de entorno faltante: ${name}`)
  }
  return value
}

export const SCHWAB_AUTH_BASE = 'https://api.schwabapi.com/v1/oauth'
export const SCHWAB_API_BASE = 'https://api.schwabapi.com'
