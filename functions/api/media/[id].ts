import { requireAdminPermission } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { optionalHttpUrl } from '../../_lib/url'

const DEFAULT_COVER_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'

type MediaPayload = {
  title?: string
  topic?: string
  access?: string
  status?: string
  price?: number
  source?: string
  cover?: string
  resourceUrl?: string
  previewUrl?: string
  links?: Array<{
    label?: string
    type?: string
    url?: string
    previewUrl?: string
    access?: string
  }>
  tags?: string[] | string
  description?: string
}

type Context = {
  env: Env
  request: Request
  params: { id?: string }
}

async function requireSuperAdmin(env: Env, request: Request) {
  const currentUser = await requireAdminPermission(env, request, 'media:write')
  if (!currentUser) {
    return { ok: false as const, response: Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true as const, actor: currentUser.email }
}

function readId(params: Context['params']) {
  const id = Number(params.id)
  return Number.isInteger(id) && id > 0 ? id : 0
}

function readLinks(body: MediaPayload, title: string) {
  const links = Array.isArray(body.links) ? body.links : []
  if (links.length > 20) throw new Error('สื่อหนึ่งรายการเพิ่มลิงก์ได้สูงสุด 20 ลิงก์')
  const normalized = links
    .map((link, index) => ({
      label: String(link.label ?? '').trim() || `ลิงก์ ${index + 1}`,
      type: String(link.type ?? body.source ?? 'Google Drive'),
      url: optionalHttpUrl(link.url, `ลิงก์รายการที่ ${index + 1}`),
      previewUrl: optionalHttpUrl(link.previewUrl, `ลิงก์ตัวอย่างรายการที่ ${index + 1}`),
      access: String(link.access ?? body.access ?? 'สาธารณะ'),
    }))
    .filter((link) => link.url)

  const resourceUrl = optionalHttpUrl(body.resourceUrl, 'ลิงก์ไฟล์หลัก')
  if (!normalized.length && resourceUrl) {
    normalized.push({
      label: title,
      type: String(body.source ?? 'Google Drive'),
      url: resourceUrl,
      previewUrl: optionalHttpUrl(body.previewUrl, 'ลิงก์ตัวอย่าง'),
      access: String(body.access ?? 'สาธารณะ'),
    })
  }

  return normalized
}

function readTags(body: MediaPayload) {
  const raw = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags ?? '')
        .split(',')
  return Array.from(new Set(raw.map((tag) => String(tag).trim()).filter(Boolean))).slice(0, 12)
}

function tagSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/^-|-$/g, '') || 'tag'
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)
  return `${base}-${hash.toString(36)}`
}

async function saveTags(sql: ReturnType<typeof getSql>, mediaId: number, tags: string[]) {
  await sql`delete from media_tags where media_id = ${mediaId}`
  for (const name of tags) {
    const [tag] = await sql`
      insert into tags (name, slug)
      values (${name}, ${tagSlug(name)})
      on conflict (name) do update set name = excluded.name
      returning id
    `
    if (tag?.id) {
      await sql`
        insert into media_tags (media_id, tag_id)
        values (${mediaId}, ${tag.id})
        on conflict do nothing
      `
    }
  }
}

export const onRequestPut = async ({ env, request, params }: Context) => {
  const auth = await requireSuperAdmin(env, request)
  if (!auth.ok) return auth.response

  const id = readId(params)
  if (!id) return Response.json({ ok: false, error: 'Invalid media id' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const body = (await request.json().catch(() => ({}))) as MediaPayload
  const title = String(body.title ?? '').trim()
  if (!title || title.length > 200) {
    return Response.json({ ok: false, error: 'กรุณากรอกชื่อสื่อไม่เกิน 200 ตัวอักษร' }, { status: 400 })
  }
  if (String(body.description ?? '').length > 10_000) {
    return Response.json({ ok: false, error: 'รายละเอียดสื่อต้องไม่เกิน 10,000 ตัวอักษร' }, { status: 400 })
  }
  let links: ReturnType<typeof readLinks>
  let coverUrl: string
  try {
    links = readLinks(body, title)
    coverUrl = optionalHttpUrl(body.cover, 'ลิงก์ภาพหน้าปก') || DEFAULT_COVER_URL
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'ข้อมูลลิงก์ไม่ถูกต้อง' },
      { status: 400 },
    )
  }

  const [row] = await sql`
    update media
    set
      title = ${title},
      topic = ${body.topic ?? 'โรงเรียน'},
      access_level = ${body.access ?? 'สาธารณะ'},
      status = ${body.status ?? 'ฉบับร่าง'},
      price = ${Number(body.price ?? 0)},
      cover_url = ${coverUrl},
      source_type = ${body.source ?? 'Google Drive'},
      description = ${body.description ?? ''},
      updated_at = now()
    where id = ${id}
    returning id
  `
  if (!row) return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })

  await sql`delete from media_links where media_id = ${id}`
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index]
    await sql`
      insert into media_links (media_id, label, type, url, preview_url, access_level)
      values (
        ${id},
        ${link.label},
        ${link.type},
        ${link.url},
        ${link.previewUrl || null},
        ${link.access}
      )
    `
  }
  const tags = readTags(body)
  await saveTags(sql, id, tags)

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values (${auth.actor}, 'update', 'media', ${String(id)}, ${JSON.stringify({ title, tags })}::jsonb)
  `

  return Response.json({ ok: true })
}

export const onRequestDelete = async ({ env, request, params }: Context) => {
  const auth = await requireSuperAdmin(env, request)
  if (!auth.ok) return auth.response

  const id = readId(params)
  if (!id) return Response.json({ ok: false, error: 'Invalid media id' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const [row] = await sql`delete from media where id = ${id} returning title`
  if (!row) return Response.json({ ok: false, error: 'Media not found' }, { status: 404 })

  await sql`
    insert into audit_logs (actor, action, target_type, target_id, detail)
    values (${auth.actor}, 'delete', 'media', ${String(id)}, ${JSON.stringify({ title: row.title })}::jsonb)
  `

  return Response.json({ ok: true })
}
