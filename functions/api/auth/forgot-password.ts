import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { validateBotCheck, type BotCheckPayload } from '../../_lib/bot'
import { ensureSchema, getSql, randomHex, sha256Hex, type Env } from '../../_lib/db'
import { sendEmail } from '../../_lib/email'
import { normalizedEmail } from '../../_lib/input'
import { enforceRateLimits, rateLimitResponse, requestIp } from '../../_lib/rate-limit'

type Payload = BotCheckPayload & { email?: string }

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as Payload
    let email = ''
    try {
      email = normalizedEmail(body.email)
    } catch {
      return Response.json({ ok: true, message: 'หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้' })
    }
    const ip = requestIp(request)
    const rateLimit = await enforceRateLimits(env, [
      { action: 'forgot:ip', identifier: ip, limit: 8, windowSeconds: 3600, blockSeconds: 3600 },
      {
        action: 'forgot:account',
        identifier: `${ip}:${email}`,
        limit: 3,
        windowSeconds: 3600,
        blockSeconds: 3600,
      },
    ])
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)
    const botError = await validateBotCheck(body, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'))
    if (botError) return Response.json({ ok: false, error: botError }, { status: 400 })

    const sql = getSql(env)
    const [user] = await sql`select id, name, email from users where lower(email) = ${email} and status = 'active' limit 1`
    if (user) {
      const token = randomHex(32)
      await sql`delete from password_reset_tokens where user_id = ${user.id} or expires_at < now()`
      await sql`
        insert into password_reset_tokens (user_id, token_hash, expires_at)
        values (${user.id}, ${await sha256Hex(token)}, now() + interval '30 minutes')
      `
      const appUrl = env.APP_URL || new URL(request.url).origin
      await sendEmail(
        env,
        String(user.email),
        'ตั้งรหัสผ่านใหม่ - MIKPURINUT Nexus',
        `<p>สวัสดี ${String(user.name)}</p><p>กดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ภายใน 30 นาที:</p><p><a href="${appUrl}/?reset=${token}">ตั้งรหัสผ่านใหม่</a></p><p>หากคุณไม่ได้ส่งคำขอ สามารถละเว้นอีเมลนี้ได้</p>`,
      )
      await writeAuditLog(env, email, 'request_password_reset', 'user', user.id)
    }
    return Response.json({ ok: true, message: 'หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้' })
  } catch (error) {
    await writeErrorLog(env, 'auth.forgot_password', error)
    return Response.json({ ok: false, error: 'ส่งคำขอตั้งรหัสผ่านใหม่ไม่สำเร็จ' }, { status: 500 })
  }
}
