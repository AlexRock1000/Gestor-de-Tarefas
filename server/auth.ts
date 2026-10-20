import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const cookieName = 'gestor_session'
const sessionDurationSeconds = 8 * 60 * 60
const configuredValues = [
  process.env.TASK_APP_USERNAME,
  process.env.TASK_APP_PASSWORD,
  process.env.SESSION_SECRET,
]
const authEnabled = configuredValues.some(Boolean)

if (authEnabled && configuredValues.some((value) => !value)) {
  throw new Error('Configure TASK_APP_USERNAME, TASK_APP_PASSWORD e SESSION_SECRET juntos.')
}

if (process.env.NODE_ENV === 'production' && !authEnabled) {
  throw new Error('Autenticação obrigatória em produção. Configure TASK_APP_USERNAME, TASK_APP_PASSWORD e SESSION_SECRET.')
}

if (authEnabled && (process.env.SESSION_SECRET?.length ?? 0) < 32) {
  throw new Error('SESSION_SECRET deve ter pelo menos 32 caracteres aleatórios.')
}

export const isAuthenticationEnabled = authEnabled

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export const verifyCredentials = (username: string, password: string) =>
  authEnabled &&
  safeCompare(username, process.env.TASK_APP_USERNAME ?? '') &&
  safeCompare(password, process.env.TASK_APP_PASSWORD ?? '')

const signatureFor = (payload: string) =>
  createHmac('sha256', process.env.SESSION_SECRET ?? 'development-session-secret')
    .update(payload)
    .digest('base64url')

export const createSessionToken = (username: string) => {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Math.floor(Date.now() / 1000) + sessionDurationSeconds,
  })).toString('base64url')
  return `${payload}.${signatureFor(payload)}`
}

export const getSessionUsername = (request: Request): string | null => {
  if (!authEnabled) return 'local'
  const cookieHeader = request.headers.cookie ?? ''
  const token = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  if (!token) return null

  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return null
  if (!safeCompare(signature, signatureFor(payload))) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      username?: unknown
      expiresAt?: unknown
    }
    if (typeof session.username !== 'string' || typeof session.expiresAt !== 'number') return null
    if (session.expiresAt <= Math.floor(Date.now() / 1000)) return null
    return session.username
  } catch {
    return null
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api',
  maxAge: sessionDurationSeconds * 1000,
}

export const setSessionCookie = (response: Response, token: string) => {
  response.cookie(cookieName, token, cookieOptions)
}

export const clearSessionCookie = (response: Response) => {
  response.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined })
}

export const requireSession = (request: Request, response: Response, next: NextFunction) => {
  if (!getSessionUsername(request)) {
    response.status(401).json({ message: 'Autenticação necessária.' })
    return
  }
  next()
}