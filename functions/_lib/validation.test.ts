import { describe, expect, it } from 'vitest'
import { boundedInteger, boundedText, normalizedEmail, passwordInput } from './input'
import { emailHtmlText, emailStatus } from './email'
import { mediaAccess, mediaPrice, mediaStatus, mediaText } from './media-validation'

describe('account input validation', () => {
  it('normalizes email and preserves password whitespace', () => {
    expect(normalizedEmail('  USER@Example.COM ')).toBe('user@example.com')
    expect(passwordInput(' password ')).toBe(' password ')
  })

  it('rejects malformed or oversized account input', () => {
    expect(() => normalizedEmail('not-an-email')).toThrow('รูปแบบอีเมลไม่ถูกต้อง')
    expect(() => passwordInput('short')).toThrow()
    expect(() => boundedText('123456', 'ชื่อ', { max: 5 })).toThrow()
  })

  it('accepts only bounded integers', () => {
    expect(boundedInteger('12', 'จำนวน', { min: 1, max: 20 })).toBe(12)
    expect(() => boundedInteger('1.5', 'จำนวน', { max: 20 })).toThrow()
    expect(() => boundedInteger(21, 'จำนวน', { max: 20 })).toThrow()
  })
})

describe('media validation', () => {
  it('normalizes legacy workflow statuses', () => {
    expect(mediaStatus('เผยแพร่')).toBe('เผยแพร่แล้ว')
    expect(mediaStatus('แบบร่าง')).toBe('ฉบับร่าง')
    expect(mediaStatus('ซ่อน')).toBe('ซ่อนชั่วคราว')
  })

  it('rejects invalid status, access and price values', () => {
    expect(() => mediaStatus('ลบทิ้ง')).toThrow('สถานะสื่อไม่ถูกต้อง')
    expect(() => mediaAccess('ผู้ดูแล')).toThrow('สิทธิ์การเข้าถึงไม่ถูกต้อง')
    expect(() => mediaPrice(-1)).toThrow()
    expect(() => mediaPrice(1.5)).toThrow()
    expect(() => mediaPrice(10_000_001)).toThrow()
  })

  it('trims media text and enforces its maximum length', () => {
    expect(mediaText('  คู่มือ AI  ', 'ชื่อสื่อ', 50)).toBe('คู่มือ AI')
    expect(() => mediaText('abcdef', 'ชื่อสื่อ', 5)).toThrow()
  })
})

describe('email readiness', () => {
  it('requires every password-reset email setting', () => {
    expect(emailStatus({})).toEqual({
      configured: false,
      apiKeyConfigured: false,
      fromConfigured: false,
      appUrlConfigured: false,
    })
    expect(emailStatus({
      RESEND_API_KEY: 're_test',
      EMAIL_FROM: 'MIKPURINUT <noreply@example.com>',
      APP_URL: 'https://example.com',
    }).configured).toBe(true)
  })

  it('escapes user-controlled email HTML', () => {
    expect(emailHtmlText('<b>"MIK" & team</b>')).toBe('&lt;b&gt;&quot;MIK&quot; &amp; team&lt;/b&gt;')
  })
})
