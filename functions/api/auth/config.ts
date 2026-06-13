import type { Env } from '../../_lib/db'
import { emailStatus } from '../../_lib/email'
import { googleOAuthConfigured } from '../../_lib/google-oauth'

export const onRequestGet = async ({ env }: { env: Env }) =>
  Response.json({
    ok: true,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? '',
    passwordResetEnabled: emailStatus(env).configured,
    googleEnabled: googleOAuthConfigured(env),
    facebookEnabled: false,
  })
