import { clearSessionCookie, destroySession } from '../../_lib/auth'
import type { Env } from '../../_lib/db'

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await destroySession(env, request)
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearSessionCookie() } },
  )
}
