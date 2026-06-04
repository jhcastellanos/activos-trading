import { getIronSession, type SessionOptions } from 'iron-session'
import type { IncomingMessage, ServerResponse } from 'node:http'

export interface SessionData {
  userId?: string
  // state temporal para el flujo OAuth (anti-CSRF)
  oauthState?: string
}

export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres')
  }
  return {
    password,
    cookieName: 'activos_session',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días (alineado con el refresh token de Schwab)
    },
  }
}

export function getSession(req: IncomingMessage, res: ServerResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions())
}
