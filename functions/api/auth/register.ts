import { loginWithPassword, sessionCookie } from '../../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { validateBotCheck, type BotCheckPayload } from '../../_lib/bot'
import { ensureSchema, getSql, hashPassword, type Env } from '../../_lib/db'
import { boundedText, InputValidationError, normalizedEmail, passwordInput } from '../../_lib/input'
import { notifyTelegram } from '../../_lib/notify'
import { writeNotification } from '../../_lib/notifications'
import { enforceRateLimits, rateLimitResponse, requestIp } from '../../_lib/rate-limit'

type RegisterPayload = BotCheckPayload & {
  name?: string
  phone?: string
  email?: string
  password?: string
  membership?: 'member' | 'vip'
  slipName?: string
}

function readRegisterInput(body: RegisterPayload) {
  return {
    name: boundedText(body.name, 'ชื่อ', { min: 2, max: 120 }),
    email: normalizedEmail(body.email),
    password: passwordInput(body.password),
    phone: boundedText(body.phone, 'เบอร์โทรศัพท์', { max: 30 }),
    slipName: boundedText(body.slipName, 'ชื่อไฟล์สลิป', { max: 200 }),
  }
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as RegisterPayload
  let input: ReturnType<typeof readRegisterInput>
  try {
    input = readRegisterInput(body)
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof InputValidationError ? error.message : 'ข้อมูลสมัครสมาชิกไม่ถูกต้อง' },
      { status: 400 },
    )
  }
  const { name, email, password, phone, slipName } = input
  const membership = body.membership === 'vip' ? 'vip' : 'member'
  const rateLimit = await enforceRateLimits(env, [
    {
      action: 'register:ip',
      identifier: requestIp(request),
      limit: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
    },
  ])
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter)
  const botError = await validateBotCheck(body, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'))

  if (botError) {
    await writeErrorLog(env, 'auth.register.bot_check', botError, { email })
    return Response.json({ ok: false, error: botError }, { status: 400 })
  }

  if (membership === 'vip') {
    const [settings] = await sql`
      select coalesce((value->>'vipRegistrationEnabled')::boolean, false) as enabled
      from app_settings
      where key = 'site'
      limit 1
    `
    if (!settings?.enabled) {
      return Response.json({ ok: false, error: 'ขณะนี้ระบบยังไม่เปิดรับสมัคร VIP' }, { status: 403 })
    }
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
    const [vipRequest] = await sql`
      insert into vip_requests (user_id, name, email, phone, slip_name)
      values (${user.id}, ${name}, ${email}, ${phone || null}, ${slipName || null})
      returning id
    `
    await writeNotification(env, {
      audience: 'superadmin',
      type: 'vip_pending',
      title: 'มีคำขอ VIP ใหม่',
      detail: `${name} (${email}) รอการตรวจสอบ`,
      tone: 'amber',
      targetType: 'vip_request',
      targetId: vipRequest?.id,
      fingerprint: `vip_request:${vipRequest?.id ?? email}`,
    })
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
