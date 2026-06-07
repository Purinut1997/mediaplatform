import { loginWithPassword, sessionCookie } from '../../_lib/auth'
import { writeErrorLog } from '../../_lib/admin'
import { validateBotCheck, type BotCheckPayload } from '../../_lib/bot'
import type { Env } from '../../_lib/db'
import { enforceRateLimits, rateLimitResponse, requestIp } from '../../_lib/rate-limit'

type LoginPayload = BotCheckPayload & {
  email?: string
  password?: string
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const body = (await request.json().catch(() => ({}))) as LoginPayload
  const email = String(body.email ?? '').trim()
  const password = String(body.password ?? '')
  const ip = requestIp(request)
  const rateLimit = await enforceRateLimits(env, [
    { action: 'login:ip', identifier: ip, limit: 15, windowSeconds: 900, blockSeconds: 900 },
    {
      action: 'login:account',
      identifier: `${ip}:${email.toLowerCase()}`,
      limit: 8,
      windowSeconds: 900,
      blockSeconds: 900,
    },
  ])
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)
  const botError = await validateBotCheck(body, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'))

  if (botError) {
    await writeErrorLog(env, 'auth.login.bot_check', botError, { email })
    return Response.json({ ok: false, error: botError }, { status: 400 })
  }

  if (!email || !password) {
    return Response.json(
      { ok: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
      { status: 400 },
    )
  }

  let result
  try {
    result = await loginWithPassword(env, email, password)
  } catch (error) {
    console.error('Login failed', error)
    await writeErrorLog(env, 'auth.login.error', error, { email })
    return Response.json(
      {
        ok: false,
        error: 'ระบบเข้าสู่ระบบมีปัญหา กรุณาลองใหม่อีกครั้ง',
      },
      { status: 500 },
    )
  }
  if (!result) {
    await writeErrorLog(env, 'auth.login.failed', 'Invalid credentials', { email })
    return Response.json(
      { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
      { status: 401 },
    )
  }

  return Response.json(
    { ok: true, user: result.user },
    { headers: { 'Set-Cookie': sessionCookie(result.token) } },
  )
}
