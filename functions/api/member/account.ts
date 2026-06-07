import { getCurrentUser, publicUser, type UserRow } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, getSql, hashPassword, verifyPassword, type Env } from '../../_lib/db'

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

    if (body.action === 'profile') {
      const name = String(body.name ?? '').trim()
      if (name.length < 2) return Response.json({ ok: false, error: 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร' }, { status: 400 })
      const [updated] = (await sql`
        update users set name = ${name}, updated_at = now() where id = ${user.id}
        returning id, name, email, password_hash, role, access_level, status
      `) as UserRow[]
      await writeAuditLog(env, currentUser, 'update_profile', 'user', user.id)
      return Response.json({ ok: true, user: publicUser(updated) })
    }

    if (body.action === 'password') {
      const currentPassword = String(body.currentPassword ?? '')
      const newPassword = String(body.newPassword ?? '')
      if (!(await verifyPassword(currentPassword, user.password_hash))) {
        return Response.json({ ok: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
      }
      if (newPassword.length < 10) {
        return Response.json({ ok: false, error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 10 ตัวอักษร' }, { status: 400 })
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
