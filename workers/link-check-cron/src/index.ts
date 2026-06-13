type Env = {
  SITE_ORIGIN?: string
  CRON_SECRET?: string
}

type ScheduledController = {
  cron: string
  scheduledTime: number
}

type ExecutionContext = {
  waitUntil(task: Promise<unknown>): void
}

const DEFAULT_SITE_ORIGIN = 'https://mediaplatform.pages.dev'

function cronSecret(env: Env) {
  const secret = env.CRON_SECRET?.trim()
  if (!secret) throw new Error('CRON_SECRET is not configured in this Worker')
  return secret
}

function siteOrigin(env: Env) {
  return (env.SITE_ORIGIN?.trim() || DEFAULT_SITE_ORIGIN).replace(/\/+$/, '')
}

async function triggerLinkCheck(env: Env, reason: string) {
  const secret = cronSecret(env)
  const endpoint = new URL('/api/cron/link-checks', siteOrigin(env))
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': secret,
    },
    body: JSON.stringify({ reason }),
  })
  const text = await response.text()
  const data = text ? parseJson(text) : null

  if (!response.ok) {
    throw new Error(`Link check cron failed: ${response.status} ${text}`)
  }

  return {
    ok: true,
    endpoint: endpoint.toString(),
    status: response.status,
    data,
  }
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export default {
  scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      triggerLinkCheck(env, `cron:${controller.cron}:${controller.scheduledTime}`).then((result) => {
        console.log('MIKPURINUT link check cron completed', result)
      }),
    )
  },

  async fetch(request: Request, env: Env) {
    if (request.method === 'POST') {
      const suppliedSecret =
        request.headers.get('x-cron-secret')?.trim() ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
      if (!suppliedSecret || suppliedSecret !== cronSecret(env)) {
        return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      }
      const result = await triggerLinkCheck(env, 'manual-fetch')
      return Response.json(result)
    }

    return Response.json({
      ok: true,
      worker: 'MIKPURINUT link check cron',
      target: `${siteOrigin(env)}/api/cron/link-checks`,
      manualRun: 'POST this Worker URL with x-cron-secret or Authorization: Bearer',
      secretConfigured: Boolean(env.CRON_SECRET?.trim()),
    })
  },
}
