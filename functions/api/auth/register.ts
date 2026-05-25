import { loginWithPassword, sessionCookie } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { validateBotCheck, type BotCheckPayload } from '../../_lib/bot'
import { ensureSchema, getSql, hashPassword, type Env } from '../../_lib/db'
import { notifyTelegram } from '../../_lib/notify'

type RegisterPayload = BotCheckPayload & {
  name?: string
  phone?: string
  email?: string
  password?: string
  membership?: 'member' | 'vip'
  slipName?: string
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as RegisterPayload
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const phone = String(body.phone ?? '').trim()
  const membership = body.membership === 'vip' ? 'vip' : 'member'
  const botError = validateBotCheck(body)

  if (botError) {
    await writeErrorLog(env, 'auth.register.bot_check', botError, { email })
    return Response.json({ ok: false, error: botError }, { status: 400 })
  }

  if (!name || !email || password.length < 8) {
    return Response.json(
      { ok: false, error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร' },
      { status: 400 },
    )
  }

  const [existing] = (await sql`
    select id from users where lower(email) = ${email} limit 1
  `) as Array<{ id: number }>

  if (existing) {
    await writeErrorLog(env, 'auth.register.duplicate_email', 'Duplicate email', { email })
    return Response.json(
      { ok: false, error: 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว' },
      { status: 409 },
    )
  }

  const passwordHash = await hashPassword(password)
  const [user] = (await sql`
    insert into users (name, email, password_hash, role, access_level, status)
    values (${name}, ${email}, ${passwordHash}, 'member', 'สมาชิก', 'active')
    returning id
  `) as Array<{ id: number }>

  if (membership === 'vip') {
    await sql`
      insert into vip_requests (user_id, name, email, phone, slip_name)
      values (${user.id}, ${name}, ${email}, ${phone || null}, ${body.slipName ?? null})
    `
    await notifyTelegram(env, `MIKPURINUT Media Platform\nมีคำขอ VIP ใหม่\nชื่อ: ${name}\nอีเมล: ${email}`)
  }
  await writeAuditLog(env, email, 'register_user', 'user', user.id, { membership })

  const login = await loginWithPassword(env, email, password)
  if (!login) {
    await writeErrorLog(env, 'auth.register.login_after_create', 'Login after registration failed', { email })
    return Response.json({ ok: false, error: 'สมัครสำเร็จ แต่เข้าสู่ระบบไม่สำเร็จ' }, { status: 500 })
  }

  return Response.json(
    { ok: true, user: login.user, vipPending: membership === 'vip' },
    { status: 201, headers: { 'Set-Cookie': sessionCookie(login.token) } },
  )
}
