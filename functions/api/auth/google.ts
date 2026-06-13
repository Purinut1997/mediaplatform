import type { Env } from '../../_lib/db'
import {
  googleAuthorizationUrl,
  googleOAuthConfigured,
  oauthRedirect,
  googleState,
  googleStateCookie,
} from '../../_lib/google-oauth'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!googleOAuthConfigured(env)) {
    return oauthRedirect(`${new URL(request.url).origin}/?oauth=not_configured`)
  }
  const state = googleState()
  return oauthRedirect(googleAuthorizationUrl(env, state), {
    cookies: [googleStateCookie(state)],
  })
}
