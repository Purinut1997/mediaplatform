import { getCurrentUser } from '../_lib/auth'
import { ensureSchema, getSql, type Env } from '../_lib/db'

type CategoryRow = {
  id: number
  name: string
  slug: string
  sort_order: number
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  await ensureSchema(env)
  const sql = getSql(env)

  const rows = (await sql`
    select id, name, slug, sort_order
    from categories
    order by sort_order asc, name asc
  `) as CategoryRow[]

  return Response.json({
    ok: true,
    categories: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sort_order,
    })),
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await getCurrentUser(env, request)
  if (currentUser?.role !== 'superadmin') {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as { name?: string }
  const name = String(body.name ?? '').trim()
  if (!name) return Response.json({ ok: false, error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 })

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || `category-${Date.now()}`

  await sql`
    insert into categories (name, slug, sort_order)
    values (
      ${name},
      ${slug},
      (select coalesce(max(sort_order), 0) + 10 from categories)
    )
    on conflict (name) do update set name = excluded.name
  `

  return Response.json({ ok: true })
}
