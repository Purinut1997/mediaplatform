import type { Env } from '../../_lib/db'

export const onRequestGet = async ({ env }: { env: Env }) =>
  Response.json({
    ok: true,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? '',
    googleEnabled: false,
    facebookEnabled: false,
  })
