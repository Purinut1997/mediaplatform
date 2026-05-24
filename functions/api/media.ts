import { ensureSchema, getSql, type Env } from '../_lib/db'

const DEFAULT_COVER_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'

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
  resource_url?: string | null
  preview_url?: string | null
  created_at: string
  updated_at: string
}

type MediaPayload = Partial<ReturnType<typeof toMedia>> & {
  resourceUrl?: string
  previewUrl?: string
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
    resourceUrl: row.resource_url ?? '',
    previewUrl: row.preview_url ?? '',
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
          select media.*, link.url as resource_url, link.preview_url
          from media
          left join lateral (
            select url, preview_url
            from media_links
            where media_links.media_id = media.id
            order by sort_order asc, id asc
            limit 1
          ) link on true
          where media.status = ${status} and media.topic = ${topic}
          order by updated_at desc, id desc
        `
      : await sql`
          select media.*, link.url as resource_url, link.preview_url
          from media
          left join lateral (
            select url, preview_url
            from media_links
            where media_links.media_id = media.id
            order by sort_order asc, id asc
            limit 1
          ) link on true
          where media.status = ${status}
          order by updated_at desc, id desc
        `

  return Response.json({
    ok: true,
    media: (rows as MediaRow[]).map(toMedia),
  })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  if (!env.ADMIN_WRITE_TOKEN) {
    return Response.json(
      { ok: false, error: 'ADMIN_WRITE_TOKEN is not configured' },
      { status: 501 },
    )
  }

  if (request.headers.get('x-admin-token') !== env.ADMIN_WRITE_TOKEN) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json()) as MediaPayload
  const title = String(body.title ?? '').trim()

  if (!title) {
    return Response.json({ ok: false, error: 'title is required' }, { status: 400 })
  }

  const slugBase =
    String(body.slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || 'media'
  const slug = `${slugBase}-${Date.now()}`
  const coverUrl = String(body.cover ?? '').trim() || DEFAULT_COVER_URL

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
      ${coverUrl},
      ${body.source ?? 'Google Drive'},
      ${body.description ?? ''}
    )
    returning *
  `) as MediaRow[]

  const resourceUrl = String(body.resourceUrl ?? '').trim()
  const previewUrl = String(body.previewUrl ?? '').trim()

  if (resourceUrl) {
    await sql`
      insert into media_links (
        media_id,
        label,
        type,
        url,
        preview_url,
        access_level
      )
      values (
        ${row.id},
        ${title},
        ${body.source ?? 'Google Drive'},
        ${resourceUrl},
        ${previewUrl || null},
        ${body.access ?? 'สาธารณะ'}
      )
    `
  }

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values ('superadmin', 'create', 'media', ${String(row.id)}, ${JSON.stringify({ title })}::jsonb)
  `

  return Response.json({ ok: true, media: toMedia(row) }, { status: 201 })
}
