import { getCurrentUser } from '../../_lib/auth'
import type { Env } from '../../_lib/db'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  const user = await getCurrentUser(env, request)
  return Response.json({ ok: true, user })
}
