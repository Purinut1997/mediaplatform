import { requireSuperAdmin, writeAuditLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireSuperAdmin(env, request))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const errors = await sql`
    select id, source, message, stack, detail, created_at
    from error_logs
    order by created_at desc
    limit 120
  `

  return Response.json({
    ok: true,
    errors: errors.map((error) => ({
      id: error.id,
      source: error.source,
      message: error.message,
      stack: error.stack,
      detail: error.detail ?? {},
      createdAt: error.created_at,
    })),
  })
}

export const onRequestDelete = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const url = new URL(request.url)
  const days = Number(url.searchParams.get('days') ?? 30)
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30
  const rows = await sql`
    delete from error_logs
    where created_at < now() - make_interval(days => ${safeDays})
    returning id
  `

  await writeAuditLog(env, currentUser, 'clear_error_logs', 'error_logs', null, {
    days: safeDays,
    rows: rows.length,
  })
  return Response.json({ ok: true, deleted: rows.length })
}
