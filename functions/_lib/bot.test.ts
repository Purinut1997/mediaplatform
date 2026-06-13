import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateBotCheck } from './bot'

afterEach(() => vi.unstubAllGlobals())

describe('bot validation', () => {
  it('rejects the honeypot field', async () => {
    await expect(validateBotCheck({ website: 'spam' })).resolves.toContain('พฤติกรรมอัตโนมัติ')
  })

  it('requires the fallback checkbox and minimum elapsed time', async () => {
    await expect(validateBotCheck({ botVerified: false })).resolves.toContain('กรุณายืนยัน')
    await expect(validateBotCheck({ botVerified: true, botStartedAt: Date.now() })).resolves.toContain('กรุณารอสักครู่')
    await expect(validateBotCheck({ botVerified: true, botStartedAt: Date.now() - 1500 })).resolves.toBe('')
  })

  it('does not call Turnstile when its token is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(validateBotCheck({}, 'secret')).resolves.toContain('กรุณายืนยัน')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a verified Turnstile token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true })))

    await expect(validateBotCheck({ turnstileToken: 'token' }, 'secret', '203.0.113.1')).resolves.toBe('')
  })

  it('fails closed when Turnstile is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))

    await expect(validateBotCheck({ turnstileToken: 'token' }, 'secret')).resolves.toContain('ไม่พร้อม')
  })
})
