import {
  ensureSchema,
  getSql,
  randomHex,
  sha256Hex,
  verifyPassword,
  type Env,
} from './db'

const SESSION_COOKIE = 'mp_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type UserRow = {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'superadmin' | 'admin' | 'member'
  access_level: 'VIP' | 'สมาชิก'
  status: 'active' | 'disabled'
}

export type PublicUser = {
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'member'
  access: 'VIP' | 'สมาชิก'
}

export function publicUser(user: UserRow): PublicUser {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    access: user.access_level,
  }
}

export async function loginWithPassword(env: Env, email: string, password: string) {
  await ensureSchema(env)
  const sql = getSql(env)
  const normalizedEmail = email.trim().toLowerCase()

  const [user] = (await sql`
    select id, name, email, password_hash, role, access_level, status
    from users
    where lower(email) = ${normalizedEmail}
    limit 1
  `) as UserRow[]

  if (!user || user.status !== 'active') return null
  if (!(await verifyPassword(password, user.password_hash))) return null

  return createSession(sql, user)
}

async function createSession(sql: ReturnType<typeof getSql>, user: UserRow) {
  const token = randomHex(32)
  const tokenHash = await sha256Hex(token)
  await sql`
    insert into sessions (user_id, token_hash, expires_at)
    values (${user.id}, ${tokenHash}, now() + interval '7 days')
  `

  return { token, user: publicUser(user) }
}

export async function getCurrentUser(env: Env, request: Request) {
  await ensureSchema(env)
  const token = readCookie(request.headers.get('Cookie') ?? '', SESSION_COOKIE)
  if (!token) return null

  const sql = getSql(env)
  const tokenHash = await sha256Hex(token)
  const [user] = (await sql`
    select users.id, users.name, users.email, users.password_hash, users.role, users.access_level, users.status
    from sessions
    join users on users.id = sessions.user_id
    where sessions.token_hash = ${tokenHash}
      and sessions.expires_at > now()
      and users.status = 'active'
    limit 1
  `) as UserRow[]

  return user ? publicUser(user) : null
}

export async function destroySession(env: Env, request: Request) {
  await ensureSchema(env)
  const token = readCookie(request.headers.get('Cookie') ?? '', SESSION_COOKIE)
  if (!token) return

  const sql = getSql(env)
  const tokenHash = await sha256Hex(token)
  await sql`delete from sessions where token_hash = ${tokenHash}`
}

export function sessionCookie(token: string) {
  return [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ].join('; ')
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function readCookie(cookieHeader: string, name: string) {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}
