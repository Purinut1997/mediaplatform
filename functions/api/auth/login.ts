import { loginWithPassword, sessionCookie } from '../../_lib/auth'
import type { Env } from '../../_lib/db'

type LoginPayload = {
  email?: string
  password?: string
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const body = (await request.json().catch(() => ({}))) as LoginPayload
  const email = String(body.email ?? '').trim()
  const password = String(body.password ?? '')

  if (!email || !password) {
    return Response.json(
      { ok: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
      { status: 400 },
    )
  }

  const result = await loginWithPassword(env, email, password)
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
