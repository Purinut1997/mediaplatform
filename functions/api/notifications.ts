import { getCurrentUser } from '../_lib/auth'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { readPagination } from '../_lib/pagination'

type NotificationRow = {
  id: number
  audience: string
  type: string
  title: string
  detail: string
  tone: string
  target_type: string | null
  target_id: string | null
  read_at: string | null
  created_at: string
}

type PatchPayload = {
  action?: 'mark-read' | 'mark-all-read'
  id?: number
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const currentUser = await getCurrentUser(env, request)
  if (!currentUser) {
    return Response.json({ ok: true, notifications: [], unread: 0, total: 0 })
  }

  const sql = getSql(env)
  const { pageSize, offset } = readPagination(new URL(request.url), {
    defaultPageSize: 8,
    minPageSize: 5,
    maxPageSize: 50,
  })

  const isSuperAdmin = currentUser.role === 'superadmin'
  const isAdmin = currentUser.role === 'admin'

  const rows = (await sql`
    select id, audience, type, title, detail, tone, target_type, target_id, read_at, created_at
    from notifications
    where (
      ${isSuperAdmin}
      or (${isAdmin} and audience in ('admin', 'all'))
      or (audience = 'all')
    )
    order by read_at asc nulls first, created_at desc
    limit ${pageSize} offset ${offset}
  `) as NotificationRow[]

  const [countRow] = await sql`
    select
      count(*)::int as total,
      count(case when read_at is null then 1 end)::int as unread
    from notifications
    where (
      ${isSuperAdmin}
      or (${isAdmin} and audience in ('admin', 'all'))
      or (audience = 'all')
    )
  `

  return Response.json({
    ok: true,
    notifications: rows.map((row) => ({
      id: row.id,
      audience: row.audience,
      type: row.type,
      title: row.title,
      detail: row.detail,
      tone: row.tone,
      targetType: row.target_type,
      targetId: row.target_id,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    unread: countRow?.unread ?? 0,
    total: countRow?.total ?? 0,
  })
}

export const onRequestPatch = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const currentUser = await getCurrentUser(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as PatchPayload

  if (body.action === 'mark-read' && body.id) {
    await sql`update notifications set read_at = coalesce(read_at, now()) where id = ${body.id}`
    return Response.json({ ok: true })
  }

  if (body.action === 'mark-all-read') {
    const isSuperAdmin = currentUser.role === 'superadmin'
    const isAdmin = currentUser.role === 'admin'
    await sql`
      update notifications
      set read_at = coalesce(read_at, now())
      where read_at is null
        and (
          ${isSuperAdmin}
          or (${isAdmin} and audience in ('admin', 'all'))
          or (audience = 'all')
        )
    `
    return Response.json({ ok: true })
  }

  return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
}
