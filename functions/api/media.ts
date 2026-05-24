import { ensureSchema, getSql, type Env } from '../_lib/db'

type MediaRow = {
  id: number
  title: string
  slug: string
  topic: string
  access_level: string
  status: string
  price: number
  downloads: number
  views: number
  rating: string | number
  cover_url: string
  source_type: string
  description: string
  created_at: string
  updated_at: string
}

function toMedia(row: MediaRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    topic: row.topic,
    access: row.access_level,
    status: row.status,
    price: row.price,
    downloads: row.downloads,
    views: row.views,
    rating: Number(row.rating),
    cover: row.cover_url,
    source: row.source_type,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const url = new URL(request.url)
  const topic = url.searchParams.get('topic')
  const status = url.searchParams.get('status') ?? 'เผยแพร่'

  const rows =
    topic && topic !== 'ทั้งหมด'
      ? await sql`
          select *
          from media
          where status = ${status} and topic = ${topic}
          order by updated_at desc, id desc
        `
      : await sql`
          select *
          from media
          where status = ${status}
          order by updated_at desc, id desc
        `

  return Response.json({
    ok: true,
    media: (rows as MediaRow[]).map(toMedia),
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const body = await request.json<Partial<ReturnType<typeof toMedia>>>()
  const title = String(body.title ?? '').trim()

  if (!title) {
    return Response.json({ ok: false, error: 'title is required' }, { status: 400 })
  }

  const slug =
    String(body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || `media-${Date.now()}`

  const [row] = (await sql`
    insert into media (
      title,
      slug,
      topic,
      access_level,
      status,
      price,
      cover_url,
      source_type,
      description
    )
    values (
      ${title},
      ${slug},
      ${body.topic ?? 'โรงเรียน'},
      ${body.access ?? 'สาธารณะ'},
      ${body.status ?? 'แบบร่าง'},
      ${body.price ?? 0},
      ${body.cover ?? ''},
      ${body.source ?? 'Google Drive'},
      ${body.description ?? ''}
    )
    returning *
  `) as MediaRow[]

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values ('superadmin', 'create', 'media', ${String(row.id)}, ${JSON.stringify({ title })}::jsonb)
  `

  return Response.json({ ok: true, media: toMedia(row) }, { status: 201 })
}
