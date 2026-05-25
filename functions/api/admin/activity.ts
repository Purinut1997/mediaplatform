import { requireSuperAdmin } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireSuperAdmin(env, request))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const logs = await sql`
    select id, actor, action, target_type, target_id, detail, created_at
    from audit_logs
    order by created_at desc
    limit 150
  `

  return Response.json({
    ok: true,
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
