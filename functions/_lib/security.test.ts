import { describe, expect, it } from 'vitest'
import { onRequest as apiMiddleware } from '../api/_middleware'
import { canAccessLevel, hideProtectedLinks } from './media-access'
import { rateLimitResponse, requestIp } from './rate-limit'
import { safeHttpUrl } from './url'

const member = { name: 'Member', email: 'member@example.com', role: 'member' as const, access: 'สมาชิก' }
const vip = { ...member, access: 'VIP' }

describe('safeHttpUrl', () => {
  it('accepts public HTTPS URLs', () => {
    expect(safeHttpUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf')
  })

  it.each([
    'javascript:alert(1)',
    'http://localhost/admin',
    'http://127.0.0.1/private',
    'http://10.0.0.1/private',
    'http://192.168.1.1/private',
    'https://user:password@example.com/private',
  ])('rejects unsafe URL %s', (url) => {
    expect(safeHttpUrl(url)).toBe('')
  })
})

describe('media access', () => {
  it('enforces member and VIP levels', () => {
    expect(canAccessLevel(null, 'สาธารณะ')).toBe(true)
    expect(canAccessLevel(member, 'สมาชิก')).toBe(true)
    expect(canAccessLevel(member, 'VIP')).toBe(false)
    expect(canAccessLevel(vip, 'VIP')).toBe(true)
  })

  it('removes protected links from unauthorized viewers', () => {
    const media = hideProtectedLinks(
      {
        access: 'VIP',
        resourceUrl: 'https://example.com/file',
        previewUrl: 'https://example.com/preview',
        links: [
          {
            access: 'VIP',
            url: 'https://example.com/file',
            previewUrl: 'https://example.com/preview',
          },
        ],
      },
      member,
    )

    expect(media.resourceUrl).toBe('')
    expect(media.previewUrl).toBe('')
    expect(media.links[0].url).toBe('')
  })
})

describe('API middleware', () => {
  it('blocks cross-site mutations before calling the endpoint', async () => {
    let called = false
    const response = await apiMiddleware({
      request: new Request('https://example.com/api/settings', {
        method: 'POST',
        headers: { Origin: 'https://attacker.example' },
      }),
      next: async () => {
        called = true
        return Response.json({ ok: true })
      },
    })

    expect(response.status).toBe(403)
    expect(called).toBe(false)
  })

  it('blocks oversized mutations before calling the endpoint', async () => {
    let called = false
    const response = await apiMiddleware({
      request: new Request('https://example.com/api/settings', {
        method: 'POST',
        headers: { 'Content-Length': '512001' },
      }),
      next: async () => {
        called = true
        return Response.json({ ok: true })
      },
    })

    expect(response.status).toBe(413)
    expect(called).toBe(false)
  })

  it('adds hardened browser headers to API responses', async () => {
    const response = await apiMiddleware({
      request: new Request('https://example.com/api/health'),
      next: async () => Response.json({ ok: true }),
    })

    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'")
    expect(response.headers.get('Permissions-Policy')).toContain('camera=()')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  })
})

describe('rate-limit responses', () => {
  it('prefers Cloudflare IP and falls back to the first forwarded IP', () => {
    expect(requestIp(new Request('https://example.com', {
      headers: { 'CF-Connecting-IP': '203.0.113.7', 'X-Forwarded-For': '198.51.100.4, 198.51.100.5' },
    }))).toBe('203.0.113.7')
    expect(requestIp(new Request('https://example.com', {
      headers: { 'X-Forwarded-For': '198.51.100.4, 198.51.100.5' },
    }))).toBe('198.51.100.4')
  })

  it('returns a hardened 429 response with Retry-After', async () => {
    const response = rateLimitResponse(42)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    await expect(response.json()).resolves.toMatchObject({ ok: false, retryAfter: 42 })
  })
})
