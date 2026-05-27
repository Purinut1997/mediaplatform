import { requireAdminPermission } from '../../_lib/admin'
import { type Env } from '../../_lib/db'
import { runLinkChecks } from '../../_lib/link-checker'

async function runChecks(env: Env, request: Request) {
  const currentUser = await requireAdminPermission(env, request, 'links:check')
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runLinkChecks(env, currentUser)
  return Response.json({ ok: true, ...result })
}

export const onRequestGet = ({ env, request }: { env: Env; request: Request }) => runChecks(env, request)
export const onRequestPost = ({ env, request }: { env: Env; request: Request }) => runChecks(env, request)
