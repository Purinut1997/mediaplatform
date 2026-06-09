import { describe, expect, it } from 'vitest'
import { canAccessLevel, hideProtectedLinks } from './media-access'
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
