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
    })
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('password_hash')
    expect(result).not.toHaveProperty('status')
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
