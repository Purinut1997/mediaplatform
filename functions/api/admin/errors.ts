import { requireSuperAdmin } from '../../_lib/admin'
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
