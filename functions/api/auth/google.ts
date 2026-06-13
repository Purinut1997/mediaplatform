import type { Env } from '../../_lib/db'
import {
  googleAuthorizationUrl,
  googleOAuthConfigured,
  googleState,
  googleStateCookie,
} from '../../_lib/google-oauth'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!googleOAuthConfigured(env)) {
    return Response.redirect(`${new URL(request.url).origin}/?oauth=not_configured`, 302)
  }
  const state = googleState()
  const response = Response.redirect(googleAuthorizationUrl(env, state), 302)
  response.headers.append('Set-Cookie', googleStateCookie(state))
  return response
}
