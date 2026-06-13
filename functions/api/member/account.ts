import { getCurrentUser, publicUser, type UserRow } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, hashPassword, verifyPassword, type Env } from '../../_lib/db'
import { boundedText, passwordInput } from '../../_lib/input'
import { enforceRateLimits, rateLimitResponse, requestIp } from '../../_lib/rate-limit'

type AccountPayload = {
  action?: 'profile' | 'password' | 'logoutAll'
  name?: string
  currentPassword?: string
  newPassword?: string
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  try {
    await ensureSchema(env)
    const currentUser = await getCurrentUser(env, request)
    if (!currentUser) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as AccountPayload
    const sql = getSql(env)
    const [user] = (await sql`
      select id, name, email, password_hash, role, access_level, status
      from users where lower(email) = ${currentUser.email.toLowerCase()} limit 1
    `) as UserRow[]
    if (!user) return Response.json({ ok: false, error: 'ไม่พบบัญชีผู้ใช้' }, { status: 404 })
    const rateLimit = await enforceRateLimits(env, [
      {
        action: 'account:mutation',
        identifier: `${requestIp(request)}:${currentUser.email}`,
        limit: 30,
        windowSeconds: 3600,
        blockSeconds: 1800,
      },
      ...(body.action === 'password'
        ? [{
            action: 'account:password',
            identifier: currentUser.email,
            limit: 5,
            windowSeconds: 1800,
            blockSeconds: 1800,
          }]
        : []),
    ])
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)

    if (body.action === 'profile') {
      let name = ''
      try {
        name = boundedText(body.name, 'ชื่อ', { min: 2, max: 120 })
      } catch (error) {
        return Response.json({ ok: false, error: error instanceof Error ? error.message : 'ชื่อไม่ถูกต้อง' }, { status: 400 })
      }
      if (name === user.name) return Response.json({ ok: true, user: publicUser(user) })
      const [updated] = (await sql`
        update users set name = ${name}, updated_at = now() where id = ${user.id}
        returning id, name, email, password_hash, role, access_level, status
      `) as UserRow[]
      await writeAuditLog(env, currentUser, 'update_profile', 'user', user.id)
      return Response.json({ ok: true, user: publicUser(updated) })
    }

    if (body.action === 'password') {
      let currentPassword = ''
      let newPassword = ''
      try {
        currentPassword = passwordInput(body.currentPassword, 1)
        newPassword = passwordInput(body.newPassword, 10)
      } catch {
        return Response.json({ ok: false, error: 'รหัสผ่านใหม่ต้องมี 10-200 ตัวอักษร' }, { status: 400 })
      }
      if (!(await verifyPassword(currentPassword, user.password_hash))) {
        await writeErrorLog(env, 'member.account.password_failed', 'Invalid current password', {
          email: currentUser.email,
        })
        return Response.json({ ok: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
      }
      if (await verifyPassword(newPassword, user.password_hash)) {
        return Response.json({ ok: false, error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน' }, { status: 400 })
      }
      await sql`update users set password_hash = ${await hashPassword(newPassword)}, updated_at = now() where id = ${user.id}`
      await sql`delete from sessions where user_id = ${user.id}`
      await writeAuditLog(env, currentUser, 'change_password', 'user', user.id)
      return Response.json({ ok: true, signedOut: true })
    }

    if (body.action === 'logoutAll') {
      await sql`delete from sessions where user_id = ${user.id}`
      await writeAuditLog(env, currentUser, 'logout_all_sessions', 'user', user.id)
      return Response.json({ ok: true, signedOut: true })
    }

    return Response.json({ ok: false, error: 'คำสั่งไม่ถูกต้อง' }, { status: 400 })
  } catch (error) {
    await writeErrorLog(env, 'member.account', error)
    return Response.json({ ok: false, error: 'จัดการบัญชีไม่สำเร็จ' }, { status: 500 })
  }
}
