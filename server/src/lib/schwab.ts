import { prisma } from './db'
import { decrypt, encrypt } from './crypto'
import { requireEnv, SCHWAB_API_BASE, SCHWAB_AUTH_BASE } from './env'

interface SchwabTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope?: string
  id_token?: string
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 días (límite duro de Schwab)
const ACCESS_TOKEN_SKEW_MS = 60 * 1000 // refrescar 1 min antes de expirar

export class SchwabReauthRequired extends Error {
  constructor(message = 'La sesión de Schwab expiró, vuelve a iniciar sesión') {
    super(message)
    this.name = 'SchwabReauthRequired'
  }
}

function basicAuthHeader(): string {
  const id = requireEnv('SCHWAB_CLIENT_ID')
  const secret = requireEnv('SCHWAB_CLIENT_SECRET')
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv('SCHWAB_CLIENT_ID'),
    redirect_uri: requireEnv('SCHWAB_CALLBACK_URL'),
    response_type: 'code',
    state,
  })
  return `${SCHWAB_AUTH_BASE}/authorize?${params.toString()}`
}

async function postToken(body: URLSearchParams): Promise<SchwabTokenResponse> {
  const res = await fetch(`${SCHWAB_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error de token Schwab (${res.status}): ${text}`)
  }
  return (await res.json()) as SchwabTokenResponse
}

export function exchangeCode(code: string): Promise<SchwabTokenResponse> {
  return postToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: requireEnv('SCHWAB_CALLBACK_URL'),
    }),
  )
}

function refreshAccessToken(refreshToken: string): Promise<SchwabTokenResponse> {
  return postToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  )
}

export async function persistTokens(
  userId: string,
  tokens: SchwabTokenResponse,
  opts: { refreshExpiresAt?: Date } = {},
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
  const refreshExpiresAt = opts.refreshExpiresAt ?? new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  const data = {
    accessTokenEnc: encrypt(tokens.access_token),
    refreshTokenEnc: encrypt(tokens.refresh_token),
    expiresAt,
    refreshExpiresAt,
  }
  await prisma.schwabToken.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}

async function getValidAccessToken(userId: string): Promise<string> {
  const token = await prisma.schwabToken.findUnique({ where: { userId } })
  if (!token) throw new SchwabReauthRequired()

  if (token.refreshExpiresAt.getTime() <= Date.now()) {
    throw new SchwabReauthRequired()
  }

  if (token.expiresAt.getTime() - ACCESS_TOKEN_SKEW_MS > Date.now()) {
    return decrypt(token.accessTokenEnc)
  }

  // Access token vencido: refrescar conservando el límite duro de 7 días.
  const refreshToken = decrypt(token.refreshTokenEnc)
  let refreshed: SchwabTokenResponse
  try {
    refreshed = await refreshAccessToken(refreshToken)
  } catch {
    throw new SchwabReauthRequired()
  }
  await persistTokens(userId, refreshed, { refreshExpiresAt: token.refreshExpiresAt })
  return refreshed.access_token
}

export async function schwabFetch<T>(userId: string, path: string): Promise<T> {
  const accessToken = await getValidAccessToken(userId)
  const res = await fetch(`${SCHWAB_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (res.status === 401) {
    throw new SchwabReauthRequired()
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error de API Schwab (${res.status}): ${text}`)
  }
  return (await res.json()) as T
}

export interface AccountNumber {
  accountNumber: string
  hashValue: string
}

export async function fetchWithToken<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${SCHWAB_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error de API Schwab (${res.status}): ${text}`)
  }
  return (await res.json()) as T
}

export function getAccountNumbersWithToken(accessToken: string): Promise<AccountNumber[]> {
  return fetchWithToken<AccountNumber[]>(accessToken, '/trader/v1/accounts/accountNumbers')
}

export function getAccountNumbers(userId: string): Promise<AccountNumber[]> {
  return schwabFetch<AccountNumber[]>(userId, '/trader/v1/accounts/accountNumbers')
}
