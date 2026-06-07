import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, hashPassword, sha256Hex, type Env } from '../../_lib/db'
import { enforceRateLimits, rateLimitResponse, requestIp } from '../../_lib/rate-limit'
import { passwordInput } from '../../_lib/input'

type Payload = { token?: string; password?: string }

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const body = (await request.json().catch(() => ({}))) as Payload
    const token = String(body.token ?? '')
    let password = ''
    try {
      password = passwordInput(body.password, 10)
    } catch {
      return Response.json({ ok: false, error: 'รหัสผ่านต้องมี 10-200 ตัวอักษร' }, { status: 400 })
    }
    const ip = requestIp(request)
    const rateLimit = await enforceRateLimits(env, [
      { action: 'reset:ip', identifier: ip, limit: 10, windowSeconds: 3600, blockSeconds: 3600 },
      {
        action: 'reset:token',
        identifier: `${ip}:${token}`,
        limit: 5,
        windowSeconds: 3600,
        blockSeconds: 3600,
      },
    ])
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)
    if (!token || token.length > 200) {
      return Response.json({ ok: false, error: 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้อง' }, { status: 400 })
    }
    const sql = getSql(env)
    const [reset] = await sql`
      select password_reset_tokens.id, password_reset_tokens.user_id, users.email
      from password_reset_tokens join users on users.id = password_reset_tokens.user_id
      where token_hash = ${await sha256Hex(token)} and used_at is null and expires_at > now()
      limit 1
    `
    if (!reset) return Response.json({ ok: false, error: 'ลิงก์หมดอายุหรือถูกใช้งานแล้ว' }, { status: 400 })
    await sql`update users set password_hash = ${await hashPassword(password)}, updated_at = now() where id = ${reset.user_id}`
    await sql`update password_reset_tokens set used_at = now() where id = ${reset.id}`
    await sql`delete from sessions where user_id = ${reset.user_id}`
    await writeAuditLog(env, String(reset.email), 'reset_password', 'user', reset.user_id)
    return Response.json({ ok: true })
  } catch (error) {
    await writeErrorLog(env, 'auth.reset_password', error)
    return Response.json({ ok: false, error: 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ' }, { status: 500 })
  }
}
