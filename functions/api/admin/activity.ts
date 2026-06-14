import { requireSuperAdmin } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { readPagination } from '../../_lib/pagination'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireSuperAdmin(env, request))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const { page, pageSize, offset } = readPagination(new URL(request.url))
  const logs = await sql`
    select id, actor, action, target_type, target_id, detail, created_at
    from audit_logs
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `
  const [countRow] = await sql`select count(*)::int as total from audit_logs`

  return Response.json({
    ok: true,
    page,
    pageSize,
    total: Number(countRow?.total ?? 0),
    logs: logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      detail: log.detail ?? {},
      createdAt: log.created_at,
    })),
  })
}
