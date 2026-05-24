import { loginWithPassword, sessionCookie } from '../../_lib/auth'
import { validateBotCheck, type BotCheckPayload } from '../../_lib/bot'
import type { Env } from '../../_lib/db'

type LoginPayload = BotCheckPayload & {
  email?: string
  password?: string
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const body = (await request.json().catch(() => ({}))) as LoginPayload
  const email = String(body.email ?? '').trim()
  const password = String(body.password ?? '')
  const botError = validateBotCheck(body)

  if (botError) {
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
    return Response.json(
      {
        ok: false,
        error: 'ระบบเข้าสู่ระบบมีปัญหา กรุณาลองใหม่อีกครั้ง',
      },
      { status: 500 },
    )
  }
  if (!result) {
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
