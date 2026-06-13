import { createSession, sessionCookie, type UserRow } from '../../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../../_lib/admin'
import { ensureSchema, getSql, hashPassword, randomHex, type Env } from '../../../_lib/db'
import {
  clearGoogleStateCookie,
  exchangeGoogleCode,
  googleOAuthConfigured,
  readGoogleState,
} from '../../../_lib/google-oauth'
import { normalizedEmail } from '../../../_lib/input'
import { enforceRateLimits, requestIp } from '../../../_lib/rate-limit'

function redirect(env: Env, request: Request, result: string, session?: string) {
  const appUrl = env.APP_URL ? String(env.APP_URL).replace(/\/+$/, '') : new URL(request.url).origin
  const response = Response.redirect(`${appUrl}/?oauth=${result}`, 302)
  response.headers.append('Set-Cookie', clearGoogleStateCookie())
  if (session) response.headers.append('Set-Cookie', sessionCookie(session))
  return response
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!googleOAuthConfigured(env)) return redirect(env, request, 'not_configured')
  const url = new URL(request.url)
  const state = url.searchParams.get('state') ?? ''
  const code = url.searchParams.get('code') ?? ''
  if (!state || state !== readGoogleState(request) || !code || code.length > 4_096) {
    return redirect(env, request, 'invalid_state')
  }

  const rateLimit = await enforceRateLimits(env, [{
    action: 'oauth:google',
    identifier: requestIp(request),
    limit: 12,
    windowSeconds: 900,
    blockSeconds: 900,
  }])
  if (!rateLimit.allowed) {
    const response = redirect(env, request, 'rate_limited')
    response.headers.set('Retry-After', String(rateLimit.retryAfter))
    return response
  }

  try {
    await ensureSchema(env)
    const profile = await exchangeGoogleCode(env, code)
    const email = normalizedEmail(profile.email)
    const name = String(profile.name ?? email.split('@')[0]).trim().slice(0, 120) || 'Google Member'
    const sql = getSql(env)
    let [user] = (await sql`
      select id, name, email, password_hash, role, access_level, status
      from users where lower(email) = ${email} limit 1
    `) as UserRow[]
    let created = false

    if (!user) {
      const passwordHash = await hashPassword(randomHex(32))
      const [inserted] = await sql`
        insert into users (name, email, password_hash, role, access_level, status)
        values (${name}, ${email}, ${passwordHash}, 'member', 'สมาชิก', 'active')
        on conflict (email) do nothing
        returning id
      `
      ;[user] = (await sql`
        select id, name, email, password_hash, role, access_level, status
        from users where lower(email) = ${email} limit 1
      `) as UserRow[]
      created = Boolean(inserted?.id)
    }

    if (!user || user.status !== 'active') return redirect(env, request, 'account_disabled')
    const login = await createSession(sql, user)
    await writeAuditLog(env, email, created ? 'register_google' : 'login_google', 'user', user.id)
    return redirect(env, request, 'success', login.token)
  } catch (error) {
    await writeErrorLog(env, 'auth.google', error)
    return redirect(env, request, 'failed')
  }
}
