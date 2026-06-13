import { describe, expect, it } from 'vitest'
import {
  clearGoogleStateCookie,
  googleAuthorizationUrl,
  googleOAuthConfigured,
  googleRedirectUri,
  googleStateCookie,
  readGoogleState,
} from './google-oauth'

const env = {
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  APP_URL: 'https://example.com/',
}

describe('Google OAuth configuration', () => {
  it('requires client credentials and application URL', () => {
    expect(googleOAuthConfigured(env)).toBe(true)
    expect(googleOAuthConfigured({ GOOGLE_CLIENT_ID: 'client-id' })).toBe(false)
  })

  it('builds the exact callback and authorization URL', () => {
    expect(googleRedirectUri(env)).toBe('https://example.com/api/auth/google/callback')
    const url = new URL(googleAuthorizationUrl(env, 'state-token'))
    expect(url.origin).toBe('https://accounts.google.com')
    expect(url.searchParams.get('redirect_uri')).toBe(googleRedirectUri(env))
    expect(url.searchParams.get('state')).toBe('state-token')
    expect(url.searchParams.get('scope')).toContain('email')
  })

  it('uses a hardened short-lived state cookie', () => {
    const cookie = googleStateCookie('state-token')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(readGoogleState(new Request('https://example.com', { headers: { Cookie: cookie } }))).toBe('state-token')
    expect(clearGoogleStateCookie()).toContain('Max-Age=0')
  })
})
