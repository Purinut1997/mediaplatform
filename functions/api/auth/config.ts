import type { Env } from '../../_lib/db'
import { emailStatus } from '../../_lib/email'

export const onRequestGet = async ({ env }: { env: Env }) =>
  Response.json({
    ok: true,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? '',
    passwordResetEnabled: emailStatus(env).configured,
    googleEnabled: false,
    facebookEnabled: false,
  })
