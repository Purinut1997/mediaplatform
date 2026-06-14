import { describe, expect, it } from 'vitest'
import { clearSessionCookie, publicUser, sessionCookie, type UserRow } from './auth'
import { hashPassword, verifyPassword } from './db'

const user: UserRow = {
  id: 7,
  name: 'MIKPURINUT',
  email: 'admin@example.com',
  password_hash: 'secret-hash',
  role: 'superadmin',
  access_level: 'VIP',
  vip_expires_at: null,
  status: 'active',
}

describe('authentication security', () => {
  it('returns only public user fields', () => {
    const result = publicUser(user)

    expect(result).toEqual({
      name: 'MIKPURINUT',
      email: 'admin@example.com',
      role: 'superadmin',
      access: 'VIP',
      vipExpiresAt: null,
    })
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('password_hash')
    expect(result).not.toHaveProperty('status')
  })

  it('downgrades an expired member VIP session without affecting admins', () => {
    expect(publicUser({ ...user, role: 'member', vip_expires_at: '2020-01-01T00:00:00.000Z' }).access).toBe('สมาชิก')
    expect(publicUser({ ...user, role: 'admin', vip_expires_at: '2020-01-01T00:00:00.000Z' }).access).toBe('VIP')
  })

  it('creates a hardened session cookie', () => {
    const cookie = sessionCookie('session-token')

    expect(cookie).toContain('mp_session=session-token')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('Max-Age=604800')
  })

  it('clears the hardened session cookie', () => {
    const cookie = clearSessionCookie()

    expect(cookie).toContain('mp_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=0')
  })

  it('hashes passwords with a salt and rejects the wrong password', async () => {
    const hash = await hashPassword('correct-password', '00112233445566778899aabbccddeeff')

    expect(hash).toMatch(/^pbkdf2:00112233445566778899aabbccddeeff:[a-f0-9]{64}$/)
    await expect(verifyPassword('correct-password', hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
    await expect(verifyPassword('correct-password', 'invalid-hash')).resolves.toBe(false)
  })
})
