import { type Env } from '../../_lib/db'
import { runLinkChecks } from '../../_lib/link-checker'

function readSecret(request: Request) {
  const url = new URL(request.url)
  const auth = request.headers.get('Authorization') ?? ''
  return (
    request.headers.get('x-cron-secret') ??
    (auth.startsWith('Bearer ') ? auth.slice(7) : '') ??
    url.searchParams.get('secret') ??
    ''
  )
}

async function runCron(env: Env, request: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ ok: false, error: 'CRON_SECRET is not configured' }, { status: 501 })
  }

  if (readSecret(request) !== env.CRON_SECRET) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runLinkChecks(env, 'cloudflare-cron', {
    auditAction: 'cron_link_check',
    limit: 100,
  })
  return Response.json({ ok: true, ...result })
}

export const onRequestGet = ({ env, request }: { env: Env; request: Request }) => runCron(env, request)
export const onRequestPost = ({ env, request }: { env: Env; request: Request }) => runCron(env, request)
