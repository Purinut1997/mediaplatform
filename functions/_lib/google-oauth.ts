import { randomHex, type Env } from './db'

const GOOGLE_STATE_COOKIE = 'mp_google_state'
const GOOGLE_STATE_MAX_AGE_SECONDS = 10 * 60

export type GoogleProfile = {
  sub: string
  email: string
  email_verified: boolean
  name?: string
}

export function googleOAuthConfigured(env: Env) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.APP_URL)
}

export function googleRedirectUri(env: Env) {
  return `${String(env.APP_URL).replace(/\/+$/, '')}/api/auth/google/callback`
}

export function googleAuthorizationUrl(env: Env, state: string) {
  const query = new URLSearchParams({
    client_id: String(env.GOOGLE_CLIENT_ID),
    redirect_uri: googleRedirectUri(env),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${query}`
}

export function googleState() {
  return randomHex(32)
}

export function googleStateCookie(state: string) {
  return [
    `${GOOGLE_STATE_COOKIE}=${state}`,
    'Path=/api/auth/google/callback',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${GOOGLE_STATE_MAX_AGE_SECONDS}`,
  ].join('; ')
}

export function clearGoogleStateCookie() {
  return `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function readGoogleState(request: Request) {
  return request.headers
    .get('Cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_STATE_COOKIE}=`))
    ?.slice(GOOGLE_STATE_COOKIE.length + 1)
}

export async function exchangeGoogleCode(env: Env, code: string) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: String(env.GOOGLE_CLIENT_ID),
      client_secret: String(env.GOOGLE_CLIENT_SECRET),
      redirect_uri: googleRedirectUri(env),
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(8_000),
  })
  const token = (await tokenResponse.json().catch(() => ({}))) as { access_token?: string }
  if (!tokenResponse.ok || !token.access_token) throw new Error('Google token exchange failed')

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(8_000),
  })
  const profile = (await profileResponse.json().catch(() => ({}))) as Partial<GoogleProfile>
  if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
    throw new Error('Google profile is not verified')
  }
  return profile as GoogleProfile
}
