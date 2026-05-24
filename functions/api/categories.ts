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
