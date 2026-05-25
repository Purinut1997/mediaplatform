import { getCurrentUser, type PublicUser } from './auth'
import { getSql, type Env } from './db'

export async function requireSuperAdmin(env: Env, request: Request) {
  const user = await getCurrentUser(env, request)
  return user?.role === 'superadmin' ? user : null
}

export async function writeAuditLog(
  env: Env,
  actor: PublicUser | string | null | undefined,
  action: string,
  targetType: string,
  targetId?: string | number | null,
  detail: Record<string, unknown> = {},
) {
  const sql = getSql(env)
  const actorName = typeof actor === 'string' ? actor : actor?.email ?? 'system'
  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values (${actorName}, ${action}, ${targetType}, ${targetId == null ? null : String(targetId)}, ${JSON.stringify(detail)}::jsonb)
  `
}

export async function writeErrorLog(
  env: Env,
  source: string,
  error: unknown,
  detail: Record<string, unknown> = {},
) {
  try {
    const sql = getSql(env)
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack ?? '' : ''
    await sql`
      insert into error_logs (source, message, stack, detail)
      values (${source}, ${message}, ${stack}, ${JSON.stringify(detail)}::jsonb)
    `
  } catch (logError) {
    console.error('Write error log failed', logError)
  }
}
