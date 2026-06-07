import { ensureSchema, getSql, sha256Hex, type Env } from './db'

export type RateLimitRule = {
  action: string
  identifier: string
  limit: number
  windowSeconds: number
  blockSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  retryAfter: number
}

export function requestIp(request: Request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function enforceRateLimits(env: Env, rules: RateLimitRule[]) {
  await ensureSchema(env)
  const results = await Promise.all(rules.map((rule) => consumeRateLimit(env, rule)))
  return results.reduce<RateLimitResult>(
    (result, current) => ({
      allowed: result.allowed && current.allowed,
      retryAfter: Math.max(result.retryAfter, current.retryAfter),
    }),
    { allowed: true, retryAfter: 0 },
  )
}

export function rateLimitResponse(retryAfter: number) {
  return Response.json(
    {
      ok: false,
      error: 'มีคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
      retryAfter,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, retryAfter)) },
    },
  )
}

async function consumeRateLimit(env: Env, rule: RateLimitRule) {
  const sql = getSql(env)
  const keyHash = await sha256Hex(`${rule.action}:${rule.identifier}`)
  const [row] = await sql`
    insert into request_limits (
      key_hash, action, window_started_at, attempts, blocked_until, updated_at
    )
    values (${keyHash}, ${rule.action}, now(), 1, null, now())
    on conflict (key_hash, action) do update set
      attempts = case
        when request_limits.window_started_at <= now() - make_interval(secs => ${rule.windowSeconds})
          then 1
        else request_limits.attempts + 1
      end,
      window_started_at = case
        when request_limits.window_started_at <= now() - make_interval(secs => ${rule.windowSeconds})
          then now()
        else request_limits.window_started_at
      end,
      blocked_until = case
        when request_limits.blocked_until > now()
          then request_limits.blocked_until
        when request_limits.window_started_at <= now() - make_interval(secs => ${rule.windowSeconds})
          then null
        when request_limits.attempts + 1 > ${rule.limit}
          then now() + make_interval(secs => ${rule.blockSeconds})
        else null
      end,
      updated_at = now()
    returning attempts, blocked_until
  `
  const blockedUntil = row?.blocked_until ? new Date(String(row.blocked_until)).getTime() : 0
  return {
    allowed: !blockedUntil || blockedUntil <= Date.now(),
    retryAfter: blockedUntil ? Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1000)) : 0,
  }
}
